import React, { useMemo } from 'react';
import { decodeInstruction, disassembleInstruction, Opcode, PROG_LEN } from '../engine/machineVm';

interface GenomeVisualizerProps {
  genome: Uint8Array;
  hitCounts: Uint32Array;
  maxHits?: number;
}

interface Block {
  id: number;
  start: number;
  end: number;
  instructions: string[];
  hitCount: number;
  hasJump: boolean;
  jumpTarget: number | null;
  jumpType: 'unconditional' | 'conditional' | null;
}

interface Edge {
  from: number;
  to: number;
  type: 'fallthrough' | 'unconditional' | 'conditional';
  label?: string;
}

function computeControlFlow(genome: Uint8Array, hitCounts: Uint32Array): { blocks: Block[]; edges: Edge[] } {
  const blocks: Block[] = [];
  const edges: Edge[] = [];
  const visited = new Set<number>();

  // Identify jump targets
  const jumpTargets = new Set<number>();
  for (let i = 0; i < PROG_LEN; i++) {
    const inst = decodeInstruction(genome, i);
    if ([Opcode.JMP, Opcode.JZ, Opcode.JNZ, Opcode.JLT, Opcode.JGE, Opcode.JLE, Opcode.JG].includes(inst.opcode)) {
      const target = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
      jumpTargets.add(target);
    }
  }

  // Build basic blocks: a block starts at a jump target or after a jump
  const blockStarts = new Set<number>();
  blockStarts.add(0);
  for (let i = 0; i < PROG_LEN; i++) {
    if (jumpTargets.has(i)) blockStarts.add(i);
    const inst = decodeInstruction(genome, i);
    if (inst.opcode === Opcode.JMP) {
      blockStarts.add((i + 1) % PROG_LEN);
    }
  }

  // Create blocks
  const sortedStarts = Array.from(blockStarts).sort((a, b) => a - b);
  for (const start of sortedStarts) {
    if (visited.has(start)) continue;
    const block: Block = {
      id: blocks.length,
      start,
      end: start,
      instructions: [],
      hitCount: 0,
      hasJump: false,
      jumpTarget: null,
      jumpType: null,
    };

    for (let pc = start; pc < PROG_LEN && !blockStarts.has((pc + 1) % PROG_LEN) && pc !== start - 1; pc = (pc + 1) % PROG_LEN) {
      const inst = decodeInstruction(genome, pc);
      block.end = pc;
      block.instructions.push(disassembleInstruction(inst));
      block.hitCount += hitCounts[pc] || 0;
      visited.add(pc);

      const isUnconditional = inst.opcode === Opcode.JMP;
      const isConditional = [Opcode.JZ, Opcode.JNZ, Opcode.JLT, Opcode.JGE, Opcode.JLE, Opcode.JG].includes(inst.opcode);

      if (isUnconditional || isConditional) {
        block.hasJump = true;
        block.jumpTarget = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        block.jumpType = isUnconditional ? 'unconditional' : 'conditional';
        if (isUnconditional) break; // unconditional jump ends the block
      }

      // Prevent infinite loops
      if (pc === start && block.instructions.length > 0) break;
      if (block.instructions.length > 20) break;
    }

    blocks.push(block);
  }

  // Build edges
  for (const block of blocks) {
    const nextBlockStart = (block.end + 1) % PROG_LEN;
    // Find if next instruction starts another block
    const nextBlock = blocks.find(b => b.start === nextBlockStart);

    if (block.hasJump && block.jumpTarget !== null) {
      const targetBlock = blocks.find(b => b.start === block.jumpTarget);
      if (targetBlock) {
        edges.push({
          from: block.id,
          to: targetBlock.id,
          type: block.jumpType === 'unconditional' ? 'unconditional' : 'conditional',
          label: block.jumpType === 'conditional' ? 'cond' : '',
        });
      }
    }

    // Fall-through edge (only if not unconditional jump)
    if (nextBlock && block.jumpType !== 'unconditional') {
      edges.push({
        from: block.id,
        to: nextBlock.id,
        type: 'fallthrough',
      });
    }
  }

  return { blocks, edges };
}

export const GenomeVisualizer: React.FC<GenomeVisualizerProps> = ({ genome, hitCounts, maxHits }) => {
  const { blocks, edges } = useMemo(() => computeControlFlow(genome, hitCounts), [genome, hitCounts]);

  const maxHit = maxHits || Math.max(1, ...Array.from(hitCounts).slice(0, PROG_LEN));

  // Layout: arrange blocks in a grid based on their program order
  const blockPositions = useMemo(() => {
    const cols = 4;
    const positions: { x: number; y: number; w: number; h: number }[] = [];
    const cellW = 160;
    const cellH = 60;
    const padX = 20;
    const padY = 20;

    blocks.forEach((block, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: padX + col * (cellW + 10),
        y: padY + row * (cellH + 30),
        w: cellW,
        h: Math.max(cellH, 20 + block.instructions.length * 14),
      });
    });

    return positions;
  }, [blocks]);

  const svgWidth = useMemo(() => {
    const cols = 4;
    return Math.max(600, cols * 170 + 60);
  }, []);

  const svgHeight = useMemo(() => {
    const cols = 4;
    const rows = Math.ceil(blocks.length / cols);
    return Math.max(200, rows * 90 + 60);
  }, [blocks.length]);

  return (
    <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">🔬 Genome Visualizer</span>
          <span className="text-[10px] font-mono text-slate-500">
            {blocks.length} blokken · {edges.length} verbindingen
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-cyan-900 border border-cyan-600"></span>
            <span className="text-slate-400">Onbereikt</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-900 border border-emerald-600"></span>
            <span className="text-slate-400">Actief</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-900 border border-amber-600"></span>
            <span className="text-slate-400">Hot path</span>
          </span>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="overflow-auto p-2 bg-[#060912]">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
        >
          <defs>
            <marker id="arrow-ft" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#475569" />
            </marker>
            <marker id="arrow-uncond" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#3b82f6" />
            </marker>
            <marker id="arrow-cond" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const fromPos = blockPositions[edge.from];
            const toPos = blockPositions[edge.to];
            if (!fromPos || !toPos) return null;

            const fromX = fromPos.x + fromPos.w / 2;
            const fromY = edge.type === 'fallthrough' ? fromPos.y + fromPos.h : fromPos.y + fromPos.h / 2;
            const toX = toPos.x + toPos.w / 2;
            const toY = toPos.y;

            const color = edge.type === 'fallthrough' ? '#475569' : edge.type === 'unconditional' ? '#3b82f6' : '#f59e0b';
            const marker = edge.type === 'fallthrough' ? 'url(#arrow-ft)' : edge.type === 'unconditional' ? 'url(#arrow-uncond)' : 'url(#arrow-cond)';

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={color}
                  strokeWidth={edge.type === 'fallthrough' ? 1 : 2}
                  strokeDasharray={edge.type === 'conditional' ? '4,4' : 'none'}
                  markerEnd={marker}
                  opacity={0.6}
                />
                {edge.label && (
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 4}
                    fill={color}
                    fontSize="8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Blocks */}
          {blocks.map((block, i) => {
            const pos = blockPositions[i];
            if (!pos) return null;

            const intensity = Math.min(1, block.hitCount / maxHit);
            const bgColor = intensity === 0 ? '#0c1929' : intensity < 0.5 ? '#052e16' : '#451a03';
            const borderColor = intensity === 0 ? '#1e3a5f' : intensity < 0.5 ? '#047857' : '#d97706';

            return (
              <g key={`block-${i}`}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={pos.w}
                  height={pos.h}
                  rx="4"
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={intensity > 0.5 ? 2 : 1}
                />
                {/* Block header */}
                <text
                  x={pos.x + 6}
                  y={pos.y + 12}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  @{block.start.toString(16).padStart(2, '0')} hits:{block.hitCount}
                </text>
                {/* Instructions */}
                {block.instructions.slice(0, 3).map((inst, j) => (
                  <text
                    key={j}
                    x={pos.x + 6}
                    y={pos.y + 24 + j * 14}
                    fill="#cbd5e1"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {inst.length > 28 ? inst.substring(0, 28) + '…' : inst}
                  </text>
                ))}
                {block.instructions.length > 3 && (
                  <text
                    x={pos.x + 6}
                    y={pos.y + 24 + 3 * 14}
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    +{block.instructions.length - 3} meer…
                  </text>
                )}
                {/* Jump indicator */}
                {block.hasJump && block.jumpTarget !== null && (
                  <text
                    x={pos.x + pos.w - 6}
                    y={pos.y + 12}
                    fill={block.jumpType === 'unconditional' ? '#3b82f6' : '#f59e0b'}
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    →@{block.jumpTarget.toString(16).padStart(2, '0')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
