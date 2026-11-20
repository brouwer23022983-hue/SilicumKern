import React, { useEffect, useRef, useState } from 'react';
import { FlaskConical, Loader2, Play } from 'lucide-react';
import {
  BitWidth,
  GeneralizationResult,
  SmcAbResult,
  TASKS,
  TaskId,
} from '../engine/machineVm';
import type { WorkerRequest, WorkerResponse } from '../workers/evolutionWorker';

interface BenchmarkViewProps {
  genome: Uint8Array;
  coGenome: Uint8Array | null;
  taskId: TaskId;
  bitWidth: BitWidth;
  maxCycles: number;
  generation: number;
  allowSmc: boolean;
  inheritSmc: boolean;
  dualCore: boolean;
  mutationRate: number;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({
  genome,
  coGenome,
  taskId,
  bitWidth,
  maxCycles,
  generation,
  allowSmc,
  inheritSmc,
  dualCore,
  mutationRate,
}) => {
  const [genResult, setGenResult] = useState<GeneralizationResult | null>(null);
  const [abResult, setAbResult] = useState<SmcAbResult | null>(null);
  const [abGenerations, setAbGenerations] = useState<number>(40);
  const [isRunningGen, setIsRunningGen] = useState<boolean>(false);
  const [isRunningAb, setIsRunningAb] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef<number>(0);
  const activeGenReqRef = useRef<number>(0);
  const activeAbReqRef = useRef<number>(0);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/evolutionWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === 'benchmark-gen-result' && msg.requestId === activeGenReqRef.current) {
        setGenResult(msg.result);
        setIsRunningGen(false);
      } else if (msg.type === 'benchmark-ab-result' && msg.requestId === activeAbReqRef.current) {
        setAbResult(msg.result);
        setIsRunningAb(false);
      }
    };
    worker.onerror = () => {
      setIsRunningGen(false);
      setIsRunningAb(false);
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleRunGeneralization = () => {
    const worker = workerRef.current;
    if (!worker || isRunningGen) return;
    const requestId = ++reqIdRef.current;
    activeGenReqRef.current = requestId;
    setIsRunningGen(true);
    const payload: WorkerRequest = {
      type: 'benchmark-gen',
      requestId,
      genome: new Uint8Array(genome),
      taskId,
      bitWidth,
      allowSmc,
      coGenome: dualCore && coGenome ? new Uint8Array(coGenome) : null,
      seedsTested: 100,
      maxCycles,
    };
    worker.postMessage(payload);
  };

  const handleRunAb = () => {
    const worker = workerRef.current;
    if (!worker || isRunningAb) return;
    const requestId = ++reqIdRef.current;
    activeAbReqRef.current = requestId;
    setIsRunningAb(true);
    const payload: WorkerRequest = {
      type: 'benchmark-ab',
      requestId,
      taskId,
      bitWidth,
      popSize: 48,
      generations: abGenerations,
      mutationRate,
      inheritSmc,
      maxCycles,
    };
    worker.postMessage(payload);
  };

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 rounded-md bg-[#0B0F19] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Experimenten &amp; Validatie — {TASKS[taskId].name}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test jouw geëvolueerde kern (generatie {generation}, {bitWidth}-bit, {maxCycles}{' '}
              cycli/tick) objectief in een Web Worker op ongeziene seeds en vergelijk evolutie met en zonder{' '}
              <code className="text-amber-300">PWRITE</code>.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Evaluatie: 4 anker-regimes + 2 epoche-seeds per generatie
          </div>
        </div>
      </div>

      {/* Experiment 1: 100-Seed Generalization */}
      <section className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-[#0E1320]">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Experiment 1 — 100-Seed Generalisatie-Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Meet je actieve beste kern op 100 ongeziene testomgevingen (zonder verdere evolutie) tegenover 16 willekeurige beginkernen.
            </p>
          </div>

          <button
            type="button"
            disabled={isRunningGen}
            onClick={handleRunGeneralization}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-wait text-slate-950 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {isRunningGen ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isRunningGen ? 'Testen in Worker...' : 'Draai 100-Seed Test'}
          </button>
        </div>

        {genResult ? (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-3.5 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Jouw kern (gem.)</div>
                <div className="text-xl font-mono font-semibold text-cyan-400 mt-1">
                  {genResult.agentMean.toFixed(1)}
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-3.5 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Willekeurig (gem.)</div>
                <div className="text-xl font-mono font-semibold text-slate-300 mt-1">
                  {genResult.randomMean.toFixed(1)}
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-3.5 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Netto winst vs ruis</div>
                <div
                  className={`text-xl font-mono font-semibold mt-1 ${
                    genResult.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {genResult.delta >= 0 ? '+' : ''}
                  {genResult.delta.toFixed(1)}
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-3.5 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Overleving / Min..Max</div>
                <div className="text-sm font-mono font-semibold text-slate-100 mt-1.5">
                  {genResult.agentSurvivalRate.toFixed(0)}%{' '}
                  <span className="text-xs text-slate-400">
                    ({genResult.agentMin.toFixed(0)}..{genResult.agentMax.toFixed(0)})
                  </span>
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-3.5 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">SMC actief in runs</div>
                <div className="text-xl font-mono font-semibold text-amber-300 mt-1">
                  {genResult.smcActiveSeeds}
                  <span className="text-xs text-slate-400 ml-1">/ {genResult.seedsTested}</span>
                </div>
              </div>
            </div>

            <GeneralizationBars agentScores={genResult.agentScores} randomScores={genResult.randomScores} />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Klik op <strong className="text-slate-200">Draai 100-Seed Test</strong> om te meten hoe goed generatie {generation} generaliseert op 100 ongeziene seeds.
          </div>
        )}
      </section>

      {/* Experiment 2: Controlled A/B Test PWRITE ON vs OFF */}
      <section className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-[#0E1320]">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Experiment 2 — Gecontroleerde A/B-Test: Zelf-modificatie (PWRITE) AAN vs UIT
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Start twee identieke beginpopulaties ({inheritSmc ? 'met Lamarckiaanse overerving' : 'Baldwin runtime-SMC'}) en valideert beide op 50 ongeziene seeds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={abGenerations}
              disabled={isRunningAb}
              onChange={(e) => setAbGenerations(Number(e.target.value))}
              className="bg-[#080B12] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 disabled:opacity-60"
            >
              <option value={25}>25 generaties</option>
              <option value={40}>40 generaties</option>
              <option value={75}>75 generaties</option>
            </select>
            <button
              type="button"
              disabled={isRunningAb}
              onClick={handleRunAb}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-wait text-slate-950 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {isRunningAb ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FlaskConical className="w-3.5 h-3.5" />
              )}
              {isRunningAb ? 'Evolueren in Worker...' : 'Start A/B-Experiment'}
            </button>
          </div>
        </div>

        {abResult ? (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Validatie met PWRITE (50 seeds)
                </div>
                <div className="text-2xl font-mono font-semibold text-amber-300 mt-1">
                  {abResult.smcValidationMean.toFixed(1)}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Gem. {abResult.smcModifiedOpcodes} runtime-herschrijvingen/run
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Validatie zonder PWRITE (50 seeds)
                </div>
                <div className="text-2xl font-mono font-semibold text-cyan-400 mt-1">
                  {abResult.noSmcValidationMean.toFixed(1)}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Statische bytecode (geen SMC)
                </div>
              </div>
              <div className="border border-slate-800 rounded-md bg-[#080B12] px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Verschil (SMC − Statisch)
                </div>
                <div
                  className={`text-2xl font-mono font-semibold mt-1 ${
                    abResult.smcValidationMean - abResult.noSmcValidationMean >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {abResult.smcValidationMean - abResult.noSmcValidationMean >= 0 ? '+' : ''}
                  {(abResult.smcValidationMean - abResult.noSmcValidationMean).toFixed(1)}
                </div>
              </div>
            </div>

            <AbComparisonChart smcSeries={abResult.smcSeries} noSmcSeries={abResult.noSmcSeries} />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Klik op <strong className="text-slate-200">Start A/B-Experiment</strong> om direct te testen of{' '}
            <code className="text-amber-300">PWRITE</code> op deze taak en bitbreedte ({bitWidth}-bit) meetbaar beter scoort.
          </div>
        )}
      </section>
    </div>
  );
};

const GeneralizationBars: React.FC<{ agentScores: number[]; randomScores: number[] }> = ({
  agentScores,
  randomScores,
}) => {
  const width = 760;
  const height = 170;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 24;
  const all = [...agentScores, ...randomScores];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const range = Math.max(1, rawMax - rawMin);
  const yMin = rawMin - range * 0.08;
  const yMax = rawMax + range * 0.08;
  const mapX = (i: number) => padL + (i / Math.max(1, agentScores.length - 1)) * (width - padL - padR);
  const mapY = (v: number) =>
    padT + ((yMax - v) / Math.max(1, yMax - yMin)) * (height - padT - padB);

  const agentPts = agentScores.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');
  const randomPts = randomScores.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');

  return (
    <div className="border border-slate-800 rounded bg-[#080B12] p-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
        <span>Scoreverloop over 100 ongeziene seeds</span>
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">— Jouw kern</span>
          <span className="text-slate-400">— Willekeurige baseline</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#1E293B" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#1E293B" />
        <text x={padL - 6} y={padT + 8} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
          {Math.round(yMax)}
        </text>
        <text x={padL - 6} y={height - padB} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
          {Math.round(yMin)}
        </text>
        <polyline fill="none" stroke="#64748B" strokeWidth="1.25" strokeOpacity="0.7" points={randomPts} />
        <polyline fill="none" stroke="#22D3EE" strokeWidth="1.75" points={agentPts} />
      </svg>
    </div>
  );
};

const AbComparisonChart: React.FC<{
  smcSeries: Array<{ generation: number; best: number; mean: number }>;
  noSmcSeries: Array<{ generation: number; best: number; mean: number }>;
}> = ({ smcSeries, noSmcSeries }) => {
  const width = 760;
  const height = 180;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 24;
  const all = [...smcSeries.map((d) => d.best), ...noSmcSeries.map((d) => d.best)];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const range = Math.max(1, rawMax - rawMin);
  const yMin = rawMin - range * 0.1;
  const yMax = rawMax + range * 0.1;
  const mapX = (i: number) => padL + (i / Math.max(1, smcSeries.length - 1)) * (width - padL - padR);
  const mapY = (v: number) =>
    padT + ((yMax - v) / Math.max(1, yMax - yMin)) * (height - padT - padB);

  const smcPts = smcSeries.map((d, i) => `${mapX(i).toFixed(1)},${mapY(d.best).toFixed(1)}`).join(' ');
  const noSmcPts = noSmcSeries.map((d, i) => `${mapX(i).toFixed(1)},${mapY(d.best).toFixed(1)}`).join(' ');

  return (
    <div className="border border-slate-800 rounded bg-[#080B12] p-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
        <span>Beste fitness per generatie (4-seed gemiddelde)</span>
        <div className="flex items-center gap-4">
          <span className="text-amber-300">— Met PWRITE (SMC)</span>
          <span className="text-cyan-400">— Zonder PWRITE</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#1E293B" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#1E293B" />
        <text x={padL - 6} y={padT + 8} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
          {Math.round(yMax)}
        </text>
        <text x={padL - 6} y={height - padB} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
          {Math.round(yMin)}
        </text>
        <polyline fill="none" stroke="#22D3EE" strokeWidth="1.75" points={noSmcPts} />
        <polyline fill="none" stroke="#FBBF24" strokeWidth="2" points={smcPts} />
      </svg>
    </div>
  );
};
