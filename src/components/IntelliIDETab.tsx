import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode2,
  Folder,
  FolderOpen,
  Play,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import IntelliIDEMonitor from './IntelliIDEMonitor';
import { ControlFlowGraph } from './ControlFlowGraph';
import { OutputConsole, type LogEntry } from './OutputConsole';
import {
  PROG_LEN,
  TaskId,
  VMState,
  decodeInstruction,
  disassembleInstruction,
  formatHexBytes,
} from '../engine/machineVm';

interface IntelliIDEStatusResponse {
  running: boolean;
  preferredPort: number;
  liveUrl: string;
  builtInServerActive: boolean;
  builtInServerPort: number | null;
  builtInServerInfo: Record<string, unknown> | null;
  processDetected: boolean;
  processSummary: string | null;
  executablePath: string | null;
  projectHasIdeaDir: boolean;
  projectRoot: string;
  platform: string;
  cloudContainer: boolean;
  deepLink: string;
  checkedAt: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileTreeNode[];
}

interface IntelliIDETabProps {
  vmRef: { current: VMState };
  bestGenome: Uint8Array;
  generation: number;
  bestFitness: number;
  meanFitness: number;
  isEvolving: boolean;
  miStage: number;
  miStageGenerations: number;
  miStageGenTarget: number;
  taskId: TaskId;
  logs: LogEntry[];
  onCommand: (cmd: string) => void;
}

export const IntelliIDETab: React.FC<IntelliIDETabProps> = ({
  vmRef,
  bestGenome,
  generation,
  bestFitness,
  meanFitness,
  isEvolving,
  miStage,
  miStageGenerations,
  miStageGenTarget,
  taskId,
  logs,
  onCommand,
}) => {
  const [idePort, setIdePort] = useState<number>(25565);
  const [status, setStatus] = useState<IntelliIDEStatusResponse | null>(null);
  const [browserPortActive, setBrowserPortActive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'auto' | 'live' | 'embedded'>('auto');
  const [statusMessage, setStatusMessage] = useState<string>('IntelliIDE controleren op poort 25565...');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    src: true,
    'src/engine': true,
    'src/components': true,
    '.idea': true,
  });
  const [selectedFile, setSelectedFile] = useState<string>('src/engine/machineVm.ts');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [workspacePane, setWorkspacePane] = useState<'editor' | 'cfg' | 'asm'>('editor');

  const autoStartAttemptedRef = useRef<boolean>(false);

  const probeBrowserLocalPort = useCallback(async (port: number): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      await fetch(`http://localhost:${port}/`, {
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  }, []);

  const checkAndAutoStart = useCallback(
    async (allowAutoStart: boolean, targetPort: number = idePort) => {
      setIsChecking(true);
      try {
        const [srvRes, clientReachable] = await Promise.all([
          fetch(`/api/intelliide/status?port=${encodeURIComponent(String(targetPort))}`),
          probeBrowserLocalPort(targetPort),
        ]);
        setBrowserPortActive(clientReachable);

        if (!srvRes.ok) throw new Error(`HTTP ${srvRes.status}`);
        const data = (await srvRes.json()) as IntelliIDEStatusResponse;
        setStatus(data);

        const activePort = data.builtInServerPort ?? targetPort;
        if (data.running || clientReachable) {
          setStatusMessage(
            clientReachable && !data.running
              ? `IntelliIDE live gedetecteerd vanuit je browser op http://localhost:${targetPort}.`
              : data.builtInServerActive
                ? `IntelliIDE actief op lokale host (poort ${activePort}).`
                : `IntelliJ IDEA proces gedetecteerd op de lokale host (poort ${targetPort}).`
          );
        } else if (allowAutoStart && !autoStartAttemptedRef.current && data.executablePath) {
          autoStartAttemptedRef.current = true;
          setIsStarting(true);
          setStatusMessage(`IntelliIDE niet actief op :${targetPort} — lokaal starten via ${data.executablePath}...`);
          const startRes = await fetch('/api/intelliide/start', { method: 'POST' });
          const startData = (await startRes.json()) as {
            started?: boolean;
            message?: string;
            status?: IntelliIDEStatusResponse;
          };
          if (startData.status) setStatus(startData.status);
          const recheckClient = await probeBrowserLocalPort(targetPort);
          setBrowserPortActive(recheckClient);
          setStatusMessage(startData.message || 'Startopdracht verstuurd.');
          setIsStarting(false);
        } else if (data.cloudContainer) {
          setStatusMessage(
            `Cloud-container heeft geen directe toegang tot jouw pc-poort :${targetPort}. Draait IntelliIDE lokaal op je pc op http://localhost:${targetPort}, dan opent hij hieronder of via de lokale host-server.`
          );
        } else if (!data.executablePath) {
          setStatusMessage(
            `IntelliIDE niet actief op poort ${targetPort} en geen IntelliJ-executable gevonden in PATH.`
          );
        } else {
          setStatusMessage(`IntelliIDE gevonden maar nog niet actief op poort ${targetPort}.`);
        }
      } catch (err) {
        setStatusMessage(
          err instanceof Error
            ? `Kan host-serverstatus niet ophalen: ${err.message}`
            : 'Kan host-serverstatus niet ophalen.'
        );
      } finally {
        setIsChecking(false);
      }
    },
    [idePort, probeBrowserLocalPort]
  );

  const handleManualStart = useCallback(async () => {
    setIsStarting(true);
    setStatusMessage(`IntelliIDE controleren en starten op poort ${idePort}...`);
    try {
      const res = await fetch('/api/intelliide/start', { method: 'POST' });
      const data = (await res.json()) as {
        message?: string;
        status?: IntelliIDEStatusResponse;
      };
      if (data.status) setStatus(data.status);
      const clientReachable = await probeBrowserLocalPort(idePort);
      setBrowserPortActive(clientReachable);
      setStatusMessage(data.message || 'Actie voltooid.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Starten mislukt.');
    } finally {
      setIsStarting(false);
    }
  }, [idePort, probeBrowserLocalPort]);

  const loadWorkspaceFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/intelliide/files');
      if (!res.ok) return;
      const data = (await res.json()) as { tree?: FileTreeNode[] };
      if (Array.isArray(data.tree)) setFileTree(data.tree);
    } catch {
      // Ignore file tree fetch error
    }
  }, []);

  const loadFile = useCallback(async (relPath: string) => {
    setSelectedFile(relPath);
    setWorkspacePane('editor');
    setFileLoading(true);
    try {
      const res = await fetch(`/api/intelliide/file?path=${encodeURIComponent(relPath)}`);
      if (!res.ok) {
        setFileContent(`// Kan bestand ${relPath} niet laden (HTTP ${res.status})`);
        return;
      }
      const data = (await res.json()) as { content?: string; truncated?: boolean };
      setFileContent(
        (data.content ?? '') +
          (data.truncated ? '\n\n/* ... bestand ingekort voor IDE-weergave ... */' : '')
      );
    } catch {
      setFileContent(`// Fout bij laden van ${relPath}`);
    } finally {
      setFileLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAndAutoStart(true, 25565);
    void loadWorkspaceFiles();
    void loadFile('src/engine/machineVm.ts');
  }, [checkAndAutoStart, loadWorkspaceFiles, loadFile]);

  const vm = vmRef.current;
  const hitCounts = vm?.hitCounts ?? new Uint32Array(PROG_LEN);
  const smcLog = vm?.smcLog ?? [];

  const asmLines = useMemo(() => {
    return Array.from({ length: PROG_LEN }, (_, idx) => {
      const inst = decodeInstruction(bestGenome, idx);
      return {
        idx,
        hex: formatHexBytes(bestGenome, idx),
        asm: disassembleInstruction(inst),
        hits: hitCounts[idx] ?? 0,
      };
    });
  }, [bestGenome, hitCounts]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const renderTreeNodes = (nodes: FileTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => {
      if (node.type === 'dir') {
        const isOpen = Boolean(expandedDirs[node.path]);
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggleDir(node.path)}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
              className="w-full flex items-center gap-1.5 py-1 pr-2 text-left text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate font-mono">{node.name}</span>
            </button>
            {isOpen && node.children && <div>{renderTreeNodes(node.children, depth + 1)}</div>}
          </div>
        );
      }

      const active = selectedFile === node.path && workspacePane === 'editor';
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => void loadFile(node.path)}
          style={{ paddingLeft: `${24 + depth * 12}px` }}
          className={`w-full flex items-center justify-between gap-2 py-1 pr-2 text-left text-xs transition-colors ${
            active
              ? 'bg-cyan-500/15 text-cyan-200'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate font-mono">{node.name}</span>
          </span>
          {typeof node.size === 'number' && (
            <span className="text-[10px] font-mono tabular-nums text-slate-600 shrink-0">
              {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}K` : `${node.size}B`}
            </span>
          )}
        </button>
      );
    });
  };

  const codeLines = useMemo(() => fileContent.split(/\r?\n/), [fileContent]);
  const livePort = status?.builtInServerPort ?? idePort;
  const liveHttpUrl = `http://localhost:${livePort}`;
  const isHostActive = Boolean(status?.running || browserPortActive);
  const showLiveIframe =
    viewMode === 'live' || (viewMode === 'auto' && (browserPortActive || status?.builtInServerActive));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080B12]">
      {/* IntelliIDE Top Host Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-sm font-semibold text-slate-100">IntelliIDE</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span
              className={`font-mono font-semibold ${
                isHostActive
                  ? 'text-emerald-400'
                  : status?.cloudContainer
                    ? 'text-amber-300'
                    : 'text-rose-400'
              }`}
            >
              {isHostActive
                ? `Actief op poort ${livePort}`
                : status?.cloudContainer
                  ? `Poort ${idePort} niet bereikbaar vanuit cloud`
                  : `Niet actief op poort ${idePort}`}
            </span>
            {status?.projectHasIdeaDir && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="font-mono text-slate-400">.idea gedetecteerd</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">{statusMessage}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>Poort</span>
            <input
              type="number"
              min={1}
              max={65535}
              value={idePort}
              onChange={(e) => setIdePort(Math.max(1, Math.min(65535, Number(e.target.value) || 25565)))}
              className="w-20 bg-[#080B12] border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-300 tabular-nums"
            />
          </label>

          <div className="flex items-center gap-1 p-0.5 bg-[#080B12] border border-slate-800 rounded-md text-xs">
            <button
              type="button"
              onClick={() => setViewMode('live')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                showLiveIframe
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live :{livePort}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('embedded')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                !showLiveIframe
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingebouwde IDE
            </button>
          </div>

          <button
            type="button"
            onClick={() => void checkAndAutoStart(false, idePort)}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#080B12] border border-slate-700 hover:border-slate-500 text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            Check :{idePort}
          </button>
          <button
            type="button"
            onClick={() => void handleManualStart()}
            disabled={isStarting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            {isStarting ? 'Starten...' : 'Start lokaal'}
          </button>
          <a
            href={liveHttpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            Open :{livePort}
          </a>
        </div>
      </div>

      {/* Host Telemetry Row */}
      <div className="px-5 py-2 border-b border-slate-800 bg-[#0A0E17] flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
        <span>Platform: {status?.platform ?? 'detecteren...'}</span>
        <span className="text-slate-700">·</span>
        <span>Endpoint: {liveHttpUrl}</span>
        <span className="text-slate-700">·</span>
        <span className="truncate max-w-md">Pad: {status?.projectRoot ?? '—'}</span>
        <span className="text-slate-700">·</span>
        <span>
          Binary: {status?.executablePath ? status.executablePath : 'Geen lokaal binaire pad'}
        </span>
        {status?.deepLink && (
          <>
            <span className="text-slate-700">·</span>
            <a href={status.deepLink} className="text-cyan-400 hover:text-cyan-300 underline">
              jetbrains://SilicumKern
            </a>
          </>
        )}
      </div>

      {showLiveIframe ? (
        <div className="flex-1 flex flex-col min-h-[680px] bg-[#060912]">
          <div className="px-4 py-2 border-b border-slate-800 bg-[#0E1320] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono text-slate-300">
              Live IntelliIDE frame: <span className="text-cyan-300">{liveHttpUrl}</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Blijft leeg door browser-beveiliging of HTTPS→HTTP?</span>
              <button
                type="button"
                onClick={() => setViewMode('embedded')}
                className="text-cyan-300 hover:text-cyan-200 underline"
              >
                Schakel naar Ingebouwde IDE
              </button>
            </div>
          </div>
          <iframe
            title="IntelliIDE Live"
            src={liveHttpUrl}
            className="flex-1 w-full min-h-[640px] border-0 bg-white"
          />
        </div>
      ) : (
        /* Full Built-in IDE Workspace */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Project Tree Sidebar */}
          <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0A0E17] flex flex-col min-h-[280px] max-h-[420px] lg:max-h-none overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 bg-[#0E1320] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Projectbestanden</span>
              <button
                type="button"
                onClick={() => void loadWorkspaceFiles()}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-300"
              >
                Ververs
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5">
              {fileTree.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500">
                  Bestandsboom laden...
                </div>
              ) : (
                renderTreeNodes(fileTree)
              )}
            </div>
          </aside>

          {/* Right Full IDE Stack: Monitor + Editor/CFG/Disasm + SMC + Output Console */}
          <div className="lg:col-span-9 flex flex-col min-w-0 min-h-0 overflow-y-auto p-4 space-y-4">
            <IntelliIDEMonitor
              vmRef={vmRef}
              generation={generation}
              bestFitness={bestFitness}
              meanFitness={meanFitness}
              isEvolving={isEvolving}
              miStage={miStage}
              miStageGenerations={miStageGenerations}
              miStageGenTarget={miStageGenTarget}
              taskId={taskId}
            />

            {/* Main IDE Code / CFG / Assembly Viewport */}
            <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-slate-800 bg-[#0E1320] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-0.5 bg-[#080B12] border border-slate-800 rounded-md">
                  {(
                    [
                      ['editor', `Code-editor (${selectedFile})`],
                      ['cfg', 'Control Flow Graph'],
                      ['asm', 'Live Disassembly & SMC'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWorkspacePane(key)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        workspacePane === key
                          ? 'bg-slate-800 text-cyan-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {workspacePane === 'editor'
                    ? `${codeLines.length} regels`
                    : `${PROG_LEN} slots · SMC events: ${smcLog.length}`}
                </span>
              </div>

              {workspacePane === 'editor' && (
                <div className="h-[360px] overflow-auto bg-[#060912] font-mono text-xs leading-5">
                  {fileLoading ? (
                    <div className="p-4 text-slate-500">Bestand laden...</div>
                  ) : (
                    <div className="min-w-max py-2">
                      {codeLines.map((line, i) => (
                        <div key={i} className="flex px-3 hover:bg-slate-900/60">
                          <span className="w-12 pr-3 text-right select-none text-slate-600 tabular-nums shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-200 whitespace-pre">{line || ' '}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {workspacePane === 'cfg' && (
                <div className="p-3 bg-[#060912]">
                  <ControlFlowGraph genome={bestGenome} hitCounts={hitCounts} />
                </div>
              )}

              {workspacePane === 'asm' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-800 bg-[#060912]">
                  <div className="xl:col-span-8 max-h-[360px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800/40">
                    {asmLines.map((row) => (
                      <div
                        key={row.idx}
                        className="px-3 py-1.5 bg-[#060912] flex items-center justify-between gap-2 font-mono text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-500 tabular-nums">
                            @{row.idx.toString(16).padStart(2, '0').toUpperCase()}
                          </span>
                          <span className="text-slate-200 truncate">{row.asm}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                          {row.hex} {row.hits > 0 ? `· ${row.hits}×` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="xl:col-span-4 max-h-[360px] overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold pb-1 border-b border-slate-800">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      SMC PWRITE Events ({smcLog.length})
                    </div>
                    {smcLog.length === 0 ? (
                      <div className="text-slate-500 text-[11px]">
                        Nog geen runtime SMC-wijzigingen in de actieve sessie.
                      </div>
                    ) : (
                      smcLog.slice(-20).reverse().map((ev, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300">
                          <span className="text-slate-500">T{ev.tick}</span>{' '}
                          <span className="text-amber-300">@{ev.slot}</span>:{' '}
                          <span>{ev.oldMnemonic}</span> → <span className="text-cyan-300">{ev.newMnemonic}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <OutputConsole logs={logs} maxVisible={120} onCommand={onCommand} />
          </div>
        </div>
      )}
    </div>
  );
};
