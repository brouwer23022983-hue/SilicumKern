import {
  Agent,
  BitWidth,
  GeneralizationResult,
  SmcAbResult,
  TaskId,
  evolveGeneration,
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
}

export type WorkerRequest =
  | WorkerSyncPayload
  | WorkerUpdateParamsPayload
  | { type: 'step'; sessionId: number }
  | { type: 'start'; sessionId: number }
  | { type: 'stop' }
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
let maxCycles = 24;

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
      population = msg.population.map((a) => ({
        ...a,
        genome: new Uint8Array(a.genome),
      }));
      coPopulation = msg.coPopulation
        ? msg.coPopulation.map((a) => ({
            ...a,
            genome: new Uint8Array(a.genome),
          }))
        : null;
      taskId = msg.taskId;
      generation = msg.generation;
      mutationRate = msg.mutationRate;
      bitWidth = msg.bitWidth;
      allowSmc = msg.allowSmc;
      inheritSmc = msg.inheritSmc;
      dualCore = msg.dualCore;
      maxCycles = msg.maxCycles;
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
