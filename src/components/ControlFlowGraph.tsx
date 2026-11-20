import React, { useMemo, useRef } from 'react';
import { decodeInstruction, disassembleInstruction, PROG_LEN, Opcode } from '../engine/machineVm';

interface ControlFlowGraphProps {
  genome: Uint8Array;
  hitCounts: Uint32Array;
}

interface CFGNode {
  index: number;
  opcode: number;
  mnemonic: string;
  isJump: boolean;
  jumpTarget: number | null;
  hitCount: number;
  x: number;
  y: number;
}

interface CFGEdge {
  from: number;
  to: number;
  type: 'fallthrough' | 'conditional' | 'unconditional';
}

export const ControlFlowGraph: React.FC<ControlFlowGraphProps> = ({ genome, hitCounts }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { nodes, edges } = useMemo(() => {
    const nonNopIndices: number[] = [];
    for (let i = 0; i < PROG_LEN; i++) {
      const inst = decodeInstruction(genome, i);
      if (inst.opcode !== Opcode.NOP) {
        nonNopIndices.push(i);
      }
    }

    // Build nodes
    const nodeMap = new Map<number, CFGNode>();
    const nodePositions: Array<{ index: number; x: number; y: number }> = [];

    // Layout: arrange nodes in columns based on jump targets
    const columns: number[][] = [];
    const visited = new Set<number>();
    const queue: Array<{ index: number; col: number }> = [{ index: 0, col: 0 }];

    while (queue.length > 0) {
      const { index, col } = queue.shift()!;
      if (visited.has(index)) continue;
      visited.add(index);

      while (columns.length <= col) columns.push([]);
      if (!columns[col].includes(index)) {
        columns[col].push(index);
      }

      const inst = decodeInstruction(genome, index);
      const nextIndex = (index + 1) % PROG_LEN;

      // Add fallthrough target
      if (!visited.has(nextIndex)) {
        queue.push({ index: nextIndex, col: col + 1 });
      }

      // Add jump target
      if ([Opcode.JMP, Opcode.JZ, Opcode.JNZ, Opcode.JLT, Opcode.JGE, Opcode.JLE, Opcode.JG].includes(inst.opcode)) {
        const target = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        if (!visited.has(target)) {
          queue.push({ index: target, col: col + 1 });
        }
      }
    }

    // Assign positions
    const colWidth = 120;
    const rowHeight = 40;
    const padding = 20;

    for (let col = 0; col < columns.length; col++) {
      for (let row = 0; row < columns[col].length; row++) {
        const index = columns[col][row];
        const inst = decodeInstruction(genome, index);
        const mnemonic = disassembleInstruction(inst).split(' ')[0];

        const isJump = [Opcode.JMP, Opcode.JZ, Opcode.JNZ, Opcode.JLT, Opcode.JGE, Opcode.JLE, Opcode.JG].includes(inst.opcode);
        const jumpTarget = isJump ? ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN : null;

        nodeMap.set(index, {
          index,
          opcode: inst.opcode,
          mnemonic,
          isJump,
          jumpTarget,
          hitCount: hitCounts[index],
          x: padding + col * colWidth,
          y: padding + row * rowHeight,
        });

        nodePositions.push({ index, x: padding + col * colWidth, y: padding + row * rowHeight });
      }
    }

    // Build edges
    const edges: CFGEdge[] = [];
    for (const [fromIndex, fromNode] of nodeMap) {
      const inst = decodeInstruction(genome, fromIndex);
      const nextIndex = (fromIndex + 1) % PROG_LEN;

      // Fallthrough edge
      if (nodeMap.has(nextIndex)) {
        edges.push({
          from: fromIndex,
          to: nextIndex,
          type: 'fallthrough',
        });
      }

      // Jump edge
      if (fromNode.isJump && fromNode.jumpTarget !== null && nodeMap.has(fromNode.jumpTarget)) {
        edges.push({
          from: fromIndex,
          to: fromNode.jumpTarget,
          type: inst.opcode === Opcode.JMP ? 'unconditional' : 'conditional',
        });
      }
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  }, [genome, hitCounts]);

  // Draw on canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    for (const edge of edges) {
      const fromNode = nodes.find(n => n.index === edge.from);
      const toNode = nodes.find(n => n.index === edge.to);
      if (!fromNode || !toNode) continue;

      ctx.beginPath();
      ctx.moveTo(fromNode.x + 50, fromNode.y + 15);
      ctx.lineTo(toNode.x + 50, toNode.y + 15);

      switch (edge.type) {
        case 'fallthrough':
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
          ctx.lineWidth = 1;
          break;
        case 'conditional':
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          break;
        case 'unconditional':
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 2;
          break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw nodes
    for (const node of nodes) {
      // Node background
      const hitIntensity = Math.min(1, node.hitCount / 10);
      const r = Math.round(30 + hitIntensity * 100);
      const g = Math.round(40 + hitIntensity * 50);
      const b = Math.round(60 + hitIntensity * 30);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.strokeStyle = node.isJump ? 'rgba(251, 191, 36, 0.8)' : 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = node.isJump ? 2 : 1;

      // Rounded rectangle
      const x = node.x;
      const y = node.y;
      const w = 100;
      const h = 30;
      const radius = 5;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Node text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(`@${node.index.toString(16).padStart(2, '0')}`, x + 5, y + 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(node.mnemonic.substring(0, 12), x + 5, y + 24);

      // Hit count badge
      if (node.hitCount > 0) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${node.hitCount}`, x + w - 25, y + 12);
      }
    }
  }, [nodes, edges]);

  // Calculate canvas size
  const canvasWidth = Math.max(600, nodes.length * 60);
  const canvasHeight = Math.max(200, nodes.length * 20);

  return (
    <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            🕸️ Control Flow Graph
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            <span className="inline-block w-3 h-0.5 bg-slate-600 mr-1"></span>fallthrough
            <span className="inline-block w-3 h-0.5 bg-amber-400 ml-2 mr-1 border-dashed"></span>conditional
            <span className="inline-block w-3 h-0.5 bg-rose-400 ml-2 mr-1"></span>unconditional
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full bg-[#060912]"
      />
    </div>
  );
};
