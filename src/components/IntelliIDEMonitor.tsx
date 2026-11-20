import { useEffect, useState, useCallback } from 'react';
import { Cpu, Activity, Brain, Zap, Terminal, Eye, GitBranch, Layers } from 'lucide-react';
import type { VMState } from '../engine/machineVm';

interface IntelliIDEMonitorProps {
  vmRef: { current: VMState | null };
  generation: number;
  bestFitness: number;
  meanFitness: number;
  isEvolving: boolean;
  miStage: number;
  miStageGenerations: number;
  miStageGenTarget: number;
  taskId: string;
}

const MI_STAGES = [
  { name: 'Overleeft', icon: '💓' },
  { name: 'Perceert', icon: '👁️' },
  { name: 'Denkt', icon: '🧠' },
  { name: 'Communiqueert', icon: '📡' },
  { name: 'Zichzelf verbetert', icon: '🔧' },
  { name: 'Abstract denkt', icon: '📐' },
];

export default function IntelliIDEMonitor({
  vmRef,
  generation,
  bestFitness,
  meanFitness,
  isEvolving,
  miStage,
  miStageGenerations,
  miStageGenTarget,
  taskId,
}: IntelliIDEMonitorProps) {
  const [regs, setRegs] = useState<bigint[]>([]);
  const [flags, setFlags] = useState({ zf: false, cf: false, sf: false, ip: 0 });
  const [smcCount, setSmcCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [memoryStats, setMemoryStats] = useState<{
    short: bigint[];
    long: bigint[];
    stability: number[];
  }>({ short: [], long: [], stability: [] });
  const [lastAction, setLastAction] = useState<number | null>(null);

  const pollVM = useCallback(() => {
    const vm = vmRef.current;
    if (!vm) return;

    // Poll registers
    if (vm.regs) {
      setRegs(Array.from(vm.regs).slice(0, 8));
    }

    // Poll flags
    setFlags({
      zf: vm.zf ?? false,
      cf: vm.cf ?? false,
      sf: vm.sf ?? false,
      ip: vm.ip ?? 0,
    });

    // Poll SMC log
    if (vm.smcLog) {
      setSmcCount(vm.smcLog.length);
    }

    // Poll cycles
    if (vm.cyclesUsed !== undefined) {
      setCycles(vm.cyclesUsed);
    }

    // Poll memory
    if (vm.memoryShortTerm && vm.memoryLongTerm && vm.memoryStability) {
      setMemoryStats({
        short: Array.from(vm.memoryShortTerm).slice(0, 8),
        long: Array.from(vm.memoryLongTerm).slice(0, 8),
        stability: Array.from(vm.memoryStability).slice(0, 8),
      });
    }

    // Poll last action
    if (vm.out !== undefined) {
      setLastAction(vm.out);
    }
  }, [vmRef]);

  useEffect(() => {
    if (!isEvolving) return;
    pollVM();
    const interval = setInterval(pollVM, 200);
    return () => clearInterval(interval);
  }, [isEvolving, pollVM]);

  // Also poll when not evolving (for manual tick)
  useEffect(() => {
    pollVM();
  }, [generation, pollVM]);

  const formatBigInt = (val: bigint) => {
    const num = Number(val);
    if (num === 0) return '0';
    if (Math.abs(num) < 1000) return num.toString();
    return num.toExponential(1);
  };

  const stabilityColor = (s: number) => {
    if (s >= 200) return 'bg-emerald-400';
    if (s >= 100) return 'bg-cyan-400';
    if (s >= 50) return 'bg-amber-400';
    return 'bg-slate-600';
  };

  return (
    <div className="w-full border border-slate-800 bg-[#0B0F19] rounded-md overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-[#080B12]">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">IntelliIDE Monitor</span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isEvolving ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Gen {generation}</span>
          <span>|</span>
          <span>IP: {flags.ip}</span>
          <span>|</span>
          <span>Cycles: {cycles}</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-0">
        {/* Column 1: Registers (3 cols) */}
        <div className="col-span-3 border-r border-slate-800 p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-300">Registers</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {regs.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-1.5 py-0.5 bg-[#080B12] rounded-sm">
                <span className="text-[10px] font-mono text-slate-500">R{i}</span>
                <span className="text-[10px] font-mono text-cyan-300 truncate ml-1">{formatBigInt(r)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Flags & Action (2 cols) */}
        <div className="col-span-2 border-r border-slate-800 p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-semibold text-slate-300">Flags</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">ZF</span>
              <span className={`text-[10px] font-mono ${flags.zf ? 'text-emerald-400' : 'text-slate-600'}`}>{flags.zf ? '1' : '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">CF</span>
              <span className={`text-[10px] font-mono ${flags.cf ? 'text-emerald-400' : 'text-slate-600'}`}>{flags.cf ? '1' : '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">SF</span>
              <span className={`text-[10px] font-mono ${flags.sf ? 'text-emerald-400' : 'text-slate-600'}`}>{flags.sf ? '1' : '0'}</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-300">Action</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-mono font-bold text-emerald-300">
                  {lastAction !== null ? lastAction : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Memory (3 cols) */}
        <div className="col-span-3 border-r border-slate-800 p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-300">Geheugen</span>
          </div>
          <div className="space-y-1">
            {/* Short-term memory */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">Kortetermijn</div>
              <div className="grid grid-cols-4 gap-0.5">
                {memoryStats.short.map((s, i) => (
                  <div key={i} className="text-center px-0.5 py-0.5 bg-[#080B12] rounded-sm">
                    <span className="text-[9px] font-mono text-purple-300">{formatBigInt(s)}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Long-term memory */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">Langetermijn</div>
              <div className="grid grid-cols-4 gap-0.5">
                {memoryStats.long.map((l, i) => (
                  <div key={i} className="text-center px-0.5 py-0.5 bg-[#080B12] rounded-sm">
                    <span className="text-[9px] font-mono text-indigo-300">{formatBigInt(l)}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stability bars */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-0.5">Stabiliteit</div>
              <div className="flex gap-0.5">
                {memoryStats.stability.map((s, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-sm bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${stabilityColor(s)} transition-all duration-300`}
                      style={{ width: `${Math.min(100, (s / 255) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Evolution & MI Stage (4 cols) */}
        <div className="col-span-4 p-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Evolution stats */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <GitBranch className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-300">Evolutie</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">Best</span>
                  <span className="text-[10px] font-mono text-emerald-300">{bestFitness.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">Mean</span>
                  <span className="text-[10px] font-mono text-slate-300">{meanFitness.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">SMC</span>
                  <span className={`text-[10px] font-mono ${smcCount > 0 ? 'text-amber-300' : 'text-slate-600'}`}>{smcCount}</span>
                </div>
              </div>
            </div>

            {/* MI Stage */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] font-semibold text-slate-300">MI Stadium</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{MI_STAGES[miStage]?.icon}</span>
                  <span className="text-[11px] font-mono text-cyan-300">{MI_STAGES[miStage]?.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Gen {miStageGenerations}/{miStageGenTarget}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-sm bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${(miStageGenerations / miStageGenTarget) * 100}%` }}
                  />
                </div>
                {/* Task badge */}
                <div className="flex items-center gap-1 mt-1">
                  <Terminal className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{taskId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
