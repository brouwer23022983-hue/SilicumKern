import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Cpu,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  StepForward,
  VideoOff,
  Zap,
} from 'lucide-react';
import { ArenaCanvas } from './components/ArenaCanvas';
import { EcosystemCanvas } from './components/EcosystemCanvas';
import { OutputConsole, type LogEntry } from './components/OutputConsole';
import { GenomeVisualizer } from './components/GenomeVisualizer';
import { BenchmarkView } from './components/BenchmarkView';
import { CodeExportView, GITHUB_URL } from './components/CodeExportView';
import { EvolutionChart, GenerationMetric } from './components/EvolutionChart';
import { InstructionSetView } from './components/InstructionSetView';
import {
  Agent,
  BitWidth,
  EnvSnapshot,
  OPCODE_TABLE,
  Opcode,
  PROG_LEN,
  TASKS,
  TaskId,
  VMState,
  advanceEcoZoneEvolution,
  advanceEcoMiStage,
  MI_STAGES,
  saveMiStageGenome,
  loadMiStageGenome,
  getDnaStrandStatus,
  createInitialEnv,
  createRandomGenome,
  evaluateAgentDetailed,
  createRng,
  createStarterGenome,
  createVMState,
  decodeInstruction,
  disassembleInstruction,
  encodeInstruction,
  formatHexBytes,
  runVMTick,
  stepEnvironment,
  stepSingleInstruction,
  updateEnvPorts,
} from './engine/machineVm';
import {
  CycleBudget,
  DetectedHardware,
  PeripheralMonitor,
  PopSizeOption,
  createPeripheralMonitor,
  detectHardwareAsync,
  detectHardwareSync,
  subscribeHardwareHotplug,
} from './engine/hardwareProbe';
import type { WorkerRequest, WorkerResponse } from './workers/evolutionWorker';

type ActiveView = 'workbench' | 'isa' | 'benchmark' | 'export';


const STORAGE_KEY = 'siliciumkern_saved_state_v2';

// The "Brain" — collects knowledge from all genomes and feeds it to the main avatar.
// Each zone has its own best genome, learned independently by the population.
// The brain reads these genomes and uses them to guide the main avatar,
// but does NOT force the population to use them.
const BRAIN_ZONE_KEYS: Record<string, string> = {
  zone0: 'siliciumkern_brain_zone0',  // House (homeostasis)
  zone1: 'siliciumkern_brain_zone1',  // Forest (arena)
  zone2: 'siliciumkern_brain_zone2',  // Puzzle (bitstream)
  zone3: 'siliciumkern_brain_zone3',  // Tower (hardware)
};

// Save the best genome for a specific zone in the brain
function saveBrainZone(zone: number, genome: Uint8Array): void {
  try {
    const key = BRAIN_ZONE_KEYS[`zone${zone}`];
    if (key) {
      window.localStorage.setItem(key, JSON.stringify(Array.from(genome)));
    }
  } catch { /* ignore */ }
}

// Load the best genome for a specific zone from the brain
function loadBrainZone(zone: number): Uint8Array | null {
  try {
    const key = BRAIN_ZONE_KEYS[`zone${zone}`];
    if (!key) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const arr = JSON.parse(raw) as number[];
    if (!Array.isArray(arr) || arr.length !== PROG_LEN * 4) return null;
    return new Uint8Array(arr);
  } catch {
    return null;
  }
}

interface SavedAgent {
  id: number;
  genome: number[];
  fitness: number;
  generationBorn: number;
}

interface SavedSession {
  taskId: TaskId;
  bitWidth: BitWidth;
  maxCycles?: CycleBudget;
  autoHardware?: boolean;
  allowSmc?: boolean;
  inheritSmc?: boolean;
  dualCore?: boolean;
  popSize: number;
  mutationRate: number;
  fromScratch: boolean;
  generation: number;
  bestGenome: number[];
  population: SavedAgent[];
  coPopulation?: SavedAgent[] | null;
  coBestFitness?: number | null;
  metrics: GenerationMetric[];
}

const VALID_TASKS: TaskId[] = ['homeostasis', 'arena', 'bitstream', 'hardware', 'ecosystem'];

function loadSavedSession(): SavedSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed || !Array.isArray(parsed.bestGenome) || parsed.bestGenome.length !== PROG_LEN * 4) {
      return null;
    }
    if (!VALID_TASKS.includes(parsed.taskId)) {
      parsed.taskId = 'homeostasis';
    }
    return parsed;
  } catch {
    return null;
  }
}

function initPopulation(
  popSize: number,
  taskId: TaskId,
  fromScratch: boolean,
  seed: number,
  bitWidth: BitWidth,
  dualCore: boolean = false
): Agent[] {
  const rng = createRng(seed);
  const agents: Agent[] = [];
  for (let i = 0; i < popSize; i++) {
    let genome: Uint8Array;
    // Every agent is fully independent — own genome, own navigation, own strategy
    // The dispatcher brain is only built for the main avatar, not the population
    genome =
      fromScratch || i > 0
        ? createRandomGenome(rng, bitWidth, { dualCore, isCoCore: false })
        : createStarterGenome(taskId);
    agents.push({
      id: i,
      genome,
      fitness: 0,
      generationBorn: 0,
    });
  }
  return agents;
}

function initCoPopulation(popSize: number, seed: number, bitWidth: BitWidth): Agent[] {
  const rng = createRng(seed);
  return Array.from({ length: popSize }, (_, i) => ({
    id: i,
    genome: createRandomGenome(rng, bitWidth, { dualCore: true, isCoCore: true }),
    fitness: 0,
    generationBorn: 0,
  }));
}

function formatRegHex(val: string, bitWidth: BitWidth): string {
  const bi = BigInt(val);
  const sw = bitWidth === 128 ? 64 : bitWidth;
  const masked = BigInt.asUintN(sw, bi);
  const hexDigits = sw / 4;
  const full = masked.toString(16).padStart(hexDigits, '0').toUpperCase();
  if (sw === 64) {
    return `0x${full.slice(0, 4)}..${full.slice(-4)}`;
  }
  return `0x${full}`;
}

function genomesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function App() {
  const initialSaved = useMemo(() => loadSavedSession(), []);
  const initialHardware = useMemo(() => detectHardwareSync(), []);

  const [detectedHw, setDetectedHw] = useState<DetectedHardware>(initialHardware);
  const [autoHardware, setAutoHardware] = useState<boolean>(
    initialSaved?.autoHardware ?? (initialSaved ? false : true)
  );

  const initialBitWidth: BitWidth = initialSaved?.bitWidth ?? initialHardware.recommendedBitWidth;
  const initialDualCore: boolean = initialSaved?.dualCore ?? initialHardware.recommendedDualCore;
  const initialPopSize: number = initialSaved?.popSize ?? initialHardware.recommendedPopSize;
  const initialMaxCycles: CycleBudget =
    initialSaved?.maxCycles ?? (initialSaved ? 24 : initialHardware.recommendedCycles);

  const [activeView, setActiveView] = useState<ActiveView>('workbench');
  const [taskId, setTaskId] = useState<TaskId>(initialSaved?.taskId ?? 'homeostasis');
  const [bitWidth, setBitWidth] = useState<BitWidth>(initialBitWidth);
  const [maxCycles, setMaxCycles] = useState<CycleBudget>(initialMaxCycles);
  const [allowSmc, setAllowSmc] = useState<boolean>(initialSaved?.allowSmc ?? true);
  const [inheritSmc, setInheritSmc] = useState<boolean>(initialSaved?.inheritSmc ?? false);
  const [dualCore, setDualCore] = useState<boolean>(initialDualCore);
  const [popSize, setPopSize] = useState<number>(initialPopSize);
  const [mutationRate, setMutationRate] = useState<number>(initialSaved?.mutationRate ?? 0.08);
  const [fromScratch, setFromScratch] = useState<boolean>(initialSaved?.fromScratch ?? true);

  const [generation, setGeneration] = useState<number>(initialSaved?.generation ?? 0);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<GenerationMetric[]>(initialSaved?.metrics ?? []);

  // MI training mode: 'single' = train one stage at a time, 'all' = all stages together
  const [miMode, setMiMode] = useState<'single' | 'all'>('all');
  const miModeRef = useRef<'single' | 'all'>('all');
  // DNA strand: which stages have completed genomes
  const [dnaStrand, setDnaStrand] = useState<boolean[]>(() => getDnaStrandStatus());

  const initialFreshPop = useMemo(() => {
    if (initialSaved && Array.isArray(initialSaved.population) && initialSaved.population.length > 0) {
      return initialSaved.population.map((a) => ({
        id: a.id,
        genome: new Uint8Array(a.genome),
        fitness: a.fitness,
        generationBorn: a.generationBorn,
      }));
    }
    return initPopulation(initialPopSize, 'homeostasis', true, 4242, initialBitWidth, initialDualCore);
  }, [initialSaved, initialPopSize, initialBitWidth, initialDualCore]);

  const [population, setPopulation] = useState<Agent[]>(initialFreshPop);
  const [coPopulation, setCoPopulation] = useState<Agent[] | null>(() => {
    if (
      initialSaved &&
      Array.isArray(initialSaved.coPopulation) &&
      initialSaved.coPopulation.length > 0
    ) {
      return initialSaved.coPopulation.map((a) => ({
        id: a.id,
        genome: new Uint8Array(a.genome),
        fitness: a.fitness,
        generationBorn: a.generationBorn,
      }));
    }
    if (initialDualCore) {
      return initCoPopulation(initialPopSize, 8484, initialBitWidth);
    }
    return null;
  });
  const [coBestFitness, setCoBestFitness] = useState<number | null>(
    initialSaved?.coBestFitness ?? null
  );
  const [bestGenome, setBestGenome] = useState<Uint8Array>(() =>
    initialSaved
      ? new Uint8Array(initialSaved.bestGenome)
      : new Uint8Array(initialFreshPop[0].genome)
  );
  const [bestCoGenome, setBestCoGenome] = useState<Uint8Array | null>(() => {
    if (
      initialSaved &&
      Array.isArray(initialSaved.coPopulation) &&
      initialSaved.coPopulation.length > 0
    ) {
      return new Uint8Array(initialSaved.coPopulation[0].genome);
    }
    return null;
  });

  // Output console log buffer
  const [logBuffer, setLogBuffer] = useState<LogEntry[]>([]);
  const maxLogLines = 500;

  const log = (text: string, type: LogEntry['type'] = 'info') => {
    setLogBuffer(prev => {
      const next = [...prev, { tick: env.tick, generation, text, type }];
      return next.length > maxLogLines ? next.slice(-maxLogLines) : next;
    });
  };

  const handleConsoleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const args = trimmed.split(/\s+/);
    const command = args[0];
    log(`> ${cmd}`, 'command');
    if (command === 'clear' || command === 'cls') {
      setLogBuffer([]);
      log('Console leeggemaakt.', 'system');
    } else if (command === 'help') {
      log('Commando\'s: help, clear, status, reset, evolve, genome, ports, regs, ram, xmm, flags, env, score, brain', 'info');
    } else if (command === 'status') {
      log(`Generatie: ${generation} | Fitness: ${(coBestFitness ?? 0).toFixed(1)} | Taak: ${taskId} | Tick: ${env.tick}`, 'info');
      log(`Temp: ${Math.round(env.ecoTemp)}°C | Energie: ${Math.round(env.energy)}% | Queue: ${Math.round(env.ecoQueue)}`, 'info');
    } else if (command === 'reset') {
      log('Reset wordt gestart...', 'info');
      resetLivePreview(taskId);
    } else if (command === 'evolve') {
      log('Evolutie wordt gestart...', 'info');
      setIsEvolving(true);
    } else if (command === 'genome') {
      const g = bestGenomeRef.current;
      const disasm: string[] = [];
      for (let i = 0; i < Math.min(16, PROG_LEN); i++) {
        const inst = decodeInstruction(g, i);
        disasm.push(`  @${i.toString(16).padStart(2,'0')}: ${disassembleInstruction(inst)}`);
      }
      log(`Top ${disasm.length} instructies van beste genome:\n${disasm.join('\n')}`, 'info');
    } else if (command === 'ports') {
      const portsStr = env.ports.map((p, i) => `P${i}=${p}`).join(' ');
      log(`Huidige poorten: ${portsStr}`, 'info');
    } else if (command === 'regs') {
      const vm = vmRef.current;
      const regsStr = Array.from(vm.regs).map((r, i) => `R${i}=0x${BigInt.asIntN(32, r).toString(16).padStart(8,'0')}`).join('  ');
      log(`Registers: ${regsStr}`, 'register');
    } else if (command === 'ram') {
      const vm = vmRef.current;
      const ramStr = Array.from(vm.ram).map((r, i) => `RAM[${i}]=0x${BigInt.asIntN(32, r).toString(16).padStart(8,'0')}`).join('  ');
      log(`RAM: ${ramStr}`, 'register');
    } else if (command === 'xmm') {
      const vm = vmRef.current;
      const xmmStr: string[] = [];
      for (let v = 0; v < 4; v++) {
        const lanes = [];
        for (let l = 0; l < 4; l++) lanes.push(vm.xmm[v * 4 + l].toString());
        xmmStr.push(`XMM${v}=[${lanes.join(', ')}]`);
      }
      log(`SIMD: ${xmmStr.join('  ')}`, 'register');
    } else if (command === 'flags') {
      const vm = vmRef.current;
      log(`Flags: ZF=${vm.zf ? '1' : '0'}  CF=${vm.cf ? '1' : '0'}  SF=${vm.sf ? '1' : '0'}  IP=@${vm.ip.toString(16).padStart(2,'0')}  Cycles=${vm.cyclesUsed}/${maxCyclesRef.current}`, 'register');
    } else if (command === 'env') {
      log(`Omgeving: tick=${env.tick} | temp=${Math.round(env.ecoTemp)}°C | energy=${Math.round(env.energy)}% | queue=${Math.round(env.ecoQueue)}`, 'info');
      if (env.taskId === 'ecosystem') {
        log(`Brein: H-score=${env.ecoHomeoScore.toFixed(0)} A-score=${env.ecoArenaScore.toFixed(0)} B-score=${env.ecoBitScore.toFixed(0)} HW-score=${env.ecoHwScore.toFixed(0)}`, 'info');
        log(`Brein: arena=(${env.ecoArenaX},${env.ecoArenaY}) | bit=0x${env.ecoBitCurr.toString(16)} | hwA=0x${env.ecoHwStreamA.toString(16)}`, 'info');
      }
    } else if (command === 'score') {
      log(`Score: totaal=${env.cumulativeScore.toFixed(1)} | delta=${env.rewardDelta.toFixed(1)} | alive=${env.alive}`, 'info');
      if (env.taskId === 'ecosystem') {
        log(`Sub-scores: H=${env.ecoHomeoScore.toFixed(1)} A=${env.ecoArenaScore.toFixed(1)} B=${env.ecoBitScore.toFixed(1)} HW=${env.ecoHwScore.toFixed(1)}`, 'info');
      }
    } else if (command === 'brain') {
      if (taskId === 'ecosystem') {
        const miStage = env.ecoMiStage;
        const miName = MI_STAGES[miStage]?.name ?? '?';
        const miIcon = MI_STAGES[miStage]?.icon ?? '';
        log(`🧠 Brein Status: ${miIcon} ${miName} (Gen ${env.ecoMiStageGenerations}/${env.ecoMiStageGenTarget})`, 'info');
        log(`Dag: #${env.ecoDayNumber} | Tijd: ${env.ecoTimeOfDay}/100`, 'info');
      } else {
        log('Brein commando werkt alleen in ecosystem modus.', 'warning');
      }
    } else if (command === 'smc') {
      const vm = vmRef.current;
      const logEntries = vm.smcLog;
      if (logEntries.length === 0) {
        log('🔧 SMC Log: Geen self-modifying code events gedetecteerd.', 'info');
        log('   PWRITE instructies herschrijven het genome tijdens runtime.', 'info');
        log('   Als het genome leert zichzelf te verbeteren, verschijnen de events hier.', 'info');
      } else {
        log(`🔧 SMC Log: ${logEntries.length} self-modifying events gedetecteerd.`, 'info');
        const recent = logEntries.slice(-10);
        for (const entry of recent) {
          log(`   @${entry.tick} slot=${entry.slot}: ${entry.oldMnemonic} → ${entry.newMnemonic}`, 'action');
        }
        if (logEntries.length > 10) {
          log(`   ... en ${logEntries.length - 10} oudere events.`, 'info');
        }
      }
    } else {
      log(`Onbekend commando: "${cmd}". Typ "help" voor beschikbare commando's.`, 'warning');
    }
  };

  const [env, setEnv] = useState<EnvSnapshot>(() =>
    createInitialEnv(initialSaved?.taskId ?? 'homeostasis', 9001, initialHardware.capabilityMask)
  );
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [vmSnapshot, setVmSnapshot] = useState<{
    regs: string[];
    xmm: number[][];
    ram: string[];
    bus: number[];
    activeCode: Uint8Array;
    smcModified: number[];
    ip: number;
    zf: boolean;
    cf: boolean;
    sf: boolean;
    out: number;
    cyclesUsed: number;
    totalCycles: number;
    hitCounts: number[];
    lastRamRead: number;
    lastRamWrite: number;
    lastBusRead: number;
    lastBusWrite: number;
  }>(() => ({
    regs: Array(8).fill('0'),
    xmm: Array.from({ length: 4 }, () => [0, 0, 0, 0]),
    ram: Array(16).fill('0'),
    bus: Array(8).fill(0),
    activeCode: new Uint8Array(bestGenome),
    smcModified: Array(PROG_LEN).fill(0),
    ip: 0,
    zf: false,
    cf: false,
    sf: false,
    out: 0,
    cyclesUsed: 0,
    totalCycles: 0,
    hitCounts: Array(PROG_LEN).fill(0),
    lastRamRead: -1,
    lastRamWrite: -1,
    lastBusRead: -1,
    lastBusWrite: -1,
  }));

  const [selectedInstIdx, setSelectedInstIdx] = useState<number | null>(null);

  const vmRef = useRef<VMState>(createVMState(bestGenome));
  const vmBRef = useRef<VMState>(createVMState(bestCoGenome ?? bestGenome));
  const sharedBusRef = useRef<Int32Array>(new Int32Array(8));
  const envRef = useRef<EnvSnapshot>(
    createInitialEnv(initialSaved?.taskId ?? 'homeostasis', 9001, initialHardware.capabilityMask)
  );
  const simRngRef = useRef<() => number>(createRng(77777));
  const pendingDisturbanceRef = useRef<{ tempSpike?: number; loadSpike?: number; energyDip?: number }>({});
  const peripheralMonitorRef = useRef<PeripheralMonitor | null>(null);
  const detectedHwRef = useRef<DetectedHardware>(detectedHw);
  detectedHwRef.current = detectedHw;

  const workerRefs = useRef<Worker[]>([]);
  const sessionIdRef = useRef<number>(1);
  const workerCountRef = useRef<number>(1); // Aantal workers in de pool

  const bestGenomeRef = useRef<Uint8Array>(bestGenome);
  bestGenomeRef.current = bestGenome;

  const bestCoGenomeRef = useRef<Uint8Array | null>(bestCoGenome);
  bestCoGenomeRef.current = bestCoGenome;

  const populationRef = useRef<Agent[]>(population);
  populationRef.current = population;

  const coPopulationRef = useRef<Agent[] | null>(coPopulation);
  coPopulationRef.current = coPopulation;

  const generationRef = useRef<number>(generation);
  generationRef.current = generation;

  const taskIdRef = useRef<TaskId>(taskId);
  taskIdRef.current = taskId;

  const bitWidthRef = useRef<BitWidth>(bitWidth);
  bitWidthRef.current = bitWidth;

  const maxCyclesRef = useRef<CycleBudget>(maxCycles);
  maxCyclesRef.current = maxCycles;

  const autoHardwareRef = useRef<boolean>(autoHardware);
  autoHardwareRef.current = autoHardware;

  const allowSmcRef = useRef<boolean>(allowSmc);
  allowSmcRef.current = allowSmc;

  const inheritSmcRef = useRef<boolean>(inheritSmc);
  inheritSmcRef.current = inheritSmc;

  const dualCoreRef = useRef<boolean>(dualCore);
  dualCoreRef.current = dualCore;

  const mutationRateRef = useRef<number>(mutationRate);
  mutationRateRef.current = mutationRate;

  const syncVmToState = useCallback(() => {
    const v = vmRef.current;
    const xmmGroups: number[][] = [];
    for (let x = 0; x < 4; x++) {
      xmmGroups.push([v.xmm[x * 4], v.xmm[x * 4 + 1], v.xmm[x * 4 + 2], v.xmm[x * 4 + 3]]);
    }
    setVmSnapshot({
      regs: Array.from(v.regs, (r) => r.toString()),
      xmm: xmmGroups,
      ram: Array.from(v.ram, (w) => w.toString()),
      bus: Array.from(sharedBusRef.current),
      activeCode: new Uint8Array(allowSmcRef.current ? v.activeCode : bestGenomeRef.current),
      smcModified: Array.from(v.smcModified),
      ip: v.ip,
      zf: v.zf,
      cf: v.cf,
      sf: v.sf,
      out: v.out,
      cyclesUsed: v.cyclesUsed,
      totalCycles: v.totalCycles,
      hitCounts: Array.from(v.hitCounts),
      lastRamRead: v.lastRamRead,
      lastRamWrite: v.lastRamWrite,
      lastBusRead: v.lastBusRead,
      lastBusWrite: v.lastBusWrite,
    });
  }, []);

  const resetLivePreview = useCallback(
    (nextTask: TaskId, genomeOverride?: Uint8Array, coGenomeOverride?: Uint8Array | null) => {
      const targetGenome = genomeOverride ?? bestGenomeRef.current;
      const coGenome =
        coGenomeOverride !== undefined
          ? (coGenomeOverride ?? targetGenome)
          : (bestCoGenomeRef.current ?? coPopulationRef.current?.[0]?.genome ?? targetGenome);
      const freshEnv = createInitialEnv(
        nextTask,
        Math.floor(Date.now() % 100000) + 17,
        detectedHwRef.current.capabilityMask
      );
      const freshVm = createVMState(targetGenome);
      const freshVmB = createVMState(coGenome);
      sharedBusRef.current = new Int32Array(8);
      envRef.current = freshEnv;
      vmRef.current = freshVm;
      vmBRef.current = freshVmB;
      simRngRef.current = createRng(Math.floor(Date.now() % 100000) + 99);
      pendingDisturbanceRef.current = {};
      if (genomeOverride) {
        bestGenomeRef.current = new Uint8Array(genomeOverride);
        setBestGenome(new Uint8Array(genomeOverride));
      }
      if (coGenomeOverride !== undefined) {
        const cloned = coGenomeOverride ? new Uint8Array(coGenomeOverride) : null;
        bestCoGenomeRef.current = cloned;
        setBestCoGenome(cloned);
      }
      setEnv({ ...freshEnv });
      syncVmToState();
    },
    [syncVmToState]
  );

  const syncWorkerState = useCallback(
    (
      nextPop: Agent[],
      nextCoPop: Agent[] | null,
      nextTask: TaskId,
      nextGen: number,
      nextWidth: BitWidth,
      nextDualCore: boolean,
      stopEvolution: boolean = false,
      nextCycles: CycleBudget = maxCyclesRef.current,
      nextInitialEnv: EnvSnapshot | null = null
    ) => {
      const workers = workerRefs.current;
      if (workers.length === 0) return;
      const nextSession = ++sessionIdRef.current;
      if (stopEvolution) {
        for (const w of workers) {
          w.postMessage({ type: 'stop' } satisfies WorkerRequest);
        }
      }
      const workerCount = workers.length;
      for (let i = 0; i < workerCount; i++) {
        const syncMsg: WorkerRequest = {
          type: 'sync',
          sessionId: nextSession,
          population: nextPop,
          coPopulation: nextCoPop,
          taskId: nextTask,
          generation: nextGen,
          mutationRate: mutationRateRef.current,
          bitWidth: nextWidth,
          allowSmc: allowSmcRef.current,
          inheritSmc: inheritSmcRef.current,
          dualCore: nextDualCore,
          maxCycles: nextCycles,
          workerIndex: i,
          totalWorkers: workerCount,
          initialEnv: nextInitialEnv,
        };
        workers[i].postMessage(syncMsg);
      }
    },
    []
  );

  // Preserve ecosystem environment between task switches so the avatar
  // keeps its position, day phase, and memory. Only reset on explicit restart.
  const ecoEnvRef = useRef<EnvSnapshot | null>(null);

  const handleResetAll = useCallback(
    (
      nextTask: TaskId = taskId,
      nextPopSize: number = popSize,
      nextScratch: boolean = fromScratch,
      nextWidth: BitWidth = bitWidth,
      nextDualCore: boolean = dualCoreRef.current,
      nextCycles: CycleBudget = maxCyclesRef.current
    ) => {
      setIsEvolving(false);
      setIsSimRunning(false); // Pause live sim when switching tasks — avatar shouldn't move without user action
      const seed = Math.floor(Date.now() % 100000) + 313;
      const newPop = initPopulation(
        nextPopSize,
        nextTask,
        nextScratch,
        seed,
        nextWidth,
        nextDualCore
      );
      const newCoPop = nextDualCore
        ? initCoPopulation(nextPopSize, seed + 7919, nextWidth)
        : null;
      const firstCo = newCoPop ? new Uint8Array(newCoPop[0].genome) : null;

      setPopulation(newPop);
      populationRef.current = newPop;
      setCoPopulation(newCoPop);
      coPopulationRef.current = newCoPop;
      setCoBestFitness(null);
      setGeneration(0);
      generationRef.current = 0;
      setMetrics([]);
      setSelectedInstIdx(null);

      // For ecosystem: preserve the live environment state (position, day phase, memory)
      // so the avatar continues from where it was. Only reset if switching FROM ecosystem
      // to another task, then restore when switching back.
      if (nextTask === 'ecosystem') {
        // For ecosystem: always use the starter genome for live preview
        // so the avatar navigates correctly even before evolution starts
        const ecoStarter = createStarterGenome('ecosystem');
        if (ecoEnvRef.current) {
          // Restore preserved ecosystem environment
          const preserved = ecoEnvRef.current;
          envRef.current = preserved;
          const freshVm = createVMState(ecoStarter);
          vmRef.current = freshVm;
          if (nextDualCore) {
            const coKernel = firstCo ?? ecoStarter;
            vmBRef.current = createVMState(coKernel);
          }
          setEnv({
            ...preserved,
            history: [...preserved.history],
            trail: [...preserved.trail],
            bitStreamHistory: [...preserved.bitStreamHistory],
            ecoArenaNodes: preserved.ecoArenaNodes.map((n: {x:number;y:number}) => ({ x: n.x, y: n.y })),
            ecoArenaHazards: preserved.ecoArenaHazards.map((h: {x:number;y:number}) => ({ x: h.x, y: h.y })),
          });
          syncVmToState();
        } else {
          // First time: create fresh ecosystem env with starter genome
          resetLivePreview(nextTask, ecoStarter, firstCo);
        }
      } else {
        // Switching away from ecosystem: save the current ecosystem state
        if (taskIdRef.current === 'ecosystem') {
          ecoEnvRef.current = { ...envRef.current };
        }
        resetLivePreview(nextTask, newPop[0].genome, firstCo);
      }

      syncWorkerState(
        newPop,
        newCoPop,
        nextTask,
        0,
        nextWidth,
        nextDualCore,
        true,
        nextCycles
      );
    },
    [taskId, popSize, fromScratch, bitWidth, resetLivePreview, syncWorkerState]
  );

  const applyHardwareProfile = useCallback(
    (hw: DetectedHardware, forceResetIfPopChanged: boolean = true) => {
      setAutoHardware(true);
      autoHardwareRef.current = true;
      setBitWidth(hw.recommendedBitWidth);
      bitWidthRef.current = hw.recommendedBitWidth;
      setMaxCycles(hw.recommendedCycles);
      maxCyclesRef.current = hw.recommendedCycles;
      setDualCore(hw.recommendedDualCore);
      dualCoreRef.current = hw.recommendedDualCore;

      if (hw.recommendedPopSize !== populationRef.current.length && forceResetIfPopChanged) {
        setPopSize(hw.recommendedPopSize);
        handleResetAll(
          taskIdRef.current,
          hw.recommendedPopSize,
          fromScratch,
          hw.recommendedBitWidth,
          hw.recommendedDualCore,
          hw.recommendedCycles
        );
        return;
      }

      if (hw.recommendedDualCore && !coPopulationRef.current) {
        const newCoPop = initCoPopulation(
          populationRef.current.length,
          Math.floor(Date.now() % 100000) + 8484,
          hw.recommendedBitWidth
        );
        const firstCo = new Uint8Array(newCoPop[0].genome);
        setCoPopulation(newCoPop);
        coPopulationRef.current = newCoPop;
        setBestCoGenome(firstCo);
        bestCoGenomeRef.current = firstCo;
        vmBRef.current = createVMState(firstCo);
        syncWorkerState(
          populationRef.current,
          newCoPop,
          taskIdRef.current,
          generationRef.current,
          hw.recommendedBitWidth,
          true,
          false,
          hw.recommendedCycles
        );
      }
    },
    [fromScratch, handleResetAll, syncWorkerState]
  );

  const runOneGeneration = useCallback(() => {
    const workers = workerRefs.current;
    if (workers.length === 0) return;
    const msg: WorkerRequest = { type: 'step', sessionId: sessionIdRef.current };
    for (const w of workers) {
      w.postMessage(msg);
    }
  }, []);

  const stepOneTick = useCallback(() => {
    if (!envRef.current.alive) {
      resetLivePreview(taskId);
      return;
    }
    if (dualCoreRef.current) {
      const coKernel =
        bestCoGenomeRef.current ?? coPopulationRef.current?.[0]?.genome ?? bestGenomeRef.current;
      runVMTick(
        coKernel,
        vmBRef.current,
        envRef.current.ports,
        bitWidthRef.current,
        maxCyclesRef.current,
        { allowSmc: allowSmcRef.current, sharedBus: sharedBusRef.current }
      );
    }
    const { action, didAct } = runVMTick(
      bestGenomeRef.current,
      vmRef.current,
      envRef.current.ports,
      bitWidthRef.current,
      maxCyclesRef.current,
      { allowSmc: allowSmcRef.current, sharedBus: sharedBusRef.current }
    );
    const dist = pendingDisturbanceRef.current;
    pendingDisturbanceRef.current = {};
    const livePeripheral = peripheralMonitorRef.current?.sampleFrame(
      detectedHwRef.current.capabilityMask
    );
    stepEnvironment(envRef.current, action, didAct, simRngRef.current, dist, livePeripheral);
    // Log tick output
    const e = envRef.current;
    const vm = vmRef.current;
    // Log first few instructions executed this tick (instruction type)
    const instsToLog = Math.min(6, PROG_LEN);
    const instLines: string[] = [];
    for (let i = 0; i < instsToLog; i++) {
      const inst = decodeInstruction(bestGenomeRef.current, i);
      if (inst.opcode !== 0) { // skip NOP
        instLines.push(disassembleInstruction(inst));
      }
    }
    if (instLines.length > 0) {
      log(`@${(vm.ip).toString(16).padStart(2,'0')} ${instLines.join(' → ')}`, 'instruction');
    }
    // Log action output (action type)
    if (didAct) {
      if (e.taskId === 'ecosystem') {
        log(`ACT H=${e.ecoHomeoAction} A=${e.ecoArenaAction} B=0x${e.ecoBitPrediction.toString(16).padStart(2,'0')} HW=0x${e.ecoHwPrediction.toString(16).padStart(2,'0')}`, 'action');
      } else {
        log(`ACT=${action}`, 'action');
      }
    }
    // Log score summary (info type)
    if (e.taskId === 'ecosystem') {
      log(`Tick ${e.tick}: Score=${e.cumulativeScore.toFixed(0)} | H=${e.ecoHomeoScore.toFixed(0)} A=${e.ecoArenaScore.toFixed(0)} B=${e.ecoBitScore.toFixed(0)} HW=${e.ecoHwScore.toFixed(0)}`, 'info');
    } else {
      log(`Tick ${e.tick}: score=${e.cumulativeScore.toFixed(0)}`, 'info');
    }
    setEnv({
      ...envRef.current,
      history: [...envRef.current.history],
      trail: [...envRef.current.trail],
      bitStreamHistory: [...envRef.current.bitStreamHistory],
      // Deep copy ecosystem arrays so React detects changes
      ecoArenaNodes: envRef.current.ecoArenaNodes.map((n: {x:number;y:number}) => ({ x: n.x, y: n.y })),
      ecoArenaHazards: envRef.current.ecoArenaHazards.map((h: {x:number;y:number}) => ({ x: h.x, y: h.y })),
    });
    syncVmToState();
  }, [taskId, resetLivePreview, syncVmToState]);

  const stepOneInstruction = useCallback(() => {
    setIsSimRunning(false);
    const res = stepSingleInstruction(
      bestGenomeRef.current,
      vmRef.current,
      envRef.current.ports,
      bitWidthRef.current,
      { allowSmc: allowSmcRef.current, sharedBus: sharedBusRef.current }
    );
    if (res.acted) {
      const dist = pendingDisturbanceRef.current;
      pendingDisturbanceRef.current = {};
      const livePeripheral = peripheralMonitorRef.current?.sampleFrame(
        detectedHwRef.current.capabilityMask
      );
      stepEnvironment(
        envRef.current,
        vmRef.current.out,
        true,
        simRngRef.current,
        dist,
        livePeripheral
      );
      vmRef.current.ip = 0;
      vmRef.current.cyclesUsed = 0;
      setEnv({
        ...envRef.current,
        history: [...envRef.current.history],
        trail: [...envRef.current.trail],
        bitStreamHistory: [...envRef.current.bitStreamHistory],
      });
    }
    syncVmToState();
  }, [syncVmToState]);

  // Persistent Evolution Web Worker Pool lifecycle (non-blocking UI)
  // Gebruikt recommendedWorkerCount workers (helft van beschikbare threads)
  useEffect(() => {
    const workerCount = Math.max(1, detectedHw.recommendedWorkerCount);
    workerCountRef.current = workerCount;
    const workers: Worker[] = [];

    for (let i = 0; i < workerCount; i++) {
      const w = new Worker(new URL('./workers/evolutionWorker.ts', import.meta.url), {
        type: 'module',
      });
      workers.push(w);
    }
    workerRefs.current = workers;

    // Buffer om resultaten van alle workers te verzamelen per generatie
    const generationResultsRef = {
      pending: 0,
      results: [] as WorkerResponse[],
      targetSession: 0,
    };

    for (let i = 0; i < workerCount; i++) {
      const w = workers[i];
      w.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if (!msg || msg.type !== 'generation') return;
        if (msg.sessionId !== sessionIdRef.current) return;

        // Voeg resultaat toe aan buffer
        generationResultsRef.results.push(msg);

        // Als alle workers hebben gerapporteerd, voeg resultaten samen
        if (generationResultsRef.results.length === workerCount) {
          // Combineer alle sub-populaties
          const allPop: Agent[] = [];
          const allCoPop: Agent[] = [];
          let bestFitness = -Infinity;
          let meanFitnessSum = 0;
          // Fallback: als geen enkele agent overleefde, gebruik het starter genome
          let bestGenome: Uint8Array = createStarterGenome(taskIdRef.current);
          let bestCoGenome: Uint8Array | null = null;
          let coBestFitness: number | null = null;
          let maxGeneration = 0;

          for (const r of generationResultsRef.results as WorkerResponse[]) {
            if (r.type !== 'generation') continue;
            allPop.push(...r.nextPopulation);
            if (r.nextCoPopulation) allCoPop.push(...r.nextCoPopulation);
            if (r.bestFitness > bestFitness) {
              bestFitness = r.bestFitness;
              bestGenome = new Uint8Array(r.bestGenome);
            }
            meanFitnessSum += r.meanFitness;
            if (r.coBestFitness !== null) {
              if (coBestFitness === null || r.coBestFitness > coBestFitness) {
                coBestFitness = r.coBestFitness;
                bestCoGenome = r.coGenome ? new Uint8Array(r.coGenome) : null;
              }
            }
            if (r.generation > maxGeneration) maxGeneration = r.generation;
          }

          const meanFitness = meanFitnessSum / workerCount;
          const bestChanged = !genomesEqual(bestGenomeRef.current, bestGenome);

          populationRef.current = allPop;
          coPopulationRef.current = allCoPop.length > 0 ? allCoPop : null;
          generationRef.current = maxGeneration;
          bestGenomeRef.current = bestGenome;
          bestCoGenomeRef.current = bestCoGenome;

          setPopulation(allPop);
          setCoPopulation(coPopulationRef.current);
          setCoBestFitness(coBestFitness);
          setGeneration(maxGeneration);
          setBestGenome(bestGenome);
          setBestCoGenome(bestCoGenome);

          setMetrics((prev) => {
            const updated = [
              ...prev,
              {
                generation: maxGeneration,
                bestFitness,
                meanFitness,
              },
            ];
            return updated.length > 120 ? updated.slice(updated.length - 120) : updated;
          });

          // For ecosystem: advance zone-based evolution AND MI stage after each generation
          if (taskIdRef.current === 'ecosystem') {
            advanceEcoZoneEvolution(envRef.current);
            const miSwitched = advanceEcoMiStage(envRef.current);
            if (miSwitched) {
              // MI stage switched — save the best genome of the previous stage to DNA strand
              const prevStage = (envRef.current.ecoMiStage + 5) % 6; // stage we just left
              saveMiStageGenome(prevStage, bestGenome);
              // Update DNA strand status
              setDnaStrand(getDnaStrandStatus());
              // Update the UI to reflect the new stage
              setEnv({ ...envRef.current });
            }
            if (!envRef.current.alive) {
              resetLivePreview(taskIdRef.current, bestGenome, bestCoGenome);
            } else {
              // Hot-swap the genome: update VM code without resetting environment
              const freshVm = createVMState(bestGenome);
              vmRef.current = freshVm;
              if (dualCoreRef.current) {
                const coKernel = bestCoGenome ?? bestGenome;
                vmBRef.current = createVMState(coKernel);
              }
            }
          } else {
            if (!envRef.current.alive || bestChanged) {
              resetLivePreview(taskIdRef.current, bestGenome, bestCoGenome);
            }
          }

          // Loggen van generatie-uitkomst (evolution type)
          const miStage = taskIdRef.current === 'ecosystem' ? envRef.current.ecoMiStage : -1;
          const miStageName = miStage >= 0 ? MI_STAGES[miStage]?.name ?? '' : '';
          log(
            `Gen ${maxGeneration} | Best: ${bestFitness.toFixed(1)} | Mean: ${meanFitness.toFixed(1)}${miStageName ? ` | 🧠 ${miStageName}` : ''}`,
            'evolution'
          );
          // Also log as info for the "Alles" filter
          log(`Gen ${maxGeneration} | Best: ${bestFitness.toFixed(1)} | Mean: ${meanFitness.toFixed(1)}`, 'info');

          // Reset buffer voor volgende generatie
          generationResultsRef.results = [];
        }
      };
    }

    // Initialiseer alle workers met de volledige populatie (worker verdeelt zelf)
    const initSync: WorkerRequest = {
      type: 'sync',
      sessionId: sessionIdRef.current,
      population: populationRef.current,
      coPopulation: coPopulationRef.current,
      taskId: taskIdRef.current,
      generation: generationRef.current,
      mutationRate: mutationRateRef.current,
      bitWidth: bitWidthRef.current,
      allowSmc: allowSmcRef.current,
      inheritSmc: inheritSmcRef.current,
      dualCore: dualCoreRef.current,
      maxCycles: maxCyclesRef.current,
      workerIndex: 0,
      totalWorkers: workerCount,
    };
    for (let i = 0; i < workerCount; i++) {
      const syncMsg: WorkerRequest = {
        ...initSync,
        workerIndex: i,
      };
      workers[i].postMessage(syncMsg);
    }

    return () => {
      for (const w of workers) {
        w.terminate();
      }
      workerRefs.current = [];
    };
  }, [resetLivePreview, detectedHw.recommendedWorkerCount]);

  // Live HID / Gamepad / Camera peripheral stream monitor
  useEffect(() => {
    const monitor = createPeripheralMonitor();
    peripheralMonitorRef.current = monitor;
    return () => {
      monitor.destroy();
      peripheralMonitorRef.current = null;
    };
  }, []);

  // Async hardware enrichment + plug-and-play hot-plug listener (GPU / Gamepad / Media devices)
  useEffect(() => {
    let cancelled = false;
    const refreshHardware = (initialProbe: boolean) => {
      detectHardwareAsync().then((hw) => {
        if (cancelled) return;
        setDetectedHw(hw);
        detectedHwRef.current = hw;
        envRef.current.hwMask = hw.capabilityMask;
        updateEnvPorts(envRef.current);
        if (initialProbe && autoHardwareRef.current && generationRef.current === 0) {
          applyHardwareProfile(hw, false);
          setMaxCycles(hw.recommendedCycles);
          maxCyclesRef.current = hw.recommendedCycles;
        }
      });
    };

    refreshHardware(true);
    const unsubscribe = subscribeHardwareHotplug(() => refreshHardware(false));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [applyHardwareProfile]);

  const handleToggleCamera = useCallback(async () => {
    const monitor = peripheralMonitorRef.current;
    if (!monitor) return;
    if (monitor.isCameraActive()) {
      monitor.disableCamera();
      setCameraActive(false);
      setCameraStatus(null);
      return;
    }
    setCameraStatus('Camera verbinden...');
    const ok = await monitor.enableCamera();
    if (ok) {
      setCameraActive(true);
      setCameraStatus(null);
      if (taskIdRef.current !== 'hardware') {
        setTaskId('hardware');
        handleResetAll('hardware', popSize, fromScratch, bitWidth);
      }
    } else {
      setCameraActive(false);
      setCameraStatus('Geen camera beschikbaar of toegang geweigerd');
    }
  }, [bitWidth, fromScratch, handleResetAll, popSize]);

  useEffect(() => {
    const workers = workerRefs.current;
    if (workers.length === 0) return;
    const msg: WorkerRequest = {
      type: 'updateParams',
      taskId,
      mutationRate,
      bitWidth,
      allowSmc,
      inheritSmc,
      dualCore,
      maxCycles,
    };
    for (const w of workers) {
      w.postMessage(msg);
    }
  }, [taskId, mutationRate, bitWidth, allowSmc, inheritSmc, dualCore, maxCycles]);

  useEffect(() => {
    const workers = workerRefs.current;
    if (workers.length === 0) return;
    if (isEvolving) {
      // When starting evolution, sync current live environment state so evolution
      // continues from where the avatar currently is (position, day phase, memory)
      const currentEnv = envRef.current;
      syncWorkerState(
        populationRef.current,
        coPopulationRef.current,
        taskIdRef.current,
        generationRef.current,
        bitWidthRef.current,
        dualCoreRef.current,
        false,
        maxCyclesRef.current,
        currentEnv.taskId === 'ecosystem' ? currentEnv : null
      );
      // Resume live simulation so avatar moves while evolving
      setIsSimRunning(true);
      for (const w of workers) {
        w.postMessage({ type: 'start', sessionId: sessionIdRef.current } satisfies WorkerRequest);
      }
    } else {
      for (const w of workers) {
        w.postMessage({ type: 'stop' } satisfies WorkerRequest);
      }
    }
  }, [isEvolving, syncWorkerState]);

  useEffect(() => {
    if (!isSimRunning || activeView !== 'workbench') return;
    const timer = window.setInterval(() => {
      stepOneTick();
    }, 240);
    return () => window.clearInterval(timer);
  }, [isSimRunning, activeView, stepOneTick]);

  // Throttled localStorage persistence (prevents JSON stringify overhead during fast worker ticks)
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const payload: SavedSession = {
          taskId,
          bitWidth,
          maxCycles,
          autoHardware,
          allowSmc,
          inheritSmc,
          dualCore,
          popSize,
          mutationRate,
          fromScratch,
          generation,
          bestGenome: Array.from(bestGenome),
          population: population.map((a) => ({
            id: a.id,
            genome: Array.from(a.genome),
            fitness: a.fitness,
            generationBorn: a.generationBorn,
          })),
          coPopulation: coPopulation
            ? coPopulation.map((a) => ({
                id: a.id,
                genome: Array.from(a.genome),
                fitness: a.fitness,
                generationBorn: a.generationBorn,
              }))
            : null,
          coBestFitness,
          metrics,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        // The Brain: save the overall best genome per zone for ecosystem
        // This is done lightly — only the top 10 agents are checked per zone
        if (taskId === 'ecosystem') {
          const topAgents = [...populationRef.current].sort((a, b) => b.fitness - a.fitness).slice(0, 10);
          for (let z = 0; z < 4; z++) {
            let bestZoneAgent: Agent | null = null;
            let bestZoneFitness = -Infinity;
            for (const agent of topAgents) {
              try {
                const testEnv = createInitialEnv('ecosystem', generationRef.current * 31 + z * 17 + 42, envRef.current.hwMask);
                testEnv.ecoArenaX = z === 0 ? 4 : (z === 1 ? 20 : (z === 2 ? 4 : 20));
                testEnv.ecoArenaY = z === 0 ? 4 : (z === 1 ? 4 : (z === 2 ? 20 : 20));
                const result = evaluateAgentDetailed(agent.genome, 'ecosystem', generationRef.current * 31 + z * 17 + 42, 32, 6, {
                  allowSmc: allowSmcRef.current,
                  initialEnv: testEnv,
                });
                if (result.score > bestZoneFitness) {
                  bestZoneFitness = result.score;
                  bestZoneAgent = agent;
                }
              } catch { /* skip */ }
            }
            if (bestZoneAgent) {
              saveBrainZone(z, bestZoneAgent.genome);
            }
          }
        }
      } catch {
        // Ignore storage quota errors cleanly
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [
    taskId,
    bitWidth,
    maxCycles,
    autoHardware,
    allowSmc,
    inheritSmc,
    dualCore,
    popSize,
    mutationRate,
    fromScratch,
    generation,
    bestGenome,
    population,
    coPopulation,
    coBestFitness,
    metrics,
  ]);

  const totalBytesPerAgent = 384;
  const totalPopulationKB = ((popSize * totalBytesPerAgent) / 1024).toFixed(1);

  const displayedCode = allowSmc ? vmSnapshot.activeCode : bestGenome;

  const decodedProgram = useMemo(() => {
    return Array.from({ length: PROG_LEN }, (_, idx) => ({
      idx,
      inst: decodeInstruction(displayedCode, idx),
      hex: formatHexBytes(displayedCode, idx),
      asm: disassembleInstruction(decodeInstruction(displayedCode, idx)),
      smcChanged: allowSmc && vmSnapshot.smcModified[idx] === 1,
    }));
  }, [displayedCode, allowSmc, vmSnapshot.smcModified]);

  const handleEditInstruction = (
    idx: number,
    patch: Partial<{ opcode: Opcode; dst: number; src: number; imm: number }>
  ) => {
    const cur = decodeInstruction(bestGenome, idx);
    const updated = new Uint8Array(bestGenome);
    encodeInstruction(
      updated,
      idx,
      patch.opcode ?? cur.opcode,
      patch.dst ?? cur.dst,
      patch.src ?? cur.src,
      patch.imm ?? cur.imm
    );
    setBestGenome(updated);
    bestGenomeRef.current = updated;
    vmRef.current.activeCode = new Uint8Array(updated);
    vmRef.current.smcModified[idx] = 0;
    let nextPop = populationRef.current;
    if (populationRef.current.length > 0) {
      nextPop = [...populationRef.current];
      nextPop[0] = { ...nextPop[0], genome: new Uint8Array(updated) };
      populationRef.current = nextPop;
      setPopulation(nextPop);
    }
    syncWorkerState(
      nextPop,
      coPopulationRef.current,
      taskIdRef.current,
      generationRef.current,
      bitWidthRef.current,
      dualCoreRef.current
    );
    syncVmToState();
  };

  const selectedInst = selectedInstIdx !== null ? decodedProgram[selectedInstIdx] : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#080B12] text-slate-100">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav links) — Zone 3 (1 Primary Action) */}
      <header className="h-14 px-6 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between gap-8 shrink-0">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('workbench');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          SiliciumKern
        </a>

        <nav className="flex items-center gap-6 text-sm font-medium">
          {(
            [
              ['workbench', 'Werkbank'],
              ['isa', 'Instructieset'],
              ['benchmark', 'Benchmark'],
              ['export', 'Code-export'],
            ] as const
          ).map(([viewKey, label]) => (
            <button
              key={viewKey}
              type="button"
              onClick={() => setActiveView(viewKey)}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xs ${
                activeView === viewKey
                  ? 'border-cyan-400 text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsEvolving((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isEvolving
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isEvolving ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isEvolving ? 'Pauzeer evolutie' : 'Start evolutie'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      {activeView === 'workbench' && (
        <main className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Left Control & Parameter Column */}
          <aside className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0A0E17] p-5 space-y-6 overflow-y-auto">
            <div>
              <h1 className="text-sm font-semibold text-slate-100">
                Autonome machinetaal-kern
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                44 hardware-opcodes over 16/32/64-bit scalaire registers, 128-bit SIMD en zelf-modificatie.
              </p>
              <div className="mt-2.5 text-xs font-mono text-cyan-400">
                384 B/kern · {totalPopulationKB} KB totaal · 0 B VRAM
              </div>
            </div>

            {/* Automatic Host Hardware Detection & Adaptive Space */}
            <div className="border border-slate-800 rounded-md bg-[#0B0F19] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-200">
                  Hardware-detectie
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (autoHardware) {
                      setAutoHardware(false);
                      autoHardwareRef.current = false;
                    } else {
                      detectHardwareAsync().then((hw) => {
                        setDetectedHw(hw);
                        applyHardwareProfile(hw, true);
                      });
                    }
                  }}
                  className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border transition-colors ${
                    autoHardware
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#080B12] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {autoHardware ? 'AUTO' : 'HANDMATIG'}
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-300 leading-relaxed">
                {detectedHw.summaryLine}
              </div>
              <div className="text-[11px] font-mono text-slate-400 leading-snug break-words">
                {detectedHw.peripheralsLine}
              </div>
              <div className="text-[11px] text-slate-400 leading-snug">
                AI-ruimte:{' '}
                <span className="font-mono text-cyan-300">
                  {bitWidth}b · {maxCycles} cycli/tick · {popSize} kernen
                  {dualCore ? ' · Dual-Core' : ''}
                </span>
              </div>
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded border transition-colors ${
                    cameraActive
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#080B12] border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
                  }`}
                >
                  {cameraActive ? (
                    <VideoOff className="w-3.5 h-3.5" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  {cameraActive ? 'Ontkoppel camera' : 'Koppel camera-oog'}
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  P3 mask 0x{detectedHw.capabilityMask.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              </div>
              {cameraStatus && (
                <div className="text-[11px] text-amber-300 leading-snug">
                  {cameraStatus}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                1. Hardware-omgeving
              </label>
              <div className="space-y-1.5">
                {(['homeostasis', 'arena', 'bitstream', 'hardware', 'ecosystem'] as TaskId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTaskId(id);
                      handleResetAll(id, popSize, fromScratch, bitWidth);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md border text-xs transition-colors ${
                      taskId === id
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-slate-100'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{TASKS[id].name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {TASKS[id].shortDesc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  2. Register-breedte & SIMD
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#080B12] border border-slate-800 rounded-md">
                  {([16, 32, 64, 128] as BitWidth[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        setAutoHardware(false);
                        autoHardwareRef.current = false;
                        setBitWidth(w);
                        bitWidthRef.current = w;
                      }}
                      className={`py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                        bitWidth === w
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {w}b
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  {bitWidth === 16 && '16-bit (AX..DI) · klassiek retro silicium'}
                  {bitWidth === 32 && '32-bit (EAX..EDI) · Pentium 3 profiel'}
                  {bitWidth === 64 && '64-bit (RAX..RDI) · modern x86-64'}
                  {bitWidth === 128 && '64-bit + 128-bit SSE2 XMM0..XMM3 SIMD'}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Cyclusbudget / tick</span>
                  <span className="font-mono text-cyan-400">{maxCycles} cycli</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([24, 36, 48] as CycleBudget[]).map((cy) => (
                    <button
                      key={cy}
                      type="button"
                      onClick={() => {
                        setAutoHardware(false);
                        autoHardwareRef.current = false;
                        setMaxCycles(cy);
                        maxCyclesRef.current = cy;
                      }}
                      className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                        maxCycles === cy
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cy}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  3. Startpunt genoom
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080B12] border border-slate-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setFromScratch(true);
                      handleResetAll(taskId, popSize, true, bitWidth);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      fromScratch
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Vanaf 0 (Ruis)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromScratch(false);
                      handleResetAll(taskId, popSize, false, bitWidth);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      !fromScratch
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Basis-reflex
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Populatie (L1/L2-cache)</span>
                  <span className="font-mono text-slate-200">{popSize} kernen</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {([32, 64, 128, 256] as PopSizeOption[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setAutoHardware(false);
                        autoHardwareRef.current = false;
                        setPopSize(sz);
                        handleResetAll(taskId, sz, fromScratch, bitWidth);
                      }}
                      className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                        popSize === sz
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Mutatiekans per byte</span>
                  <span className="font-mono text-cyan-400">{Math.round(mutationRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.25}
                  step={0.01}
                  value={mutationRate}
                  onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = !allowSmc;
                    setAllowSmc(next);
                    allowSmcRef.current = next;
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                    allowSmc
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Zelf-modificatie (PWRITE)</span>
                  <span className="font-mono font-semibold">{allowSmc ? 'AAN' : 'UIT'}</span>
                </button>

                {allowSmc && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !inheritSmc;
                      setInheritSmc(next);
                      inheritSmcRef.current = next;
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                      inheritSmc
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Lamarckiaanse SMC-overerving</span>
                    <span className="font-mono font-semibold">{inheritSmc ? 'AAN' : 'UIT'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const next = !dualCore;
                    setAutoHardware(false);
                    autoHardwareRef.current = false;
                    setDualCore(next);
                    dualCoreRef.current = next;
                    if (next && !coPopulationRef.current) {
                      const newCoPop = initCoPopulation(
                        popSize,
                        Math.floor(Date.now() % 100000) + 8484,
                        bitWidthRef.current
                      );
                      const firstCo = new Uint8Array(newCoPop[0].genome);
                      setCoPopulation(newCoPop);
                      coPopulationRef.current = newCoPop;
                      setBestCoGenome(firstCo);
                      bestCoGenomeRef.current = firstCo;
                      vmBRef.current = createVMState(firstCo);
                      syncWorkerState(
                        populationRef.current,
                        newCoPop,
                        taskIdRef.current,
                        generationRef.current,
                        bitWidthRef.current,
                        true
                      );
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-colors ${
                    dualCore
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Dual-Core Co-Processor Bus</span>
                  <span className="font-mono font-semibold">{dualCore ? 'AAN' : 'UIT'}</span>
                </button>
              </div>
            </div>

            {/* Ecosystem: DNA strand & MI training mode */}
            {taskId === 'ecosystem' && (
              <div className="border-t border-slate-800 pt-4 space-y-2.5">
                <div className="text-xs font-medium text-slate-300">
                  3.5 DNA-streng (MI-evolutie)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Elke MI-stadium is een cel in de DNA-streng. Alleen de beste cel gaat door naar het volgende stadium.
                </p>
                {/* DNA strand visualization */}
                <div className="flex gap-1">
                  {MI_STAGES.map((stage, idx) => {
                    const completed = dnaStrand[idx];
                    const active = env.ecoMiStage === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-8 rounded flex items-center justify-center text-[10px] font-mono border transition-colors ${
                          completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : active
                              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                              : 'bg-[#0B0F19] border-slate-800 text-slate-600'
                        }`}
                        title={`${stage.icon} ${stage.name}: ${stage.desc}`}
                      >
                        {stage.icon}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 text-[10px] font-mono text-slate-500">
                  {MI_STAGES.map((stage, idx) => (
                    <div key={idx} className="flex-1 text-center truncate" title={stage.name}>
                      {stage.name.slice(0, 6)}
                    </div>
                  ))}
                </div>
                {/* Training mode selector */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080B12] border border-slate-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setMiMode('all');
                      miModeRef.current = 'all';
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      miMode === 'all'
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Alle stadia tegelijk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMiMode('single');
                      miModeRef.current = 'single';
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      miMode === 'single'
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Één stadium per keer
                  </button>
                </div>
                {/* Stage selector for single mode */}
                {miMode === 'single' && (
                  <div className="grid grid-cols-3 gap-1">
                    {MI_STAGES.map((stage, idx) => {
                      const completed = dnaStrand[idx];
                      const active = env.ecoMiStage === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            // Set this stage as active
                            envRef.current.ecoMiStage = idx;
                            envRef.current.ecoMiStageGenerations = 0;
                            // Load the previous stage's genome if available
                            if (idx > 0) {
                              const prevGenome = loadMiStageGenome(idx - 1);
                              if (prevGenome) {
                                setBestGenome(prevGenome);
                                bestGenomeRef.current = prevGenome;
                                vmRef.current = createVMState(prevGenome);
                              }
                            }
                            setEnv({ ...envRef.current });
                          }}
                          className={`px-2 py-1.5 text-[11px] font-mono rounded border transition-colors ${
                            active
                              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                              : completed
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                                : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {stage.icon} {stage.name.slice(0, 8)}
                          {completed && ' ✓'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-800 pt-4 space-y-2.5">
              <div className="text-xs font-medium text-slate-300">
                4. Uitvoering & stap-inspectie
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={runOneGeneration}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors whitespace-nowrap"
                >
                  <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
                  1 Generatie
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimRunning((v) => !v)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors whitespace-nowrap"
                >
                  {isSimRunning ? (
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {isSimRunning ? 'Pauzeer live' : 'Hervat live'}
                </button>
                <button
                  type="button"
                  onClick={stepOneTick}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 hover:border-slate-700 text-slate-200 rounded-md transition-colors whitespace-nowrap"
                >
                  <StepForward className="w-3.5 h-3.5" />
                  Stap 1 Tick
                </button>
                <button
                  type="button"
                  onClick={stepOneInstruction}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 hover:border-slate-700 text-slate-200 rounded-md transition-colors whitespace-nowrap"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Stap 1 Opcode
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleResetAll()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset populatie & geheugen
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="text-xs font-medium text-slate-300">
                5. Hardware-storing injecteren
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {taskId === 'homeostasis' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        pendingDisturbanceRef.current.tempSpike = 24;
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-[#0B0F19] border border-slate-800 hover:border-amber-500/50 text-slate-200 rounded-md transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Injecteer +24°C hittepiek
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        pendingDisturbanceRef.current.loadSpike = 35;
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/50 text-slate-200 rounded-md transition-colors"
                    >
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      Injecteer +35 werklastpiek
                    </button>
                  </>
                )}
                {(taskId === 'bitstream' || taskId === 'hardware') && (
                  <button
                    type="button"
                    onClick={() => {
                      pendingDisturbanceRef.current.loadSpike = 7;
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/50 text-slate-200 rounded-md transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Injecteer bus-signaalpuls (+7)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    pendingDisturbanceRef.current.energyDip = 25;
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-[#0B0F19] border border-slate-800 hover:border-rose-500/50 text-slate-200 rounded-md transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  Injecteer -25% spanningsdip
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-300">
                  6. Opslag &amp; broncode
                </div>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline decoration-slate-700 underline-offset-2"
                >
                  GitHub-repo
                </a>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Je geëvolueerde genoom wordt automatisch lokaal bewaard in je browser.
              </p>
            </div>
          </aside>

          {/* Main Workspace Viewport */}
          <section className="flex-1 min-w-0 p-5 space-y-5 overflow-y-auto">
            {/* Compact KPI ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-slate-800 rounded-md bg-[#0B0F19] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Generatie</div>
                <div className="text-2xl font-mono font-semibold text-slate-100 mt-1">
                  {generation}
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#0B0F19] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Beste fitness</div>
                <div className="text-2xl font-mono font-semibold text-cyan-400 mt-1">
                  {metrics.length > 0 ? metrics[metrics.length - 1].bestFitness.toFixed(1) : '—'}
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#0B0F19] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">CPU-cycli / tick</div>
                <div className="text-2xl font-mono font-semibold text-slate-100 mt-1">
                  {vmSnapshot.cyclesUsed}
                  <span className="text-xs text-slate-400 ml-1">/ {maxCycles}</span>
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#0B0F19] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Actuator-uitvoer</div>
                <div className="text-2xl font-mono font-semibold text-emerald-400 mt-1">
                  {vmSnapshot.out}
                  <span className="text-xs text-slate-400 ml-1.5">
                    ({env.alive ? 'Actief' : 'Gestopt'})
                  </span>
                </div>
              </div>
            </div>

            {/* Arena + Live CPU Registers & RAM */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              <div className="xl:col-span-7 min-h-[340px]">
                {env.taskId === 'ecosystem' ? (
                  <EcosystemCanvas env={env} population={population.map(a => ({ genome: a.genome, fitness: a.fitness }))} />
                ) : (
                  <ArenaCanvas env={env} />
                )}
              </div>

              <div className="xl:col-span-5 flex flex-col gap-5">
                {/* 8 Integer Registers + CPU Flags */}
                <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0E1320]">
                    <span className="text-xs font-semibold text-slate-200">
                      {bitWidth === 128 ? '64-bit' : `${bitWidth}-bit`} Registers & Vlaggen
                    </span>
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      <span className="text-cyan-400">
                        IP 0x{vmSnapshot.ip.toString(16).padStart(2, '0').toUpperCase()}
                      </span>
                      <span className={vmSnapshot.zf ? 'text-emerald-400' : 'text-slate-500'}>
                        ZF={vmSnapshot.zf ? 1 : 0}
                      </span>
                      <span className={vmSnapshot.cf ? 'text-amber-400' : 'text-slate-500'}>
                        CF={vmSnapshot.cf ? 1 : 0}
                      </span>
                      <span className={vmSnapshot.sf ? 'text-rose-400' : 'text-slate-500'}>
                        SF={vmSnapshot.sf ? 1 : 0}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-800/70">
                    {vmSnapshot.regs.map((val, idx) => (
                      <div key={idx} className="px-3 py-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>R{idx}</span>
                          <span className="truncate ml-1">{formatRegHex(val, bitWidth)}</span>
                        </div>
                        <div className="text-sm font-mono font-semibold text-slate-100 mt-0.5 truncate">
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 128-bit SIMD XMM Vector Registers */}
                <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
                    <span className="text-xs font-semibold text-slate-200">
                      128-bit SIMD Vector Unit (XMM0..XMM3)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      4 × 32-bit lanes
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/70">
                    {vmSnapshot.xmm.map((lanes, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <span className="text-cyan-400 shrink-0">XMM{idx}</span>
                        <div className="grid grid-cols-4 gap-2 text-right flex-1">
                          {lanes.map((lv, li) => (
                            <span
                              key={li}
                              className={lv !== 0 ? 'text-slate-100' : 'text-slate-500'}
                            >
                              {lv}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 128-byte L1 Scratchpad RAM */}
                <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden flex-1">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
                    <span className="text-xs font-semibold text-slate-200">
                      L1 Scratchpad RAM (16 woorden)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      LOAD / STORE / VLOAD
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-px bg-slate-800/60">
                    {vmSnapshot.ram.map((val, idx) => {
                      const isRead = vmSnapshot.lastRamRead === idx;
                      const isWrite = vmSnapshot.lastRamWrite === idx;
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 transition-colors ${
                            isWrite
                              ? 'bg-amber-500/20'
                              : isRead
                                ? 'bg-cyan-500/15'
                                : 'bg-[#0B0F19]'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-500">
                            [0x{idx.toString(16).toUpperCase()}]
                          </div>
                          <div
                            className={`text-xs font-mono font-medium mt-0.5 truncate ${
                              val !== '0' ? 'text-slate-100' : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 8-Channel Shared Multi-Core Hardware Bus */}
                <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
                    <span className="text-xs font-semibold text-slate-200">
                      Gedeelde Multi-Core Bus (BUS0..BUS7)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {dualCore
                        ? `Kern B${coBestFitness !== null ? ` (${coBestFitness.toFixed(1)})` : ''} → BUS → Kern A`
                        : 'BWRITE / BREAD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-px bg-slate-800/60">
                    {vmSnapshot.bus.map((val, idx) => {
                      const isRead = vmSnapshot.lastBusRead === idx;
                      const isWrite = vmSnapshot.lastBusWrite === idx;
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 transition-colors ${
                            isWrite
                              ? 'bg-amber-500/20'
                              : isRead
                                ? 'bg-cyan-500/15'
                                : 'bg-[#0B0F19]'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-500">BUS{idx}</div>
                          <div
                            className={`text-xs font-mono font-medium mt-0.5 truncate ${
                              val !== 0 ? 'text-cyan-300' : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Machine-Code Disassembly + Inline Instruction Editor */}
            <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-[#0E1320]">
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Live Machinetaal-Genoom (32 instructies · 128 bytes)
                  </span>
                  <span className="text-xs text-slate-400 ml-3">
                    Klik op een instructie om direct hex/opcodes te wijzigen
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Totaal uitgevoerde cycli: {vmSnapshot.totalCycles}
                </span>
              </div>

              {selectedInst && (
                <div className="px-4 py-3 border-b border-slate-800 bg-[#0E1525] flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-mono font-semibold text-cyan-300">
                    Bewerk @0x{selectedInst.idx.toString(16).padStart(2, '0').toUpperCase()}
                  </span>

                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Opcode</span>
                    <select
                      value={selectedInst.inst.opcode}
                      onChange={(e) =>
                        handleEditInstruction(selectedInst.idx, {
                          opcode: Number(e.target.value) as Opcode,
                        })
                      }
                      className="bg-[#080B12] border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    >
                      {OPCODE_TABLE.map((op) => (
                        <option key={op.code} value={op.code}>
                          {op.mnemonic}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Rd/Xd</span>
                    <select
                      value={selectedInst.inst.dst}
                      onChange={(e) =>
                        handleEditInstruction(selectedInst.idx, { dst: Number(e.target.value) })
                      }
                      className="bg-[#080B12] border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
                        <option key={r} value={r}>
                          R{r} / XMM{r & 3}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Rs/Poort</span>
                    <select
                      value={selectedInst.inst.src}
                      onChange={(e) =>
                        handleEditInstruction(selectedInst.idx, { src: Number(e.target.value) })
                      }
                      className="bg-[#080B12] border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
                        <option key={r} value={r}>
                          R{r} / P{r}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Imm8</span>
                    <input
                      type="number"
                      min={-128}
                      max={127}
                      value={selectedInst.inst.imm}
                      onChange={(e) =>
                        handleEditInstruction(selectedInst.idx, {
                          imm: Math.max(-128, Math.min(127, Number(e.target.value) || 0)),
                        })
                      }
                      className="w-20 bg-[#080B12] border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setSelectedInstIdx(null)}
                    className="ml-auto text-slate-400 hover:text-slate-200 px-2 py-1"
                  >
                    Sluiten
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:gap-px bg-slate-800/50">
                {decodedProgram.map((row) => {
                  const isCurrentIp = vmSnapshot.ip === row.idx;
                  const isSelected = selectedInstIdx === row.idx;
                  const hits = vmSnapshot.hitCounts[row.idx] ?? 0;
                  return (
                    <button
                      key={row.idx}
                      type="button"
                      onClick={() => setSelectedInstIdx(isSelected ? null : row.idx)}
                      className={`text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                        isCurrentIp
                          ? 'bg-cyan-500/20 text-cyan-100'
                          : isSelected
                            ? 'bg-slate-800 text-slate-100'
                            : 'bg-[#0B0F19] hover:bg-slate-900 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className={isCurrentIp ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                            {row.idx.toString(16).padStart(2, '0').toUpperCase()}
                          </span>
                          <span className="font-semibold truncate">{row.asm}</span>
                          {row.smcChanged && (
                            <span className="text-[10px] font-mono text-amber-400 shrink-0">
                              SMC
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {row.hex}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {hits > 0 ? `${hits}×` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Telemetry Trajectory */}
            <EvolutionChart metrics={metrics} />

            {/* Genome Visualizer */}
            <GenomeVisualizer
              genome={bestGenome}
              hitCounts={vmRef.current.hitCounts}
            />

            {/* Output Console */}
            <OutputConsole
              logs={logBuffer}
              onCommand={handleConsoleCommand}
            />
          </section>
        </main>
      )}

      {activeView === 'isa' && (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <InstructionSetView taskId={taskId} bitWidth={bitWidth} />
        </main>
      )}

      {activeView === 'benchmark' && (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <BenchmarkView
            genome={bestGenome}
            coGenome={bestCoGenome ?? coPopulation?.[0]?.genome ?? null}
            taskId={taskId}
            bitWidth={bitWidth}
            maxCycles={maxCycles}
            generation={generation}
            allowSmc={allowSmc}
            inheritSmc={inheritSmc}
            dualCore={dualCore}
            mutationRate={mutationRate}
          />
        </main>
      )}

      {activeView === 'export' && (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col">
          <CodeExportView
            genome={bestGenome}
            taskId={taskId}
            bitWidth={bitWidth}
            maxCycles={maxCycles}
            popSize={popSize}
            generation={generation}
          />
        </main>
      )}
    </div>
  );
}
