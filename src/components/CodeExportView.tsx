import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, RefreshCw } from 'lucide-react';
import {
  BitWidth,
  TaskId,
  generateC99Code,
  generateHexDump,
  generateNasmX64Code,
  generateStandaloneTrainerC99,
} from '../engine/machineVm';

export const GITHUB_REPO = 'brouwer23022983-hue/SilicumKern';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

export interface UpdateCheckState {
  status: 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error';
  remoteBuildId?: string;
  githubCommitSha?: string;
  githubCommitMessage?: string;
  githubCommitUrl?: string;
  githubAhead?: boolean;
  openPullRequests?: number;
}

interface CodeExportViewProps {
  genome: Uint8Array;
  taskId: TaskId;
  bitWidth: BitWidth;
  generation: number;
  updateState: UpdateCheckState;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
}

type ExportFormat = 'c99' | 'trainer' | 'nasm' | 'hex';

export const CodeExportView: React.FC<CodeExportViewProps> = ({
  genome,
  taskId,
  bitWidth,
  generation,
  updateState,
  onCheckUpdate,
  onApplyUpdate,
}) => {
  const [format, setFormat] = useState<ExportFormat>('c99');
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    if (format === 'c99') return generateC99Code(genome, taskId, bitWidth);
    if (format === 'trainer') return generateStandaloneTrainerC99(genome, taskId, bitWidth);
    if (format === 'nasm') return generateNasmX64Code(genome, taskId, bitWidth);
    return generateHexDump(genome);
  }, [format, genome, taskId, bitWidth]);

  const filename =
    format === 'c99'
      ? `silicium_${bitWidth}bit_gen${generation}.c`
      : format === 'trainer'
        ? `silicium_trainer_${bitWidth}bit_gen${generation}.c`
        : format === 'nasm'
          ? `silicium_${bitWidth}bit_gen${generation}.asm`
          : `silicium_gen${generation}.hex`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-[#0E1320]">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Exporteer geëvolueerde machinetaal-kern ({bitWidth}-bit)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generatie {generation} · 44 opcodes · 128 B programma + 128 B L1 RAM + 128-bit XMM0..XMM3
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#080B12] border border-slate-800 rounded-md">
            {(
              [
                ['c99', 'C99 Kern'],
                ['trainer', 'C99 Volledige Trainer'],
                ['nasm', 'x86-64 + SSE2 NASM'],
                ['hex', 'Ruwe Hex'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormat(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  format === key
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Gekopieerd' : 'Kopieer'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download {filename}
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-800 bg-[#0A0E17] text-xs text-slate-300 flex flex-wrap items-center justify-between gap-4">
        <span>
          <strong className="text-slate-100 font-medium">Lokaal draaien (Linux/Windows):</strong>{' '}
          <code className="text-cyan-300">
            {format === 'c99'
              ? `gcc -O3 -march=native ${filename} -o micro_ai`
              : format === 'trainer'
                ? `gcc -O3 -march=native ${filename} -o trainer`
                : format === 'nasm'
                  ? `nasm -f elf64 ${filename} -o micro_ai.o`
                  : 'Direct te laden als uint8_t[128] in C, Rust no_std of bootloader'}
          </code>
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={updateState.githubCommitUrl ?? GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-slate-400 hover:text-cyan-300 underline decoration-slate-700 underline-offset-4 transition-colors whitespace-nowrap"
          >
            {updateState.githubCommitSha
              ? `GitHub · ${updateState.githubCommitSha}${updateState.githubAhead ? ' (nieuwer op GitHub)' : ''}`
              : `GitHub · ${GITHUB_REPO}`}
          </a>

          {updateState.openPullRequests && updateState.openPullRequests > 0 ? (
            <a
              href={`${GITHUB_URL}/pulls`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-amber-300 hover:text-amber-200 underline decoration-amber-500/40 underline-offset-4 whitespace-nowrap"
            >
              {updateState.openPullRequests} open PR
            </a>
          ) : null}

          {updateState.status === 'update-available' ? (
            <button
              type="button"
              onClick={onApplyUpdate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nieuwe build klaar — klik om bij te werken
            </button>
          ) : (
            <button
              type="button"
              onClick={onCheckUpdate}
              disabled={updateState.status === 'checking'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${updateState.status === 'checking' ? 'animate-spin' : ''}`}
              />
              {updateState.status === 'checking'
                ? 'Controleren...'
                : updateState.status === 'up-to-date'
                  ? 'Actueel (klik nogmaals om te checken)'
                  : updateState.status === 'error'
                    ? 'Check mislukt — probeer opnieuw'
                    : 'Controleer op updates'}
            </button>
          )}
        </div>
      </div>

      <pre className="flex-1 p-5 overflow-auto text-xs font-mono leading-relaxed text-slate-200 bg-[#080B12]">
        <code>{code}</code>
      </pre>
    </div>
  );
};
