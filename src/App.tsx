import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Cpu,
  Flame,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  StepForward,
  Zap,
} from 'lucide-react';
import { ArenaCanvas } from './components/ArenaCanvas';
import {
  CodeExportView,
  GITHUB_REPO,
  GITHUB_URL,
  UpdateCheckState,
} from './components/CodeExportView';
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
  createInitialEnv,
  createRandomGenome,
  createRng,
  createStarterGenome,
  createVMState,
  decodeInstruction,
  disassembleInstruction,
  encodeInstruction,
  evolveGeneration,
  formatHexBytes,
  runVMTick,
  stepEnvironment,
  stepSingleInstruction,
} from './engine/machineVm';

type ActiveView = 'workbench' | 'isa' | 'export';

const STORAGE_KEY = 'siliciumkern_saved_state_v2';

interface SavedSession {
  taskId: TaskId;
  bitWidth: BitWidth;
  allowSmc?: boolean;
  dualCore?: boolean;
  popSize: number;
  mutationRate: number;
  fromScratch: boolean;
  generation: number;
  bestGenome: number[];
  population: Array<{ id: number; genome: number[]; fitness: number; generationBorn: number }>;
  metrics: GenerationMetric[];
}

function loadSavedSession(): SavedSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed || !Array.isArray(parsed.bestGenome) || parsed.bestGenome.length !== PROG_LEN * 4) {
      return null;
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
  bitWidth: BitWidth
): Agent[] {
  const rng = createRng(seed);
  const agents: Agent[] = [];
  for (let i = 0; i < popSize; i++) {
    const genome =
      fromScratch || i > 0 ? createRandomGenome(rng, bitWidth) : createStarterGenome(taskId);
    agents.push({
      id: i,
      genome,
      fitness: 0,
      generationBorn: 0,
    });
  }
  return agents;
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

export default function App() {
  const initialSaved = useMemo(() => loadSavedSession(), []);

  const [activeView, setActiveView] = useState<ActiveView>('workbench');
  const [taskId, setTaskId] = useState<TaskId>(initialSaved?.taskId ?? 'homeostasis');
  const [bitWidth, setBitWidth] = useState<BitWidth>(initialSaved?.bitWidth ?? 64);
  const [allowSmc, setAllowSmc] = useState<boolean>(initialSaved?.allowSmc ?? true);
  const [dualCore, setDualCore] = useState<boolean>(initialSaved?.dualCore ?? false);
  const [popSize, setPopSize] = useState<number>(initialSaved?.popSize ?? 64);
  const [mutationRate, setMutationRate] = useState<number>(initialSaved?.mutationRate ?? 0.08);
  const [fromScratch, setFromScratch] = useState<boolean>(initialSaved?.fromScratch ?? true);

  const [generation, setGeneration] = useState<number>(initialSaved?.generation ?? 0);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<GenerationMetric[]>(initialSaved?.metrics ?? []);
  const [updateState, setUpdateState] = useState<UpdateCheckState>({ status: 'idle' });

  const [population, setPopulation] = useState<Agent[]>(() => {
    if (initialSaved && Array.isArray(initialSaved.population) && initialSaved.population.length > 0) {
      return initialSaved.population.map((a) => ({
        id: a.id,
        genome: new Uint8Array(a.genome),
        fitness: a.fitness,
        generationBorn: a.generationBorn,
      }));
    }
    return initPopulation(64, 'homeostasis', true, 4242, 64);
  });
  const [bestGenome, setBestGenome] = useState<Uint8Array>(() =>
    initialSaved
      ? new Uint8Array(initialSaved.bestGenome)
      : new Uint8Array(initPopulation(64, 'homeostasis', true, 4242, 64)[0].genome)
  );

  const [env, setEnv] = useState<EnvSnapshot>(() =>
    createInitialEnv(initialSaved?.taskId ?? 'homeostasis', 9001)
  );
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
  const vmBRef = useRef<VMState>(createVMState(population[1]?.genome ?? bestGenome));
  const sharedBusRef = useRef<Int32Array>(new Int32Array(8));
  const envRef = useRef<EnvSnapshot>(createInitialEnv(initialSaved?.taskId ?? 'homeostasis', 9001));
  const simRngRef = useRef<() => number>(createRng(77777));
  const pendingDisturbanceRef = useRef<{ tempSpike?: number; loadSpike?: number; energyDip?: number }>({});
  const bestGenomeRef = useRef<Uint8Array>(bestGenome);
  bestGenomeRef.current = bestGenome;

  const populationRef = useRef<Agent[]>(population);
  populationRef.current = population;

  const generationRef = useRef<number>(generation);
  generationRef.current = generation;

  const bitWidthRef = useRef<BitWidth>(bitWidth);
  bitWidthRef.current = bitWidth;

  const allowSmcRef = useRef<boolean>(allowSmc);
  allowSmcRef.current = allowSmc;

  const dualCoreRef = useRef<boolean>(dualCore);
  dualCoreRef.current = dualCore;

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
    (nextTask: TaskId, genomeOverride?: Uint8Array) => {
      const targetGenome = genomeOverride ?? bestGenomeRef.current;
      const coGenome = populationRef.current[1]?.genome ?? targetGenome;
      const freshEnv = createInitialEnv(nextTask, Math.floor(Date.now() % 100000) + 17);
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
      setEnv({ ...freshEnv });
      syncVmToState();
    },
    [syncVmToState]
  );

  const handleResetAll = useCallback(
    (
      nextTask: TaskId = taskId,
      nextPopSize: number = popSize,
      nextScratch: boolean = fromScratch,
      nextWidth: BitWidth = bitWidth
    ) => {
      setIsEvolving(false);
      const seed = Math.floor(Date.now() % 100000) + 313;
      const newPop = initPopulation(nextPopSize, nextTask, nextScratch, seed, nextWidth);
      setPopulation(newPop);
      populationRef.current = newPop;
      setGeneration(0);
      generationRef.current = 0;
      setMetrics([]);
      setSelectedInstIdx(null);
      resetLivePreview(nextTask, newPop[0].genome);
    },
    [taskId, popSize, fromScratch, bitWidth, resetLivePreview]
  );

  const runOneGeneration = useCallback(() => {
    const res = evolveGeneration(
      populationRef.current,
      taskId,
      generationRef.current,
      mutationRate,
      bitWidthRef.current,
      { allowSmc: allowSmcRef.current, dualCore: dualCoreRef.current }
    );
    populationRef.current = res.nextPopulation;
    const nextGen = generationRef.current + 1;
    generationRef.current = nextGen;

    setPopulation(res.nextPopulation);
    setGeneration(nextGen);
    setBestGenome(new Uint8Array(res.bestAgent.genome));
    bestGenomeRef.current = new Uint8Array(res.bestAgent.genome);

    setMetrics((prev) => {
      const updated = [
        ...prev,
        {
          generation: nextGen,
          bestFitness: res.bestFitness,
          meanFitness: res.meanFitness,
        },
      ];
      return updated.length > 120 ? updated.slice(updated.length - 120) : updated;
    });

    if (!envRef.current.alive) {
      resetLivePreview(taskId, res.bestAgent.genome);
    }
  }, [taskId, mutationRate, resetLivePreview]);

  const stepOneTick = useCallback(() => {
    if (!envRef.current.alive) {
      resetLivePreview(taskId);
      return;
    }
    if (dualCoreRef.current && populationRef.current[1]) {
      runVMTick(
        populationRef.current[1].genome,
        vmBRef.current,
        envRef.current.ports,
        bitWidthRef.current,
        24,
        { allowSmc: allowSmcRef.current, sharedBus: sharedBusRef.current }
      );
    }
    const { action, didAct } = runVMTick(
      bestGenomeRef.current,
      vmRef.current,
      envRef.current.ports,
      bitWidthRef.current,
      24,
      { allowSmc: allowSmcRef.current, sharedBus: sharedBusRef.current }
    );
    const dist = pendingDisturbanceRef.current;
    pendingDisturbanceRef.current = {};
    stepEnvironment(envRef.current, action, didAct, simRngRef.current, dist);
    setEnv({
      ...envRef.current,
      history: [...envRef.current.history],
      trail: [...envRef.current.trail],
      bitStreamHistory: [...envRef.current.bitStreamHistory],
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
      stepEnvironment(envRef.current, vmRef.current.out, true, simRngRef.current, dist);
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

  useEffect(() => {
    if (!isEvolving) return;
    const timer = window.setInterval(() => {
      runOneGeneration();
    }, 60);
    return () => window.clearInterval(timer);
  }, [isEvolving, runOneGeneration]);

  useEffect(() => {
    if (!isSimRunning || activeView !== 'workbench') return;
    const timer = window.setInterval(() => {
      stepOneTick();
    }, 240);
    return () => window.clearInterval(timer);
  }, [isSimRunning, activeView, stepOneTick]);

  // Throttled localStorage persistence (prevents JSON stringify overhead every 60ms)
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const payload: SavedSession = {
          taskId,
          bitWidth,
          allowSmc,
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
          metrics,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage quota errors cleanly
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [taskId, bitWidth, allowSmc, dualCore, popSize, mutationRate, fromScratch, generation, bestGenome, population, metrics]);

  const checkForUpdates = useCallback(async (includeGitHub = true) => {
    setUpdateState((prev) => ({ ...prev, status: 'checking' }));
    try {
      const hostRes = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!hostRes.ok) throw new Error('Update check failed');
      const hostData = (await hostRes.json()) as { buildId?: string };

      let githubCommitSha: string | undefined;
      let githubCommitMessage: string | undefined;
      let githubCommitUrl: string | undefined;
      let githubAhead = false;
      let openPullRequests: number | undefined;

      if (includeGitHub) {
        try {
          const headers = { Accept: 'application/vnd.github+json' };
          const [commitRes, prsRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
              headers,
              cache: 'no-store',
            }),
            fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls?state=open&per_page=5`, {
              headers,
              cache: 'no-store',
            }),
          ]);

          if (commitRes.ok) {
            const commitData = (await commitRes.json()) as {
              sha?: string;
              html_url?: string;
              commit?: {
                message?: string;
                committer?: { date?: string };
                author?: { date?: string };
              };
            };
            githubCommitSha = commitData.sha?.slice(0, 7);
            githubCommitMessage = commitData.commit?.message?.split('\n')[0];
            githubCommitUrl = commitData.html_url;

            const commitIso =
              commitData.commit?.committer?.date ?? commitData.commit?.author?.date;
            if (commitIso) {
              const commitMs = new Date(commitIso).getTime();
              const buildMs = new Date(__BUILD_ID__).getTime();
              if (!Number.isNaN(commitMs) && !Number.isNaN(buildMs)) {
                githubAhead = commitMs > buildMs + 120_000;
              }
            }
          }

          if (prsRes.ok) {
            const prs = (await prsRes.json()) as unknown[];
            if (Array.isArray(prs)) openPullRequests = prs.length;
          }
        } catch {
          // GitHub API is optioneel; host version.json blijft leidend voor reload
        }
      }

      const hostHasUpdate = Boolean(hostData.buildId && hostData.buildId !== __BUILD_ID__);
      setUpdateState((prev) => ({
        status: hostHasUpdate ? 'update-available' : 'up-to-date',
        remoteBuildId: hostData.buildId,
        githubCommitSha: githubCommitSha ?? prev.githubCommitSha,
        githubCommitMessage: githubCommitMessage ?? prev.githubCommitMessage,
        githubCommitUrl: githubCommitUrl ?? prev.githubCommitUrl,
        githubAhead: includeGitHub ? githubAhead : prev.githubAhead,
        openPullRequests: openPullRequests ?? prev.openPullRequests,
      }));
    } catch {
      setUpdateState((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void checkForUpdates(false);
    }, 60000);
    return () => window.clearInterval(id);
  }, [checkForUpdates]);

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
    if (populationRef.current.length > 0) {
      const nextPop = [...populationRef.current];
      nextPop[0] = { ...nextPop[0], genome: new Uint8Array(updated) };
      populationRef.current = nextPop;
      setPopulation(nextPop);
    }
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

            <div className="border-t border-slate-800 pt-4">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                1. Hardware-omgeving
              </label>
              <div className="space-y-1.5">
                {(['homeostasis', 'arena', 'bitstream'] as TaskId[]).map((id) => (
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
                  <span className="text-slate-300 font-medium">Populatie (L1-cache)</span>
                  <span className="font-mono text-slate-200">{popSize} kernen</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[32, 64, 128].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
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

                <button
                  type="button"
                  onClick={() => {
                    const next = !dualCore;
                    setDualCore(next);
                    dualCoreRef.current = next;
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
                  6. App-updates & GitHub
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
                Je geëvolueerde genoom wordt lokaal bewaard bij updates. Host-build &amp; GitHub{' '}
                <code className="text-slate-300">main</code> worden samen gecontroleerd.
              </p>
              {updateState.githubCommitSha && (
                <div className="text-[11px] font-mono text-slate-300 bg-[#0B0F19] border border-slate-800 rounded px-2.5 py-1.5 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={updateState.githubCommitUrl ?? GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:underline truncate"
                    >
                      main@{updateState.githubCommitSha}
                    </a>
                    {updateState.githubAhead && (
                      <span className="text-amber-300 shrink-0">Nieuwer op GitHub</span>
                    )}
                  </div>
                  {updateState.githubCommitMessage && (
                    <div className="text-slate-400 truncate">{updateState.githubCommitMessage}</div>
                  )}
                  {updateState.openPullRequests && updateState.openPullRequests > 0 ? (
                    <a
                      href={`${GITHUB_URL}/pulls`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-amber-300 hover:underline"
                    >
                      {updateState.openPullRequests} open Pull Request(s) bekijken
                    </a>
                  ) : null}
                </div>
              )}
              {updateState.status === 'update-available' ? (
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Nieuwe build beschikbaar — werk nu bij
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void checkForUpdates(true)}
                  disabled={updateState.status === 'checking'}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-[#0B0F19] border border-slate-800 hover:border-cyan-500/50 disabled:opacity-60 text-slate-200 rounded-md transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-cyan-400 ${
                      updateState.status === 'checking' ? 'animate-spin' : ''
                    }`}
                  />
                  {updateState.status === 'checking'
                    ? 'Controleren op fixes...'
                    : updateState.status === 'up-to-date'
                      ? 'Up-to-date (opnieuw checken)'
                      : updateState.status === 'error'
                        ? 'Check mislukt — probeer opnieuw'
                        : 'Controleer op updates'}
                </button>
              )}
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
                  <span className="text-xs text-slate-400 ml-1">/ 24</span>
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
                <ArenaCanvas env={env} />
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
                      {dualCore ? 'Kern B → BUS → Kern A' : 'BWRITE / BREAD'}
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
                          R{r} / P{r % 6}
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
          </section>
        </main>
      )}

      {activeView === 'isa' && (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <InstructionSetView taskId={taskId} bitWidth={bitWidth} />
        </main>
      )}

      {activeView === 'export' && (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col">
          <CodeExportView
            genome={bestGenome}
            taskId={taskId}
            bitWidth={bitWidth}
            generation={generation}
            updateState={updateState}
            onCheckUpdate={() => void checkForUpdates(true)}
            onApplyUpdate={applyUpdate}
          />
        </main>
      )}
    </div>
  );
}
