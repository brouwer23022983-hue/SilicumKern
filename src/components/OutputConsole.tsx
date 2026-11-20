import React, { useEffect, useRef, useState } from 'react';

export interface LogEntry {
  tick: number;
  generation: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command' | 'system' | 'instruction' | 'register' | 'action' | 'evolution';
}

interface OutputConsoleProps {
  logs: LogEntry[];
  maxVisible?: number;
  onCommand?: (text: string) => void;
}

const TYPE_COLORS: Record<LogEntry['type'], string> = {
  instruction: 'text-cyan-300',
  register: 'text-slate-300',
  action: 'text-emerald-300',
  evolution: 'text-amber-300',
  info: 'text-slate-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-rose-400',
  command: 'text-violet-300',
  system: 'text-slate-500',
};

const TYPE_PREFIXES: Record<LogEntry['type'], string> = {
  instruction: '▶',
  register: '⚙',
  action: '⚡',
  evolution: '🧬',
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✖',
  command: '💬',
  system: '⚙',
};

export const OutputConsole: React.FC<OutputConsoleProps> = ({ logs, maxVisible = 100, onCommand }) => {
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const cmd = inputValue.trim();
      onCommand?.(cmd);
      setInputValue('');
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll]);

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.type === filter);
  const visibleLogs = filteredLogs.slice(-maxVisible);

  const handleClear = () => {
    // Signal parent to clear — use custom event
    window.dispatchEvent(new CustomEvent('output-console-clear'));
  };

  const handleScroll = () => {
    if (consoleRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 30;
      setAutoScroll(atBottom);
    }
  };

  return (
    <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800 bg-[#0E1320]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            📟 Output Console
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {logs.length} entries · {visibleLogs.length} visible
          </span>
          {!autoScroll && (
            <button
              type="button"
              onClick={() => {
                setAutoScroll(true);
                setTimeout(() => {
                  if (consoleRef.current) {
                    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
                  }
                }, 0);
              }}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300"
            >
              ↓ Volg mee
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center gap-1">
            {(['all', 'instruction', 'action', 'evolution', 'info'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  filter === t
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'all' ? 'Alles' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-0.5 text-[10px] font-mono text-slate-500 hover:text-rose-400 rounded transition-colors"
          >
            Wis
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-0.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 rounded transition-colors"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Console body */}
      {expanded && (
        <>
          <div
            ref={consoleRef}
            onScroll={handleScroll}
            className="h-48 overflow-y-auto font-mono text-[11px] p-2 space-y-0.5 bg-[#060912]"
          >
            {visibleLogs.length === 0 ? (
              <div className="text-slate-600 italic p-4 text-center">
                {filter === 'all'
                  ? 'Wacht op uitvoer... Elke tick wordt hier gelogd.'
                  : `Geen "${filter}" entries gevonden.`}
              </div>
            ) : (
              visibleLogs.map((entry, idx) => (
                <div
                  key={`${entry.tick}-${idx}`}
                  className="flex items-start gap-2 leading-relaxed"
                >
                  <span className="shrink-0 text-slate-600 w-12 text-right">
                    T{entry.tick}
                  </span>
                  <span className={`shrink-0 w-16 ${TYPE_COLORS[entry.type]}`}>
                    [{TYPE_PREFIXES[entry.type]} {entry.type}]
                  </span>
                  <span className="text-slate-300 break-all">{entry.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Command input */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-t border-slate-800 bg-[#0E1320]">
            <span className="text-violet-400 text-sm select-none">❯</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleCommand}
              placeholder="Typ een commando en druk Enter..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-violet-300 placeholder-slate-600"
            />
          </div>
        </>
      )}
    </div>
  );
};
