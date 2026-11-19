import React, { useEffect, useRef } from 'react';
import { EnvSnapshot, TASKS } from '../engine/machineVm';

interface ArenaCanvasProps {
  env: EnvSnapshot;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ env }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(220, Math.floor(rect.height));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background obsidian grid surface
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, w, h);

    if (env.taskId === 'arena') {
      const pad = 20;
      const size = Math.min(w - pad * 2, h - pad * 2);
      const ox = Math.floor((w - size) / 2);
      const oy = Math.floor((h - size) / 2);
      const cell = size / 16;

      // Grid lines
      ctx.strokeStyle = '#182235';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 16; i++) {
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

      // Hazards
      for (const hz of env.hazards) {
        const cx = ox + (hz.x + 0.5) * cell;
        const cy = oy + (hz.y + 0.5) * cell;
        ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
        ctx.fillRect(ox + hz.x * cell + 2, oy + hz.y * cell + 2, cell - 4, cell - 4);
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - cell * 0.24, cy - cell * 0.24);
        ctx.lineTo(cx + cell * 0.24, cy + cell * 0.24);
        ctx.moveTo(cx + cell * 0.24, cy - cell * 0.24);
        ctx.lineTo(cx - cell * 0.24, cy + cell * 0.24);
        ctx.stroke();
      }

      // Energy nodes
      let nearestNode = env.nodes[0];
      let nearestDist = 999;
      for (const n of env.nodes) {
        const d = Math.abs(n.x - env.agentX) + Math.abs(n.y - env.agentY);
        if (d < nearestDist) {
          nearestDist = d;
          nearestNode = n;
        }
        const cx = ox + (n.x + 0.5) * cell;
        const cy = oy + (n.y + 0.5) * cell;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sensor vector to nearest energy node
      if (nearestNode) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox + (env.agentX + 0.5) * cell, oy + (env.agentY + 0.5) * cell);
        ctx.lineTo(ox + (nearestNode.x + 0.5) * cell, oy + (nearestNode.y + 0.5) * cell);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Trail
      if (env.trail.length > 1) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        env.trail.forEach((pt, idx) => {
          const px = ox + (pt.x + 0.5) * cell;
          const py = oy + (pt.y + 0.5) * cell;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // Agent
      const ax = ox + (env.agentX + 0.5) * cell;
      const ay = oy + (env.agentY + 0.5) * cell;
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(ax - cell * 0.28, ay - cell * 0.28, cell * 0.56, cell * 0.56);
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ax - cell * 0.28, ay - cell * 0.28, cell * 0.56, cell * 0.56);

      // Border frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, size, size);
    } else if (env.taskId === 'homeostasis') {
      const padL = 42;
      const padR = 16;
      const padT = 20;
      const padB = 26;
      const gw = w - padL - padR;
      const gh = h - padT - padB;

      // Safe thermal zone (35..65)
      const y65 = padT + gh * (1 - 65 / 100);
      const y35 = padT + gh * (1 - 35 / 100);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(padL, y65, gw, y35 - y65);

      // Horizontal calibration grid
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748B';
      for (let v = 0; v <= 100; v += 25) {
        const y = padT + gh * (1 - v / 100);
        ctx.strokeStyle = '#182235';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + gw, y);
        ctx.stroke();
        ctx.fillText(String(v).padStart(3, ' '), 8, y + 3);
      }

      const hist = env.history;
      if (hist.length > 1) {
        const drawSeries = (getter: (p: (typeof hist)[0]) => number, color: string, dashed = false) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          if (dashed) ctx.setLineDash([4, 3]);
          ctx.beginPath();
          hist.forEach((pt, idx) => {
            const x = padL + (idx / Math.max(1, hist.length - 1)) * gw;
            const y = padT + gh * (1 - Math.max(0, Math.min(100, getter(pt))) / 100);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        };

        drawSeries((p) => p.queue, '#F59E0B', true);
        drawSeries((p) => p.energy, '#10B981', false);
        drawSeries((p) => p.temp, '#06B6D4', false);
      }

      // Legend inside corner
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#06B6D4';
      ctx.fillText('— TEMP', padL + 8, padT + 14);
      ctx.fillStyle = '#10B981';
      ctx.fillText('— ENERGIE', padL + 68, padT + 14);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText('-- WACHTRIJ', padL + 148, padT + 14);
    } else {
      const isHardware = env.taskId === 'hardware';
      const hasCameraGrid =
        isHardware && env.cameraActive && Array.isArray(env.cameraGrid) && env.cameraGrid.length === 64;

      const pad = 20;
      let timelineX = pad;
      let timelineW = w - pad * 2;

      if (hasCameraGrid && env.cameraGrid) {
        const matrixSize = Math.min(h - pad * 2 - 20, Math.floor(w * 0.34));
        const mx = pad;
        const my = pad + 18;
        const cellSize = matrixSize / 8;

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#10B981';
        ctx.fillText('CAMERA-OOG 8x8', mx, pad + 6);

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const v = env.cameraGrid[r * 8 + c] ?? 0;
            ctx.fillStyle = `rgb(${v}, ${Math.min(255, Math.round(v * 1.08))}, ${Math.min(255, Math.round(v * 1.15))})`;
            ctx.fillRect(
              mx + c * cellSize,
              my + r * cellSize,
              Math.ceil(cellSize - 1),
              Math.ceil(cellSize - 1)
            );
          }
        }
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, matrixSize, matrixSize);

        timelineX = mx + matrixSize + 18;
        timelineW = Math.max(120, w - timelineX - pad);
      }

      const bh = h - pad * 2;
      const rows = 24;
      const colW = timelineW / rows;

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748B';
      ctx.fillText(
        isHardware
          ? 'OPEN HARDWARE-BUS ((P0 ^ P1) + (dP0 >> 1)) VS ACT-RESPONS'
          : 'DOEL (P0 XOR (P1 >> 1)) VS ACT-VOORSPELLING (LAATSTE 24 CYCLI)',
        timelineX,
        16
      );

      const hist = env.bitStreamHistory;
      for (let i = 0; i < rows; i++) {
        const x = timelineX + i * colW;
        const item = hist[i];
        ctx.strokeStyle = '#182235';
        ctx.strokeRect(x + 1, pad + 6, colW - 2, bh - 12);

        if (item) {
          for (let b = 0; b < 4; b++) {
            const tBit = (item.target >> (3 - b)) & 1;
            const pBit = (item.pred >> (3 - b)) & 1;
            const yTop = pad + 14 + b * ((bh - 50) / 8);
            const yBot = pad + bh / 2 + 12 + b * ((bh - 50) / 8);

            ctx.fillStyle = tBit ? '#06B6D4' : '#1E293B';
            ctx.fillRect(x + 3, yTop, Math.max(2, colW - 6), 8);

            ctx.fillStyle = pBit ? (item.match ? '#10B981' : '#F59E0B') : '#1E293B';
            ctx.fillRect(x + 3, yBot, Math.max(2, colW - 6), 8);
          }

          ctx.fillStyle = item.match ? '#10B981' : '#F43F5E';
          ctx.fillText(item.match ? 'OK' : 'XX', x + 3, pad + bh - 10);
        }
      }
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
          {env.taskId === 'homeostasis' && (
            <>
              <span className="text-cyan-400">Temp {Math.round(env.temp)}°C</span>
              <span className="text-amber-400">Queue {Math.round(env.queue)}</span>
              <span className="text-emerald-400">Energie {Math.round(env.energy)}%</span>
            </>
          )}
          {env.taskId === 'arena' && (
            <>
              <span className="text-cyan-400">Pos ({env.agentX},{env.agentY})</span>
              <span className="text-emerald-400">Bronnen {env.nodesCollected}</span>
              <span className="text-rose-400">Storing {env.hazardHits}</span>
            </>
          )}
          {env.taskId === 'bitstream' && (
            <>
              <span className="text-cyan-400">
                Doel 0x{env.bitTarget.toString(16).toUpperCase()} ({env.bitTarget.toString(2).padStart(4, '0')})
              </span>
              <span className="text-emerald-400">Exacte hits {env.bitExactHits}</span>
            </>
          )}
          {env.taskId === 'hardware' && (
            <>
              <span className="text-cyan-400">ChA {env.hwStreamA}</span>
              <span className="text-amber-400">dB {env.hwStreamB}</span>
              <span className="text-emerald-400">Hits {env.bitExactHits}</span>
              <span className={env.cameraActive ? 'text-emerald-300' : 'text-slate-400'}>
                {env.cameraActive ? 'Camera Live' : 'Bus/HID'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[240px]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* Hardware sensor port bus strip (P0..P7) */}
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
