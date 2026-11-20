import {
  Agent,
  BitWidth,
  EnvSnapshot,
  GeneralizationResult,
  SmcAbResult,
  TaskId,
  evaluateAgentDetailed,
  evaluatePopulationSlice,
  evolveGeneration,
  getEvolutionEvalParams,
  runGeneralizationBenchmark,
  runSmcAbExperiment,
} from '../engine/machineVm';

export interface WorkerSyncPayload {
  type: 'sync';
  sessionId: number;
  population: Agent[];
  coPopulation: Agent[] | null;
  taskId: TaskId;
  generation: number;
  mutationRate: number;
  bitWidth: BitWidth;
  allowSmc: boolean;
  inheritSmc: boolean;
  dualCore: boolean;
  maxCycles: number;
  fromScratch?: boolean;
  // Multi-worker ondersteuning: elke worker krijgt een sub-populatie (standalone mode)
  workerIndex?: number;
  totalWorkers?: number;
  // Ecosystem: start evolutie vanaf huidige live-omgeving
  initialEnv?: EnvSnapshot | null;
}

export interface WorkerUpdateParamsPayload {
  type: 'updateParams';
  taskId: TaskId;
  mutationRate: number;
  bitWidth: BitWidth;
  allowSmc: boolean;
  inheritSmc: boolean;
  dualCore: boolean;
  maxCycles: number;
  fromScratch?: boolean;
}

export type WorkerRequest =
  | WorkerSyncPayload
  | WorkerUpdateParamsPayload
  | { type: 'step'; sessionId: number }
  | { type: 'start'; sessionId: number }
  | { type: 'stop' }
  | {
      type: 'eval-slice';
      sessionId: number;
      requestId: number;
      slice: Agent[];
      taskId: TaskId;
      generation: number;
      bitWidth: BitWidth;
      allowSmc: boolean;
      inheritSmc: boolean;
      coGenome: Uint8Array | null;
      maxCycles: number;
      initialEnv?: EnvSnapshot | null;
    }
  | {
      type: 'eval-co-slice';
      sessionId: number;
      requestId: number;
      slice: Agent[];
      primaryGenome: Uint8Array;
      taskId: TaskId;
      generation: number;
      bitWidth: BitWidth;
      allowSmc: boolean;
      maxCycles: number;
    }
  | {
      type: 'benchmark-gen';
      requestId: number;
      genome: Uint8Array;
      taskId: TaskId;
      bitWidth: BitWidth;
      allowSmc: boolean;
      coGenome: Uint8Array | null;
      seedsTested: number;
      maxCycles: number;
    }
  | {
      type: 'benchmark-ab';
      requestId: number;
      taskId: TaskId;
      bitWidth: BitWidth;
      popSize: number;
      generations: number;
      mutationRate: number;
      inheritSmc: boolean;
      maxCycles: number;
    };

export type WorkerResponse =
  | {
      type: 'generation';
      sessionId: number;
      generation: number;
      nextPopulation: Agent[];
      nextCoPopulation: Agent[] | null;
      bestFitness: number;
      meanFitness: number;
      coBestFitness: number | null;
      bestGenome: Uint8Array;
      coGenome: Uint8Array | null;
    }
  | {
      type: 'slice-result';
      sessionId: number;
      requestId: number;
      evaluated: Agent[];
      activeSlotsByAgent: number[][];
    }
  | {
      type: 'co-slice-result';
      sessionId: number;
      requestId: number;
      evaluated: Agent[];
    }
  | {
      type: 'benchmark-gen-result';
      requestId: number;
      result: GeneralizationResult;
    }
  | {
      type: 'benchmark-ab-result';
      requestId: number;
      result: SmcAbResult;
    };

const workerScope = self as unknown as {
  postMessage: (msg: WorkerResponse) => void;
};

let activeSessionId = 0;
let population: Agent[] = [];
let coPopulation: Agent[] | null = null;
let taskId: TaskId = 'homeostasis';
let generation = 0;
let mutationRate = 0.08;
let bitWidth: BitWidth = 64;
let allowSmc = true;
let inheritSmc = false;
let dualCore = false;
let maxCycles = 36;
let fromScratch = true;
let workerIndex = 0;
let totalWorkers = 1;
let initialEnv: EnvSnapshot | null = null;

let isRunning = false;
let loopTimer: ReturnType<typeof setTimeout> | null = null;

function clearLoopTimer() {
  if (loopTimer !== null) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
}

function executeOneGeneration() {
  if (population.length === 0) return;

  const res = evolveGeneration(population, taskId, generation, mutationRate, bitWidth, {
    allowSmc,
    inheritSmc,
    dualCore,
    coPopulation,
    maxCycles,
    initialEnv,
    fromScratch,
  });

  population = res.nextPopulation;
  coPopulation = res.nextCoPopulation;
  generation += 1;

  workerScope.postMessage({
    type: 'generation',
    sessionId: activeSessionId,
    generation,
    nextPopulation: res.nextPopulation,
    nextCoPopulation: res.nextCoPopulation,
    bestFitness: res.bestFitness,
    meanFitness: res.meanFitness,
    coBestFitness: res.coBestFitness,
    bestGenome: new Uint8Array(res.bestAgent.genome),
    coGenome: res.coAgent ? new Uint8Array(res.coAgent.genome) : null,
  });
}

function scheduleNextTick() {
  clearLoopTimer();
  if (!isRunning) return;
  loopTimer = setTimeout(() => {
    if (!isRunning) return;
    executeOneGeneration();
    if (isRunning) {
      scheduleNextTick();
    }
  }, 16);
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case 'sync': {
      activeSessionId = msg.sessionId;
      taskId = msg.taskId;
      generation = msg.generation;
      mutationRate = msg.mutationRate;
      bitWidth = msg.bitWidth;
      allowSmc = msg.allowSmc;
      inheritSmc = msg.inheritSmc;
      dualCore = msg.dualCore;
      maxCycles = msg.maxCycles;
      if (msg.fromScratch !== undefined) fromScratch = msg.fromScratch;
      initialEnv = msg.initialEnv ?? null;
      workerIndex = msg.workerIndex ?? 0;
      totalWorkers = msg.totalWorkers ?? 1;
      const allPop = msg.population.map((a) => ({
        ...a,
        genome: new Uint8Array(a.genome),
      }));
      const allCoPop = msg.coPopulation
        ? msg.coPopulation.map((a) => ({
            ...a,
            genome: new Uint8Array(a.genome),
          }))
        : null;
      const popPerWorker = Math.ceil(allPop.length / totalWorkers);
      const popStart = workerIndex * popPerWorker;
      const popEnd = Math.min(popStart + popPerWorker, allPop.length);
      population = allPop.slice(popStart, popEnd);
      const coPerWorker = allCoPop ? Math.ceil(allCoPop.length / totalWorkers) : 0;
      const coStart = workerIndex * coPerWorker;
      const coEnd = Math.min(coStart + coPerWorker, allCoPop?.length ?? 0);
      coPopulation = allCoPop ? allCoPop.slice(coStart, coEnd) : null;
      break;
    }
    case 'updateParams': {
      taskId = msg.taskId;
      mutationRate = msg.mutationRate;
      bitWidth = msg.bitWidth;
      allowSmc = msg.allowSmc;
      inheritSmc = msg.inheritSmc;
      dualCore = msg.dualCore;
      maxCycles = msg.maxCycles;
      if (msg.fromScratch !== undefined) fromScratch = msg.fromScratch;
      break;
    }
    case 'eval-slice': {
      const clonedSlice: Agent[] = msg.slice.map((a) => ({
        ...a,
        genome: new Uint8Array(a.genome),
      }));
      const { evaluated, activeSlotsByAgent } = evaluatePopulationSlice(
        clonedSlice,
        msg.taskId,
        msg.generation,
        msg.bitWidth,
        {
          allowSmc: msg.allowSmc,
          inheritSmc: msg.inheritSmc,
          coGenome: msg.coGenome ? new Uint8Array(msg.coGenome) : null,
          maxCycles: msg.maxCycles,
          initialEnv: msg.initialEnv ?? null,
        }
      );
      workerScope.postMessage({
        type: 'slice-result',
        sessionId: msg.sessionId,
        requestId: msg.requestId,
        evaluated,
        activeSlotsByAgent,
      });
      break;
    }
    case 'eval-co-slice': {
      const { evalSeeds, evalTicks } = getEvolutionEvalParams(msg.taskId, msg.generation);
      const primaryChamp = new Uint8Array(msg.primaryGenome);
      const evaluated: Agent[] = msg.slice.map((co) => {
        const coGenome = new Uint8Array(co.genome);
        let totalCoScore = 0;
        for (let s = 0; s < evalSeeds.length; s++) {
          totalCoScore += evaluateAgentDetailed(
            primaryChamp,
            msg.taskId,
            evalSeeds[s],
            msg.bitWidth,
            evalTicks,
            {
              allowSmc: msg.allowSmc,
              coGenome,
              maxCycles: msg.maxCycles,
            }
          ).score;
        }
        return {
          id: co.id,
          genome: coGenome,
          fitness: totalCoScore / evalSeeds.length,
          generationBorn: co.generationBorn,
        };
      });
      workerScope.postMessage({
        type: 'co-slice-result',
        sessionId: msg.sessionId,
        requestId: msg.requestId,
        evaluated,
      });
      break;
    }
    case 'step': {
      if (msg.sessionId === activeSessionId) {
        executeOneGeneration();
      }
      break;
    }
    case 'start': {
      if (msg.sessionId !== activeSessionId) break;
      isRunning = true;
      executeOneGeneration();
      scheduleNextTick();
      break;
    }
    case 'stop': {
      isRunning = false;
      clearLoopTimer();
      break;
    }
    case 'benchmark-gen': {
      const result = runGeneralizationBenchmark(
        new Uint8Array(msg.genome),
        msg.taskId,
        msg.bitWidth,
        msg.allowSmc,
        msg.coGenome ? new Uint8Array(msg.coGenome) : null,
        msg.seedsTested,
        msg.maxCycles
      );
      workerScope.postMessage({
        type: 'benchmark-gen-result',
        requestId: msg.requestId,
        result,
      });
      break;
    }
    case 'benchmark-ab': {
      const result = runSmcAbExperiment(
        msg.taskId,
        msg.bitWidth,
        msg.popSize,
        msg.generations,
        msg.mutationRate,
        msg.inheritSmc,
        msg.maxCycles
      );
      workerScope.postMessage({
        type: 'benchmark-ab-result',
        requestId: msg.requestId,
        result,
      });
      break;
    }
  }
});
