import React, { useState } from 'react';
import { BitWidth, OPCODE_TABLE, OpcodeCategory, TASKS, TaskId } from '../engine/machineVm';

interface InstructionSetViewProps {
  taskId: TaskId;
  bitWidth: BitWidth;
}

const CATEGORY_LABELS: Array<{ id: OpcodeCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Alle 44' },
  { id: 'data', label: 'Data' },
  { id: 'alu', label: 'ALU Rekenen' },
  { id: 'bit', label: 'Bitwise' },
  { id: 'flow', label: 'Vlaggen & Sprongen' },
  { id: 'mem', label: 'Geheugen' },
  { id: 'simd', label: '128-bit SIMD' },
  { id: 'io', label: 'Hardware I/O' },
  { id: 'smc', label: 'SMC & Multi-Core Bus' },
];

export const InstructionSetView: React.FC<InstructionSetViewProps> = ({ taskId, bitWidth }) => {
  const [filter, setFilter] = useState<OpcodeCategory | 'all'>('all');
  const spec = TASKS[taskId];

  const visibleOps =
    filter === 'all' ? OPCODE_TABLE : OPCODE_TABLE.filter((op) => op.category === filter);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0E1320] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Volledige Instructieset ({OPCODE_TABLE.length} opcodes · 16 / 32 / 64 / 128-bit)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vorm: [Byte 0: Opcode 0x00..0x2B] [Byte 1: Rd/Xd] [Byte 2: Rs/Xs/Poort] [Byte 3: Imm8 / @Addr]
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              Actief profiel: {bitWidth}-bit
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_LABELS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  filter === cat.id
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#080B12] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-[#0A0E17]">
                <th className="py-2.5 px-4 font-mono">Hex</th>
                <th className="py-2.5 px-4 font-mono">Mnemonic</th>
                <th className="py-2.5 px-4 font-mono">Syntaxis</th>
                <th className="py-2.5 px-4">Werking op silicium / VM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {visibleOps.map((op) => (
                <tr key={op.code} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono text-cyan-400">
                    0x{op.code.toString(16).padStart(2, '0').toUpperCase()}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-100">
                    {op.mnemonic}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-amber-300">{op.syntax}</td>
                  <td className="py-2.5 px-4 text-slate-300">{op.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-slate-800 rounded-md bg-[#0B0F19] p-5">
          <h3 className="text-sm font-semibold text-slate-100">Hardware-architectuur</h3>
          <p className="text-xs text-slate-400 mt-1">
            De complete kern inclusief 128-bit SIMD vector-unit past in de L1-cache zonder VRAM.
          </p>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/70">
              <dt className="text-slate-400">Programmageheugen (32 × 4B)</dt>
              <dd className="font-mono text-slate-100">128 bytes</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/70">
              <dt className="text-slate-400">L1 Scratchpad RAM (16 × 64-bit)</dt>
              <dd className="font-mono text-slate-100">128 bytes</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/70">
              <dt className="text-slate-400">Scalair R0..R7 (16/32/64-bit)</dt>
              <dd className="font-mono text-slate-100">64 bytes</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/70">
              <dt className="text-slate-400">128-bit SIMD XMM0..XMM3</dt>
              <dd className="font-mono text-slate-100">64 bytes</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-slate-200 font-medium">Totaal per autonome kern</dt>
              <dd className="font-mono font-semibold text-cyan-400">384 bytes</dd>
            </div>
          </dl>
        </div>

        <div className="border border-slate-800 rounded-md bg-[#0B0F19] p-5">
          <h3 className="text-sm font-semibold text-slate-100">Actieve poorten: {spec.name}</h3>
          <ul className="mt-3 space-y-2 text-xs font-mono text-slate-300">
            {spec.ports.map((p) => (
              <li key={p} className="py-1 border-b border-slate-800/50 last:border-0">
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-xs font-medium text-slate-200 mb-2">Actuator-uitvoer (ACT Rs)</div>
            <ul className="space-y-1 text-xs font-mono text-emerald-400">
              {spec.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
