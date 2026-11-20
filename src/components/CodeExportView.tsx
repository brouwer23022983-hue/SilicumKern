import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import {
  BitWidth,
  TaskId,
  generateC99Code,
  generateHexDump,
  generateNasmX64Code,
  generateStandaloneTrainerC99,
} from '../engine/machineVm';
import {
  generateWasmCCode,
  generateWasmBuildScript,
  generateWasmWrapperJS,
} from '../engine/generateWasmEmscripten';

export const GITHUB_REPO = 'brouwer23022983-hue/SilicumKern';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

interface CodeExportViewProps {
  genome: Uint8Array;
  taskId: TaskId;
  bitWidth: BitWidth;
  maxCycles: number;
  popSize: number;
  generation: number;
}

type ExportFormat = 'c99' | 'trainer' | 'nasm' | 'hex' | 'wasm';

export const CodeExportView: React.FC<CodeExportViewProps> = ({
  genome,
  taskId,
  bitWidth,
  maxCycles,
  popSize,
  generation,
}) => {
  const [format, setFormat] = useState<ExportFormat>('c99');
  const [copied, setCopied] = useState(false);
  const [wasmSubTab, setWasmSubTab] = useState<'c' | 'build' | 'wrapper'>('c');

  const code = useMemo(() => {
    if (format === 'c99') return generateC99Code(genome, taskId, bitWidth, maxCycles);
    if (format === 'trainer')
      return generateStandaloneTrainerC99(genome, taskId, bitWidth, maxCycles, popSize);
    if (format === 'nasm') return generateNasmX64Code(genome, taskId, bitWidth, maxCycles);
    if (format === 'hex') return generateHexDump(genome);
    // WASM sub-tabs
    if (wasmSubTab === 'c') return generateWasmCCode(genome, taskId, bitWidth, maxCycles);
    if (wasmSubTab === 'build') return generateWasmBuildScript(bitWidth);
    return generateWasmWrapperJS();
  }, [format, wasmSubTab, genome, taskId, bitWidth, maxCycles, popSize]);

  const filename =
    format === 'c99'
      ? `silicium_${bitWidth}bit_gen${generation}.c`
      : format === 'trainer'
        ? `silicium_trainer_${bitWidth}bit_gen${generation}.c`
        : format === 'nasm'
          ? `silicium_${bitWidth}bit_gen${generation}.asm`
          : format === 'hex'
            ? `silicium_gen${generation}.hex`
            : wasmSubTab === 'c'
              ? `silicium_wasm_${bitWidth}bit_gen${generation}.c`
              : wasmSubTab === 'build'
                ? `build_wasm.sh`
                : `silicium_wasm_wrapper.js`;

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
                ['wasm', 'WebAssembly'],
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

          {/* WASM sub-tabs */}
          {format === 'wasm' && (
            <div className="flex items-center gap-1 p-1 bg-[#080B12] border border-slate-800 rounded-md">
              {(
                [
                  ['c', 'Emscripten C'],
                  ['build', 'Build Script'],
                  ['wrapper', 'JS Wrapper'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWasmSubTab(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    wasmSubTab === key
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

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
                  : format === 'wasm'
                    ? `emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_silicium_tick"]' ${filename} -o silicium.js`
                    : 'Direct te laden als uint8_t[128] in C, Rust no_std of bootloader'}
          </code>
        </span>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-slate-400 hover:text-cyan-300 underline decoration-slate-700 underline-offset-4 transition-colors whitespace-nowrap"
        >
          GitHub · {GITHUB_REPO}
        </a>
      </div>

      <pre className="flex-1 p-5 overflow-auto text-xs font-mono leading-relaxed text-slate-200 bg-[#080B12]">
        <code>{code}</code>
      </pre>
    </div>
  );
};
