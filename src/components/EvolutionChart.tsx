import React, { useState } from 'react';

export interface GenerationMetric {
  generation: number;
  bestFitness: number;
  meanFitness: number;
}

interface EvolutionChartProps {
  metrics: GenerationMetric[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ metrics }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 760;
  const height = 164;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  if (metrics.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-slate-800 rounded-md bg-[#0B0F19] text-xs font-mono text-slate-400">
        Start of stap de evolutie om de fitness-curve over generaties te meten.
      </div>
    );
  }

  let minY = Infinity;
  let maxY = -Infinity;
  for (const m of metrics) {
    minY = Math.min(minY, m.bestFitness, m.meanFitness);
    maxY = Math.max(maxY, m.bestFitness, m.meanFitness);
  }
  if (minY === maxY) {
    minY -= 10;
    maxY += 10;
  }
  const rangeY = maxY - minY;

  const toX = (i: number) =>
    metrics.length === 1 ? padL + plotW / 2 : padL + (i / (metrics.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / rangeY) * plotH;

  const bestPath = metrics
    .map((m, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(m.bestFitness).toFixed(1)}`)
    .join(' ');
  const meanPath = metrics
    .map((m, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(m.meanFitness).toFixed(1)}`)
    .join(' ');

  const hovered = hoverIdx !== null && metrics[hoverIdx] ? metrics[hoverIdx] : metrics[metrics.length - 1];
  const hoveredX = hoverIdx !== null ? toX(hoverIdx) : toX(metrics.length - 1);

  return (
    <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-200">Evolutie-telemetry</span>
          <span className="font-mono text-cyan-400">— Beste kern</span>
          <span className="font-mono text-slate-400">-- Populatiegemiddelde</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <span>Gen {hovered.generation}</span>
          <span className="text-cyan-400">Best {hovered.bestFitness.toFixed(1)}</span>
          <span className="text-slate-400">Gem {hovered.meanFitness.toFixed(1)}</span>
        </div>
      </div>

      <div className="w-full px-2 py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const norm = Math.max(0, Math.min(1, (relX - padL) / plotW));
            const idx = Math.round(norm * (metrics.length - 1));
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {[0, 0.5, 1].map((t) => {
            const y = padT + t * plotH;
            const val = maxY - t * rangeY;
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#182235" strokeWidth="1" />
                <text x={padL - 8} y={y + 3} textAnchor="end" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          <path d={meanPath} fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d={bestPath} fill="none" stroke="#06B6D4" strokeWidth="2" />

          {metrics.length > 0 && (
            <line
              x1={hoveredX}
              y1={padT}
              x2={hoveredX}
              y2={padT + plotH}
              stroke="#334155"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
