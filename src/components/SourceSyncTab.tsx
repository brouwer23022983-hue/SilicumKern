import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  RefreshCw,
} from 'lucide-react';
import { GITHUB_URL } from './CodeExportView';

const AI_STUDIO_DEV_URL =
  'https://ais-dev-ed5z2r6g7gsdedynlogn3g-611003462068.europe-west3.run.app';
const AI_STUDIO_SHARED_URL =
  'https://ais-pre-ed5z2r6g7gsdedynlogn3g-611003462068.europe-west3.run.app';

interface SyncFileFingerprint {
  path: string;
  size: number;
  sha256Short: string;
  mtimeMs: number;
}

interface SyncStatusResponse {
  environment: 'aistudio-cloud' | 'host-pc';
  hostname: string;
  platform: string;
  nodeVersion: string;
  projectRoot: string;
  appVersion: string;
  bundleHash: string;
  files: SyncFileFingerprint[];
  gitLocal: {
    hasGit: boolean;
    branch: string | null;
    headCommit: string | null;
    headShort: string | null;
    headSubject: string | null;
    dirtyFiles: string[];
    remoteOrigin: string | null;
    error: string | null;
  };
  githubRemote: {
    reachable: boolean;
    repoUrl: string;
    branches: Record<string, { commit: string; short: string }>;
    error: string | null;
  };
  checkedAt: string;
}

export const SourceSyncTab: React.FC = () => {
  const [branch, setBranch] = useState<string>('nieuwe-software');
  const [hostPcUrl, setHostPcUrl] = useState<string>('http://localhost:3000');
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const [hereStatus, setHereStatus] = useState<SyncStatusResponse | null>(null);
  const [hostStatus, setHostStatus] = useState<SyncStatusResponse | null>(null);
  const [hostProbeError, setHostProbeError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hereOrigin = typeof window !== 'undefined' ? window.location.origin : AI_STUDIO_DEV_URL;
  const isRunningOnLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = (await res.json()) as SyncStatusResponse;
        setHereStatus(data);
        if (data.gitLocal.branch && data.githubRemote.branches[data.gitLocal.branch]) {
          // Keep user-selected branch unless first load
        }
      }
    } catch {
      // Ignore transient error
    }

    if (isRunningOnLocalhost) {
      setHostProbeError(null);
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1800);
        const cleanHost = hostPcUrl.replace(/\/+$/, '');
        const hostRes = await fetch(`${cleanHost}/api/sync/status`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (hostRes.ok) {
          const hostData = (await hostRes.json()) as SyncStatusResponse;
          setHostStatus(hostData);
          setHostProbeError(null);
        } else {
          setHostStatus(null);
          setHostProbeError(`HTTP ${hostRes.status}`);
        }
      } catch {
        setHostStatus(null);
        setHostProbeError('Host PC niet bereikbaar op ' + hostPcUrl);
      }
    }
    setLoading(false);
  }, [hostPcUrl, isRunningOnLocalhost]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!autoPoll) return;
    const id = window.setInterval(() => {
      void refreshAll();
    }, 10000);
    return () => window.clearInterval(id);
  }, [autoPoll, refreshAll]);

  const effectiveHost = isRunningOnLocalhost ? hereStatus : hostStatus;
  const githubBranchRef = hereStatus?.githubRemote.branches[branch] ?? null;
  const availableBranches = useMemo(() => {
    const keys = Object.keys(hereStatus?.githubRemote.branches ?? {});
    if (keys.length === 0) return ['nieuwe-software', 'master', 'main'];
    return keys;
  }, [hereStatus]);

  const hostMatchesGithub =
    Boolean(effectiveHost?.gitLocal.headCommit && githubBranchRef?.commit) &&
    effectiveHost?.gitLocal.headCommit === githubBranchRef?.commit &&
    (effectiveHost?.gitLocal.dirtyFiles.length ?? 0) === 0;

  const hostMatchesHere =
    Boolean(effectiveHost?.bundleHash && hereStatus?.bundleHash) &&
    effectiveHost?.bundleHash === hereStatus?.bundleHash;

  const runGitAction = async (
    targetBaseUrl: string,
    action: 'fetch' | 'pull' | 'push' | 'checkout'
  ) => {
    setActionBusy(true);
    setActionMsg(null);
    try {
      const url = targetBaseUrl ? `${targetBaseUrl.replace(/\/+$/, '')}/api/sync/action` : '/api/sync/action';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, branch }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setActionMsg(data.message || (data.ok ? 'Sync voltooid.' : 'Sync mislukt.'));
      await refreshAll();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Verbindingsfout bij sync-actie.');
    } finally {
      setActionBusy(false);
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard unsupported
    }
  };

  const gitSyncCommands = [
    `git checkout ${branch}`,
    `git pull --rebase origin ${branch}`,
    `git add -A && git commit -m "Sync SiliciumKern" || true`,
    `git push -u origin ${branch}`,
  ].join('\n');

  const githubBranchUrl = `${GITHUB_URL}/tree/${encodeURIComponent(branch)}`;
  const hostActionBase = isRunningOnLocalhost ? '' : hostPcUrl;
  const canRemoteHostGit = Boolean(effectiveHost?.gitLocal.hasGit);

  const fileRows = useMemo(() => {
    const hereFiles = new Map((hereStatus?.files ?? []).map((f) => [f.path, f]));
    const hostFiles = new Map((effectiveHost?.files ?? []).map((f) => [f.path, f]));
    const allPaths = Array.from(new Set([...hereFiles.keys(), ...hostFiles.keys()]));
    return allPaths.map((p) => {
      const a = hereFiles.get(p);
      const b = hostFiles.get(p);
      const identical = Boolean(a && b && a.sha256Short === b.sha256Short);
      return { path: p, here: a, host: b, identical };
    });
  }, [hereStatus, effectiveHost]);

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="border border-slate-800 rounded-md bg-[#0B0F19] p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-slate-100">
            Sources Sync (Hier · Host PC · GitHub · Google AI Studio)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live hash- en commitvergelijking om alle drie de bronnen op exact dezelfde code te houden.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>Branch</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-[#080B12] border border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs text-cyan-300"
            >
              {availableBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setAutoPoll((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              autoPoll
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#080B12] border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto-check (10s): {autoPoll ? 'Aan' : 'Uit'}
          </button>

          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Nu controleren
          </button>
        </div>
      </div>

      {/* Host PC URL setting when viewing from AI Studio */}
      {!isRunningOnLocalhost && (
        <div className="border border-slate-800 rounded-md bg-[#0B0F19] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-300">
            Lokale Host PC eindpunt voor directe vergelijking vanuit AI Studio:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHostPcUrl('http://localhost:25565')}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                hostPcUrl === 'http://localhost:25565'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#080B12] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              :25565
            </button>
            <button
              type="button"
              onClick={() => setHostPcUrl('http://localhost:3000')}
              className={`px-2.5 py-1 rounded text-xs font-mono border ${
                hostPcUrl === 'http://localhost:3000'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#080B12] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              :3000
            </button>
            <input
              type="text"
              value={hostPcUrl}
              onChange={(e) => setHostPcUrl(e.target.value)}
              className="w-60 bg-[#080B12] border border-slate-700 rounded px-2.5 py-1 font-mono text-xs text-slate-100"
              placeholder="http://localhost:25565"
            />
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-medium whitespace-nowrap"
            >
              Verbind Host PC
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Source + Links Comparison Table */}
      <div className="border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0E1320] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">
            Bronnen &amp; Synchronisatietabel
          </span>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            Laatste check: {hereStatus?.checkedAt ? new Date(hereStatus.checkedAt).toLocaleTimeString() : '—'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0A0E17] text-[11px] text-slate-400 font-medium">
                <th className="py-2.5 px-4">Bron</th>
                <th className="py-2.5 px-4">Link / Adres</th>
                <th className="py-2.5 px-4">Branch / Omgeving</th>
                <th className="py-2.5 px-4">Commit / Bundle-hash</th>
                <th className="py-2.5 px-4">Sync-status</th>
                <th className="py-2.5 px-4 text-right">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {/* Row 1: Hier (Actieve App) */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                  Hier (Actieve sessie)
                </td>
                <td className="py-3 px-4 font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <a
                      href={hereOrigin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-slate-700 underline-offset-2 hover:text-cyan-200 truncate max-w-[260px]"
                    >
                      {hereOrigin}
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyText('here', hereOrigin)}
                      className="text-slate-500 hover:text-slate-200"
                      title="Kopieer link"
                    >
                      {copiedId === 'here' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  {hereStatus?.environment === 'host-pc'
                    ? `${hereStatus.gitLocal.branch ?? 'lokaal'} (${hereStatus.hostname})`
                    : `AI Studio container (${hereStatus?.nodeVersion ?? 'Node'})`}
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                  {hereStatus?.gitLocal.headShort ? `${hereStatus.gitLocal.headShort} · ` : ''}
                  <span className="text-cyan-300">{hereStatus?.bundleHash ?? '—'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-emerald-400 font-medium">Actief geladen</span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <a
                    href={hereOrigin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>

              {/* Row 2: Host PC */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                  Host PC (Lokaal)
                </td>
                <td className="py-3 px-4 font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <a
                      href={hostPcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-slate-700 underline-offset-2 hover:text-cyan-200 truncate max-w-[260px]"
                    >
                      {hostPcUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyText('host', hostPcUrl)}
                      className="text-slate-500 hover:text-slate-200"
                      title="Kopieer link"
                    >
                      {copiedId === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  {effectiveHost
                    ? `${effectiveHost.gitLocal.branch ?? 'geen .git'} · ${effectiveHost.platform}`
                    : hostProbeError ?? 'Niet verbonden'}
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                  {effectiveHost ? (
                    <>
                      {effectiveHost.gitLocal.headShort ?? 'geen commit'} ·{' '}
                      <span className={hostMatchesHere ? 'text-emerald-400' : 'text-amber-300'}>
                        {effectiveHost.bundleHash}
                      </span>
                      {effectiveHost.gitLocal.dirtyFiles.length > 0 && (
                        <span className="text-amber-300 ml-1">
                          (+{effectiveHost.gitLocal.dirtyFiles.length} gewijzigd)
                        </span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4">
                  {!effectiveHost ? (
                    <span className="text-slate-400">
                      Start lokaal <code className="text-slate-300">npm run dev</code>
                    </span>
                  ) : hostMatchesGithub && hostMatchesHere ? (
                    <span className="text-emerald-400 font-medium">Gelijk met GitHub &amp; Hier</span>
                  ) : hostMatchesGithub ? (
                    <span className="text-cyan-300 font-medium">Gelijk met GitHub</span>
                  ) : effectiveHost.gitLocal.dirtyFiles.length > 0 ? (
                    <span className="text-amber-300 font-medium">Lokale wijzigingen niet gepusht</span>
                  ) : (
                    <span className="text-amber-300 font-medium">Wijkt af van GitHub / Hier</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={actionBusy || !canRemoteHostGit}
                      onClick={() => void runGitAction(hostActionBase, 'pull')}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded"
                    >
                      Pull
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy || !canRemoteHostGit}
                      onClick={() => void runGitAction(hostActionBase, 'push')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded"
                    >
                      Push
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3: GitHub */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                  GitHub (Upstream repo)
                </td>
                <td className="py-3 px-4 font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <a
                      href={githubBranchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-slate-700 underline-offset-2 hover:text-cyan-200 truncate max-w-[260px]"
                    >
                      {githubBranchUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyText('github', githubBranchUrl)}
                      className="text-slate-500 hover:text-slate-200"
                      title="Kopieer link"
                    >
                      {copiedId === 'github' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    origin/{branch}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <GitCommitHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    {githubBranchRef?.short ?? '—'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {hereStatus?.githubRemote.reachable ? (
                    <span className="text-emerald-400 font-medium">Bereikbaar</span>
                  ) : (
                    <span className="text-rose-400 font-medium">Niet bereikbaar</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <a
                    href={`${GITHUB_URL}/commits/${encodeURIComponent(branch)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Commits <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>

              {/* Row 4: Google AI Studio */}
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-semibold text-slate-100 whitespace-nowrap">
                  Google AI Studio
                </td>
                <td className="py-3 px-4 font-mono text-cyan-300">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={AI_STUDIO_DEV_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-slate-700 underline-offset-2 hover:text-cyan-200 truncate max-w-[260px]"
                      >
                        Dev: {AI_STUDIO_DEV_URL.replace('https://', '')}
                      </a>
                      <button
                        type="button"
                        onClick={() => void copyText('ais-dev', AI_STUDIO_DEV_URL)}
                        className="text-slate-500 hover:text-slate-200"
                        title="Kopieer AI Studio Dev link"
                      >
                        {copiedId === 'ais-dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <a
                        href={AI_STUDIO_SHARED_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-slate-700 underline-offset-2 hover:text-slate-200 truncate max-w-[260px]"
                      >
                        Shared: {AI_STUDIO_SHARED_URL.replace('https://', '')}
                      </a>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  Cloud workspace
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                  {hereStatus?.environment === 'aistudio-cloud'
                    ? hereStatus.bundleHash
                    : 'Zie Actieve sessie in AI Studio'}
                </td>
                <td className="py-3 px-4">
                  {hereStatus?.environment === 'aistudio-cloud' ? (
                    hostMatchesHere ? (
                      <span className="text-emerald-400 font-medium">Gelijk met Host PC</span>
                    ) : effectiveHost ? (
                      <span className="text-amber-300 font-medium">Bundle-hash verschilt van Host PC</span>
                    ) : (
                      <span className="text-cyan-300 font-medium">Cloud actief</span>
                    )
                  ) : (
                    <span className="text-slate-400">Open AI Studio link om te vergelijken</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <a
                    href={AI_STUDIO_DEV_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {actionMsg && (
        <div className="border border-slate-700 bg-[#0E1320] rounded-md px-4 py-2.5 text-xs font-mono text-cyan-200">
          {actionMsg}
        </div>
      )}

      {/* 1-Click Sync Scripts + Per-File Hash Parity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Per-file hash comparison */}
        <div className="lg:col-span-7 border border-slate-800 rounded-md bg-[#0B0F19] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0E1320] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Bestands-integriteit (SHA-256)
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {fileRows.length} kernbestanden
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0A0E17] text-[11px] text-slate-400">
                  <th className="py-2 px-4">Bestand</th>
                  <th className="py-2 px-4">Hier</th>
                  <th className="py-2 px-4">Host PC</th>
                  <th className="py-2 px-4 text-right">Parity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {fileRows.map((row) => (
                  <tr key={row.path} className="hover:bg-slate-900/40">
                    <td className="py-2 px-4 text-slate-200">{row.path}</td>
                    <td className="py-2 px-4 text-cyan-300 tabular-nums">
                      {row.here?.sha256Short ?? '—'}
                    </td>
                    <td className="py-2 px-4 text-slate-300 tabular-nums">
                      {row.host?.sha256Short ?? '—'}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {!row.host ? (
                        <span className="text-slate-500">Host offline</span>
                      ) : row.identical ? (
                        <span className="text-emerald-400">Gelijk</span>
                      ) : (
                        <span className="text-amber-300">Verschilt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-click Host Sync Scripts & GitHub sync commands */}
        <div className="lg:col-span-5 border border-slate-800 rounded-md bg-[#0B0F19] p-4 space-y-4">
          <div>
            <h2 className="text-xs font-semibold text-slate-200">
              1-klik Sync Host PC ↔ GitHub ↔ AI Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Download het sync-script voor je Host PC of draai het Git-commando. Na push naar{' '}
              <span className="font-mono text-cyan-300">{branch}</span> kan AI Studio direct pullen.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/sync/script?os=ps1&branch=${encodeURIComponent(branch)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              sync-siliciumkern.ps1 (Windows)
            </a>
            <a
              href={`/api/sync/script?os=sh&branch=${encodeURIComponent(branch)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              sync-siliciumkern.sh (Linux/macOS)
            </a>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Host PC Terminal-commando</span>
              <button
                type="button"
                onClick={() => void copyText('cmd', gitSyncCommands)}
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
              >
                {copiedId === 'cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedId === 'cmd' ? 'Gekopieerd' : 'Kopieer'}
              </button>
            </div>
            <pre className="p-3 bg-[#060912] border border-slate-800 rounded font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
              {gitSyncCommands}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={actionBusy || !canRemoteHostGit}
              onClick={() => void runGitAction(hostActionBase, 'fetch')}
              className="px-3 py-1.5 text-xs font-medium bg-[#080B12] border border-slate-700 hover:border-slate-500 disabled:opacity-40 text-slate-200 rounded"
            >
              Host Fetch
            </button>
            <button
              type="button"
              disabled={actionBusy || !canRemoteHostGit}
              onClick={() => void runGitAction(hostActionBase, 'checkout')}
              className="px-3 py-1.5 text-xs font-medium bg-[#080B12] border border-slate-700 hover:border-slate-500 disabled:opacity-40 text-slate-200 rounded"
            >
              Host Checkout {branch}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
