import React, { useEffect, useRef } from 'react';
import { EnvSnapshot, TASKS, MI_STAGES } from '../engine/machineVm';

interface EcosystemCanvasProps {
  env: EnvSnapshot;
  population?: Array<{ genome: Uint8Array; fitness: number }>;
}

// 4 sub-task panels for the "Brein" (Brain) view
const SUB_TASKS = [
  { name: 'Homeostasis', icon: '🌡️', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { name: 'Arena', icon: '🌲', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { name: 'Bitstream', icon: '🧩', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
  { name: 'Hardware', icon: '📡', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
];

export const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({ env, population }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const parentW = parent ? parent.clientWidth : 400;
    const parentH = parent ? parent.clientHeight : 320;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width || parentW));
    const h = Math.max(280, Math.floor(rect.height || parentH));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, w, h);

    const pad = 16;
    const panelW = (w - pad * 3) / 2;
    const panelH = (h - pad * 3) / 2;

    // Draw 4 sub-task panels in a 2x2 grid
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = pad + col * (panelW + pad);
      const py = pad + row * (panelH + pad);

      const task = SUB_TASKS[i];

      // Panel background
      ctx.fillStyle = task.bg;
      ctx.strokeStyle = task.color;
      ctx.lineWidth = 1.5;

      // Rounded rect
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.lineTo(px + panelW - r, py);
      ctx.quadraticCurveTo(px + panelW, py, px + panelW, py + r);
      ctx.lineTo(px + panelW, py + panelH - r);
      ctx.quadraticCurveTo(px + panelW, py + panelH, px + panelW - r, py + panelH);
      ctx.lineTo(px + r, py + panelH);
      ctx.quadraticCurveTo(px, py + panelH, px, py + panelH - r);
      ctx.lineTo(px, py + r);
      ctx.quadraticCurveTo(px, py, px + r, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Panel title
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = task.color;
      ctx.fillText(`${task.icon} ${task.name}`, px + 8, py + 18);

      // Sub-task data
      ctx.font = '11px "JetBrains Mono", monospace';
      let yOff = 38;
      const textX = px + 8;

      if (i === 0) {
        // Homeostasis: temp, queue, energy, action
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Temp: ${Math.round(env.ecoTemp)}°C`, textX, py + yOff); yOff += 16;
        ctx.fillText(`Queue: ${Math.round(env.ecoQueue)}`, textX, py + yOff); yOff += 16;
        ctx.fillText(`Energy: ${Math.round(env.energy)}%`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Actie: ${env.ecoHomeoAction}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#64748B';
        ctx.fillText(`Score: ${env.ecoHomeoScore.toFixed(1)}`, textX, py + yOff);
      } else if (i === 1) {
        // Arena: position, nodes, hazards
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Pos: (${env.ecoArenaX}, ${env.ecoArenaY})`, textX, py + yOff); yOff += 16;
        ctx.fillText(`Nodes: ${env.ecoArenaNodes.length}`, textX, py + yOff); yOff += 16;
        ctx.fillText(`Hazards: ${env.ecoArenaHazards.length}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Actie: ${env.ecoArenaAction}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#64748B';
        ctx.fillText(`Score: ${env.ecoArenaScore.toFixed(1)}`, textX, py + yOff);
      } else if (i === 2) {
        // Bitstream: current, prev, prediction
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Curr: 0x${env.ecoBitCurr.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        ctx.fillText(`Prev: 0x${env.ecoBitPrev.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        const target = (env.ecoBitCurr ^ (env.ecoBitPrev >> 1)) & 0x0f;
        ctx.fillText(`Target: 0x${target.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Pred: 0x${env.ecoBitPrediction.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#64748B';
        ctx.fillText(`Score: ${env.ecoBitScore.toFixed(1)}`, textX, py + yOff);
      } else if (i === 3) {
        // Hardware: stream A, B, prediction
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`ChA: ${env.ecoHwStreamA}`, textX, py + yOff); yOff += 16;
        ctx.fillText(`ChB: ${env.ecoHwStreamB}`, textX, py + yOff); yOff += 16;
        const hwTarget = ((env.ecoHwStreamA ^ env.ecoHwStreamB)) & 0x0f;
        ctx.fillText(`XOR: 0x${hwTarget.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`Pred: 0x${env.ecoHwPrediction.toString(16).padStart(2, '0')}`, textX, py + yOff); yOff += 16;
        ctx.fillStyle = '#64748B';
        ctx.fillText(`Score: ${env.ecoHwScore.toFixed(1)}`, textX, py + yOff);
      }
    }

    // Center brain icon
    const cx = w / 2;
    const cy = h / 2;
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧠', cx, cy);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    // Tick and day info at bottom
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText(`Tick ${env.tick} · Dag ${env.ecoDayNumber} · Score ${env.cumulativeScore.toFixed(1)}`, cx, h - 6);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }, [env]);

  const spec = TASKS[env.taskId];

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0E1320]">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">{spec.name}</h2>
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap shrink-0">
            Tick {env.tick} · Score {env.cumulativeScore.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          {/* DNA strand visualization */}
          <div className="flex gap-0.5">
            {MI_STAGES.map((stage, idx) => {
              const active = env.ecoMiStage === idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] border transition-colors ${
                    active
                      ? 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300'
                      : 'bg-[#0B0F19] border-slate-700 text-slate-600'
                  }`}
                  title={`${stage.icon} ${stage.name}: ${stage.desc}`}
                >
                  {stage.icon}
                </div>
              );
            })}
          </div>
          {/* MI Stage progress */}
          {env.ecoMiStage !== undefined && (
            <span className="font-bold text-cyan-400">
              {MI_STAGES[env.ecoMiStage]?.icon} {MI_STAGES[env.ecoMiStage]?.name}
            </span>
          )}
          {env.ecoMiStageGenerations !== undefined && env.ecoMiStageGenTarget !== undefined && (
            <span className="text-yellow-400">
              Gen {env.ecoMiStageGenerations}/{env.ecoMiStageGenTarget}
            </span>
          )}
          <span className="text-emerald-400">Energie {Math.round(env.energy)}%</span>
          <span className="text-blue-400">H: {env.ecoHomeoScore.toFixed(0)}</span>
          <span className="text-green-400">A: {env.ecoArenaScore.toFixed(0)}</span>
          <span className="text-purple-400">B: {env.ecoBitScore.toFixed(0)}</span>
          <span className="text-amber-400">HW: {env.ecoHwScore.toFixed(0)}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[280px]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* Sensor port bus strip (P0..P15) */}
      <div className="grid grid-cols-4 sm:grid-cols-8 border-t border-slate-800 bg-[#0A0E17] divide-x divide-y divide-slate-800/80">
        {spec.ports.map((label, idx) => (
          <div key={label} className="px-2.5 py-2">
            <div className="text-[11px] text-slate-400 truncate">{label}</div>
            <div className="text-sm font-mono font-semibold text-slate-100 mt-0.5">
              {env.ports[idx] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
