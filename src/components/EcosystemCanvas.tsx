import React, { useEffect, useRef } from 'react';
import { EnvSnapshot, TASKS } from '../engine/machineVm';

interface EcosystemCanvasProps {
  env: EnvSnapshot;
}

const GRID_SIZE = 24;
const ZONE_COLORS = [
  'rgba(59, 130, 246, 0.12)',   // House - blue
  'rgba(16, 185, 129, 0.12)',   // Forest - green
  'rgba(168, 85, 247, 0.12)',   // Puzzle - purple
  'rgba(245, 158, 11, 0.12)',   // Tower - amber
];
const ZONE_BORDER_COLORS = [
  '#3B82F6',  // House
  '#10B981',  // Forest
  '#A855F7',  // Puzzle
  '#F59E0B',  // Tower
];
const ZONE_LABELS = ['🏠 Huisje', '🌲 Bos', '🪨 Puzzel', '📡 Toren'];
const DAY_PHASES = ['🌅 Ochtend', '☀️ Middag 1', '🌤️ Middag 2', '🌇 Avond', '🌙 Nacht'];
const DAY_TARGET_ZONES = [3, 2, 1, 0, 0]; // toren, puzzel, bos, thuis, thuis

export const EcosystemCanvas: React.FC<EcosystemCanvasProps> = ({ env }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(280, Math.floor(rect.height));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, w, h);

    const pad = 20;
    const size = Math.min(w - pad * 2, h - pad * 2);
    const ox = Math.floor((w - size) / 2);
    const oy = Math.floor((h - size) / 2);
    const cell = size / GRID_SIZE;

    // Draw 4 zones
    const zones = [
      { x1: 0, y1: 0, x2: 8, y2: 8, idx: 0 },       // House top-left
      { x1: 16, y1: 0, x2: 24, y2: 8, idx: 1 },     // Forest top-right
      { x1: 0, y1: 16, x2: 8, y2: 24, idx: 2 },     // Puzzle bottom-left
      { x1: 16, y1: 16, x2: 24, y2: 24, idx: 3 },   // Tower bottom-right
    ];

    for (const z of zones) {
      const zx = ox + z.x1 * cell;
      const zy = oy + z.y1 * cell;
      const zw = (z.x2 - z.x1) * cell;
      const zh = (z.y2 - z.y1) * cell;

      // Zone fill
      ctx.fillStyle = ZONE_COLORS[z.idx];
      ctx.fillRect(zx, zy, zw, zh);

      // Zone border
      ctx.strokeStyle = ZONE_BORDER_COLORS[z.idx];
      ctx.lineWidth = 2;
      ctx.strokeRect(zx, zy, zw, zh);

      // Zone label
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = ZONE_BORDER_COLORS[z.idx];
      ctx.fillText(ZONE_LABELS[z.idx], zx + 4, zy + 14);
    }

    // Grid lines (subtle)
    ctx.strokeStyle = '#182235';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = ox + i * cell;
      const y = oy + i * cell;
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x, oy + size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + size, y);
      ctx.stroke();
    }

    // House icon (simple house shape at ecoHouseX, ecoHouseY)
    if (env.ecoHouseX !== undefined && env.ecoHouseY !== undefined) {
      const hx = ox + (env.ecoHouseX + 0.5) * cell;
      const hy = oy + (env.ecoHouseY + 0.5) * cell;
      const hs = cell * 0.4;

      // House body
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(hx - hs * 0.6, hy - hs * 0.2, hs * 1.2, hs * 0.8);
      // Roof
      ctx.beginPath();
      ctx.moveTo(hx - hs * 0.8, hy - hs * 0.2);
      ctx.lineTo(hx, hy - hs * 0.9);
      ctx.lineTo(hx + hs * 0.8, hy - hs * 0.2);
      ctx.closePath();
      ctx.fillStyle = '#60A5FA';
      ctx.fill();
      // Door
      ctx.fillStyle = '#1E3A5F';
      ctx.fillRect(hx - hs * 0.15, hy + hs * 0.1, hs * 0.3, hs * 0.5);
    }

    // Energy nodes in forest zone
    if (env.ecoEnergyNodes) {
      for (const n of env.ecoEnergyNodes) {
        const nx = ox + (n.x + 0.5) * cell;
        const ny = oy + (n.y + 0.5) * cell;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath();
        ctx.arc(nx, ny, cell * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, cell * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Hazards in forest zone
    if (env.ecoHazards) {
      for (const hz of env.ecoHazards) {
        const hx = ox + (hz.x + 0.5) * cell;
        const hy = oy + (hz.y + 0.5) * cell;
        ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
        ctx.fillRect(ox + hz.x * cell + 2, oy + hz.y * cell + 2, cell - 4, cell - 4);
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx - cell * 0.2, hy - cell * 0.2);
        ctx.lineTo(hx + cell * 0.2, hy + cell * 0.2);
        ctx.moveTo(hx + cell * 0.2, hy - cell * 0.2);
        ctx.lineTo(hx - cell * 0.2, hy + cell * 0.2);
        ctx.stroke();
      }
    }

    // Trail
    const trail = env.ecoTrail || env.trail;
    if (trail && trail.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.forEach((pt, idx) => {
        const px = ox + (pt.x + 0.5) * cell;
        const py = oy + (pt.y + 0.5) * cell;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Avatar as a simple cube (pseudo-3D)
    const ax = ox + (env.agentX + 0.5) * cell;
    const ay = oy + (env.agentY + 0.5) * cell;
    const as = cell * 0.35;

    // Cube top face
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.moveTo(ax, ay - as);
    ctx.lineTo(ax + as * 0.6, ay - as * 0.6);
    ctx.lineTo(ax, ay - as * 0.2);
    ctx.lineTo(ax - as * 0.6, ay - as * 0.6);
    ctx.closePath();
    ctx.fill();

    // Cube left face
    ctx.fillStyle = '#0891B2';
    ctx.beginPath();
    ctx.moveTo(ax - as * 0.6, ay - as * 0.6);
    ctx.lineTo(ax, ay - as * 0.2);
    ctx.lineTo(ax, ay + as * 0.6);
    ctx.lineTo(ax - as * 0.6, ay + as * 0.2);
    ctx.closePath();
    ctx.fill();

    // Cube right face
    ctx.fillStyle = '#0E7490';
    ctx.beginPath();
    ctx.moveTo(ax + as * 0.6, ay - as * 0.6);
    ctx.lineTo(ax, ay - as * 0.2);
    ctx.lineTo(ax, ay + as * 0.6);
    ctx.lineTo(ax + as * 0.6, ay + as * 0.2);
    ctx.closePath();
    ctx.fill();

    // Cube outline
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay - as);
    ctx.lineTo(ax + as * 0.6, ay - as * 0.6);
    ctx.lineTo(ax + as * 0.6, ay + as * 0.2);
    ctx.lineTo(ax, ay + as * 0.6);
    ctx.lineTo(ax - as * 0.6, ay + as * 0.2);
    ctx.lineTo(ax - as * 0.6, ay - as * 0.6);
    ctx.closePath();
    ctx.stroke();

    // Border frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, size, size);

    // Target zone highlight (dag/nacht cyclus)
    const dayPhase = env.ecoDayPhase ?? 0;
    const targetZone = env.ecoTargetZone ?? DAY_TARGET_ZONES[dayPhase];
    const targetZones = [
      { x1: 0, y1: 0, x2: 8, y2: 8 },       // House
      { x1: 16, y1: 0, x2: 24, y2: 8 },     // Forest
      { x1: 0, y1: 16, x2: 8, y2: 24 },     // Puzzle
      { x1: 16, y1: 16, x2: 24, y2: 24 },   // Tower
    ];
    if (targetZone >= 0 && targetZone < 4) {
      const tz = targetZones[targetZone];
      const tzx = ox + tz.x1 * cell;
      const tzy = oy + tz.y1 * cell;
      const tzw = (tz.x2 - tz.x1) * cell;
      const tzh = (tz.y2 - tz.y1) * cell;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)'; // gele rand voor target
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(tzx, tzy, tzw, tzh);
      ctx.setLineDash([]);
    }

    // Current zone indicator
    const currentZone = env.ecoZone ?? -1;
    if (currentZone >= 0) {
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = ZONE_BORDER_COLORS[currentZone];
      ctx.fillText(
        '▶ ' + ZONE_LABELS[currentZone],
        ox + size - 80,
        oy + size - 8
      );
    }

    // Day phase indicator (top-left)
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    const phaseLabel = DAY_PHASES[dayPhase] || DAY_PHASES[0];
    ctx.fillStyle = dayPhase === 4 ? '#818CF8' : '#FCD34D'; // nacht=purple, overdag=yellow
    ctx.fillText(phaseLabel, ox + 4, oy - 6);
    // Target zone label
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('→ ' + ZONE_LABELS[targetZone], ox + ctx.measureText(phaseLabel).width + 8, oy - 6);
    
    // Sleep indicator
    if (env.ecoSleeping) {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#A78BFA';
      const sleepLabel = '💤 Slaapt...';
      ctx.fillText(sleepLabel, ox + size - 100, oy - 6);
    }
    
    // Memory info (bottom-right)
    const memLong = env.ecoMemoryLong ?? [];
    const memShort = env.ecoMemoryShort ?? [];
    const knowledgeCount = memLong.filter(v => v !== 0).length;
    const shortCount = memShort.filter(v => v !== 0).length;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    const memLabel = `🧠 Kort: ${shortCount}/8 Lang: ${knowledgeCount}/8`;
    ctx.fillText(memLabel, ox + size - 80, oy + size + 14);
    
    // Days lived
    if (env.ecoDaysLived !== undefined && env.ecoDaysLived > 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`Dag ${env.ecoDaysLived}`, ox + size - 80, oy + size + 26);
    }
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
          <span className="text-cyan-400">Pos ({env.agentX},{env.agentY})</span>
          <span className="text-emerald-400">Energie {Math.round(env.energy)}%</span>
          <span className="text-amber-400">Bronnen {env.ecoNodesCollected ?? 0}</span>
          <span className="text-rose-400">Storing {env.ecoHazardHits ?? 0}</span>
          <span className="text-yellow-400">Ritme {env.ecoRhythmHits ?? 0}✓</span>
          {env.ecoDayPhase !== undefined && (
            <span className={(env.ecoDayPhase === 4 ? 'text-indigo-400' : 'text-orange-400')}>
              {DAY_PHASES[env.ecoDayPhase] || DAY_PHASES[0]}
            </span>
          )}
          {env.ecoSleeping && <span className="text-purple-400">💤 Slaapt</span>}
          <span className="text-cyan-400">🧠 {env.ecoMemoryLong?.filter(v => v !== 0).length ?? 0} kennis</span>
          {env.ecoDaysLived !== undefined && env.ecoDaysLived > 0 && (
            <span className="text-slate-400">Dag {env.ecoDaysLived}</span>
          )}
          {env.ecoZoneScores && (
            <>
              <span className="text-blue-400">Huisje {env.ecoZoneScores[0].toFixed(0)}</span>
              <span className="text-green-400">Bos {env.ecoZoneScores[1].toFixed(0)}</span>
              <span className="text-purple-400">Puzzel {env.ecoZoneScores[2].toFixed(0)}</span>
              <span className="text-amber-400">Toren {env.ecoZoneScores[3].toFixed(0)}</span>
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[280px]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* Sensor port bus strip (P0..P7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-800 bg-[#0A0E17] divide-x divide-y divide-slate-800/80">
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
