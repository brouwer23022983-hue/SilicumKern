import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 3000);
const PROJECT_ROOT = process.cwd();
const GITHUB_REPO = 'brouwer23022983-hue/SilicumKern';
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
const GITHUB_GIT_URL = `${GITHUB_URL}.git`;
const DEFAULT_BRANCH = 'nieuwe-software';

interface SyncFileFingerprint {
  path: string;
  size: number;
  sha256Short: string;
  mtimeMs: number;
}

interface IntelliIDEStatus {
  running: boolean;
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

function isCloudContainerEnv(): boolean {
  if (
    process.env.K_SERVICE ||
    process.env.CLOUD_RUN_JOB ||
    process.env.KUBERNETES_SERVICE_HOST ||
    process.env.GOOGLE_CLOUD_PROJECT
  ) {
    return true;
  }
  if (process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
    if (fs.existsSync('/.dockerenv') || PROJECT_ROOT.startsWith('/app/')) {
      return true;
    }
  }
  return false;
}

async function probeJetBrainsBuiltInServer(): Promise<{
  active: boolean;
  port: number | null;
  info: Record<string, unknown> | null;
}> {
  for (const port of [63342, 63343]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 500);
      const res = await fetch(`http://127.0.0.1:${port}/api/about`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (res.ok) {
        let info: Record<string, unknown> | null = null;
        try {
          info = (await res.json()) as Record<string, unknown>;
        } catch {
          info = { status: res.status };
        }
        return { active: true, port, info };
      }
    } catch {
      // Port not listening
    }
  }
  return { active: false, port: null, info: null };
}

async function detectIntelliJProcess(): Promise<{ detected: boolean; summary: string | null }> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('tasklist', ['/FO', 'CSV', '/NH'], { timeout: 2000 });
      const lines = stdout
        .split(/\r?\n/)
        .filter((l) => /idea64\.exe|idea\.exe|intellij/i.test(l));
      if (lines.length > 0) {
        return { detected: true, summary: lines[0].trim() };
      }
      return { detected: false, summary: null };
    }

    const { stdout } = await execFileAsync('ps', ['-eo', 'pid,comm,args'], { timeout: 2000 });
    const lines = stdout.split(/\r?\n/).filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('grep') || lower.includes('server.ts')) return false;
      return (
        /\bidea64\b/.test(lower) ||
        /\bidea\.sh\b/.test(lower) ||
        lower.includes('intellij idea') ||
        lower.includes('com.intellij.idea.main') ||
        lower.includes('/jetbrains/toolbox/apps/idea')
      );
    });
    if (lines.length > 0) {
      return { detected: true, summary: lines[0].trim().slice(0, 140) };
    }
    return { detected: false, summary: null };
  } catch {
    return { detected: false, summary: null };
  }
}

async function findIntelliJExecutable(): Promise<string | null> {
  const envCandidates = [process.env.INTELLIJ_PATH, process.env.IDEA_PATH].filter(
    (v): v is string => Boolean(v && v.trim())
  );
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const binNames =
    process.platform === 'win32'
      ? ['idea64.exe', 'idea.bat', 'idea.cmd']
      : ['idea', 'intellij-idea-community', 'intellij-idea-ultimate'];

  for (const binName of binNames) {
    try {
      const { stdout } = await execFileAsync(cmd, [binName], { timeout: 1500 });
      const first = stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
      if (first && fs.existsSync(first)) return first;
    } catch {
      // Not in PATH
    }
  }

  const staticCandidates: string[] = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const jetbrainsDir = path.join(programFiles, 'JetBrains');
    if (fs.existsSync(jetbrainsDir)) {
      try {
        for (const entry of fs.readdirSync(jetbrainsDir)) {
          if (/intellij idea/i.test(entry)) {
            staticCandidates.push(path.join(jetbrainsDir, entry, 'bin', 'idea64.exe'));
          }
        }
      } catch {
        // Ignore permission errors
      }
    }
    if (localAppData) {
      staticCandidates.push(
        path.join(localAppData, 'JetBrains', 'Toolbox', 'scripts', 'idea.cmd')
      );
    }
  } else if (process.platform === 'darwin') {
    staticCandidates.push(
      '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea',
      '/Applications/IntelliJ IDEA CE.app/Contents/MacOS/idea',
      path.join(os.homedir(), 'Applications/IntelliJ IDEA.app/Contents/MacOS/idea'),
      path.join(os.homedir(), 'Applications/IntelliJ IDEA CE.app/Contents/MacOS/idea'),
      '/usr/local/bin/idea'
    );
  } else {
    staticCandidates.push(
      '/usr/local/bin/idea',
      '/usr/bin/idea',
      '/snap/bin/intellij-idea-community',
      '/snap/bin/intellij-idea-ultimate',
      '/opt/idea/bin/idea.sh',
      path.join(os.homedir(), '.local/share/JetBrains/Toolbox/scripts/idea')
    );
  }

  for (const candidate of staticCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

async function getIntelliIDEStatus(): Promise<IntelliIDEStatus> {
  const [builtIn, proc, executablePath] = await Promise.all([
    probeJetBrainsBuiltInServer(),
    detectIntelliJProcess(),
    findIntelliJExecutable(),
  ]);

  const ideaDir = path.join(PROJECT_ROOT, '.idea');
  let projectName = path.basename(PROJECT_ROOT);
  if (fs.existsSync(ideaDir)) {
    try {
      const iml = fs.readdirSync(ideaDir).find((f) => f.endsWith('.iml'));
      if (iml) projectName = iml.replace(/\.iml$/, '');
    } catch {
      // Ignore
    }
  }
  if (!projectName || projectName === 'applet') {
    projectName = 'SilicumKern';
  }
  return {
    running: builtIn.active || proc.detected,
    builtInServerActive: builtIn.active,
    builtInServerPort: builtIn.port,
    builtInServerInfo: builtIn.info,
    processDetected: proc.detected,
    processSummary: proc.summary,
    executablePath,
    projectHasIdeaDir: fs.existsSync(ideaDir),
    projectRoot: PROJECT_ROOT,
    platform: `${process.platform}/${process.arch}`,
    cloudContainer: isCloudContainerEnv(),
    deepLink: `jetbrains://idea/navigate/reference?project=${encodeURIComponent(projectName)}`,
    checkedAt: new Date().toISOString(),
  };
}

function buildWorkspaceTree(dir: string, relBase = '', depth = 0): FileTreeNode[] {
  if (depth > 4) return [];
  const ignored = new Set(['node_modules', '.git', 'dist', '.next', '.vite', '.cache']);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const result: FileTreeNode[] = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: relPath,
        type: 'dir',
        children: buildWorkspaceTree(absPath, relPath, depth + 1),
      });
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = fs.statSync(absPath).size;
      } catch {
        size = 0;
      }
      result.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size,
      });
    }
  }
  return result;
}

const FINGERPRINT_FILES = [
  'package.json',
  'server.ts',
  'src/App.tsx',
  'src/engine/machineVm.ts',
  'src/workers/evolutionWorker.ts',
  'src/components/IntelliIDETab.tsx',
  'src/components/SourceSyncTab.tsx',
];

function computeSourceBundleFingerprint(): {
  bundleHash: string;
  files: SyncFileFingerprint[];
} {
  const hash = crypto.createHash('sha256');
  const files: SyncFileFingerprint[] = [];

  for (const rel of FINGERPRINT_FILES) {
    const abs = path.join(PROJECT_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const buf = fs.readFileSync(abs);
      const stat = fs.statSync(abs);
      const fileHash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
      hash.update(rel);
      hash.update(':');
      hash.update(fileHash);
      hash.update(';');
      files.push({
        path: rel,
        size: stat.size,
        sha256Short: fileHash,
        mtimeMs: Math.round(stat.mtimeMs),
      });
    } catch {
      // Skip unreadable file
    }
  }

  return {
    bundleHash: hash.digest('hex').slice(0, 12),
    files,
  };
}

async function getGitLocalStatus(): Promise<{
  hasGit: boolean;
  branch: string | null;
  headCommit: string | null;
  headShort: string | null;
  headSubject: string | null;
  dirtyFiles: string[];
  remoteOrigin: string | null;
  error: string | null;
}> {
  const gitDir = path.join(PROJECT_ROOT, '.git');
  if (!fs.existsSync(gitDir)) {
    return {
      hasGit: false,
      branch: null,
      headCommit: null,
      headShort: null,
      headSubject: null,
      dirtyFiles: [],
      remoteOrigin: null,
      error: null,
    };
  }

  try {
    const [branchOut, headOut, subjOut, statusOut, remoteOut] = await Promise.all([
      execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: PROJECT_ROOT, timeout: 2500 }),
      execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: PROJECT_ROOT, timeout: 2500 }),
      execFileAsync('git', ['log', '-1', '--pretty=%s'], { cwd: PROJECT_ROOT, timeout: 2500 }),
      execFileAsync('git', ['status', '--porcelain'], { cwd: PROJECT_ROOT, timeout: 2500 }),
      execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd: PROJECT_ROOT, timeout: 2500 }).catch(() => ({ stdout: '' })),
    ]);

    const headCommit = headOut.stdout.trim();
    const dirtyFiles = statusOut.stdout
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter(Boolean);

    return {
      hasGit: true,
      branch: branchOut.stdout.trim(),
      headCommit,
      headShort: headCommit.slice(0, 8),
      headSubject: subjOut.stdout.trim(),
      dirtyFiles,
      remoteOrigin: remoteOut.stdout.trim() || null,
      error: null,
    };
  } catch (err) {
    return {
      hasGit: true,
      branch: null,
      headCommit: null,
      headShort: null,
      headSubject: null,
      dirtyFiles: [],
      remoteOrigin: null,
      error: err instanceof Error ? err.message : 'Git status error',
    };
  }
}

async function getGitHubRemoteRefs(): Promise<{
  reachable: boolean;
  repoUrl: string;
  branches: Record<string, { commit: string; short: string }>;
  error: string | null;
}> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-remote', '--heads', GITHUB_GIT_URL],
      { timeout: 4500 }
    );
    const branches: Record<string, { commit: string; short: string }> = {};
    for (const line of stdout.split(/\r?\n/)) {
      const match = /^([0-9a-f]{40})\s+refs\/heads\/(.+)$/i.exec(line.trim());
      if (match) {
        branches[match[2]] = {
          commit: match[1],
          short: match[1].slice(0, 8),
        };
      }
    }
    return {
      reachable: Object.keys(branches).length > 0,
      repoUrl: GITHUB_URL,
      branches,
      error: null,
    };
  } catch (err) {
    return {
      reachable: false,
      repoUrl: GITHUB_URL,
      branches: {},
      error: err instanceof Error ? err.message : 'GitHub niet bereikbaar',
    };
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', (req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/intelliide/status', async (_req: Request, res: Response) => {
    const status = await getIntelliIDEStatus();
    res.json(status);
  });

  app.post('/api/intelliide/start', async (_req: Request, res: Response) => {
    const current = await getIntelliIDEStatus();
    if (current.running) {
      res.json({
        started: false,
        alreadyRunning: true,
        message: 'IntelliIDE is al actief op deze host.',
        status: current,
      });
      return;
    }

    if (!current.executablePath) {
      res.json({
        started: false,
        alreadyRunning: false,
        cloudContainer: current.cloudContainer,
        message: current.cloudContainer
          ? 'Deze server draait in de Google AI Studio cloud-container (geen lokaal desktop IntelliJ-binaire bestand aanwezig). Start de app lokaal op je pc om IntelliIDE automatisch te starten, of open via de jetbrains:// link.'
          : 'Geen lokale IntelliJ IDEA executable gevonden in PATH of standaard JetBrains-mappen.',
        status: current,
      });
      return;
    }

    try {
      const child = spawn(current.executablePath, [PROJECT_ROOT], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      await new Promise((r) => setTimeout(r, 1100));
      const updated = await getIntelliIDEStatus();
      res.json({
        started: true,
        alreadyRunning: false,
        message: `IntelliJ IDEA lokaal gestart (${current.executablePath}).`,
        status: updated,
      });
    } catch (err) {
      res.status(500).json({
        started: false,
        alreadyRunning: false,
        message: err instanceof Error ? err.message : 'Kon IntelliJ IDEA niet starten.',
        status: current,
      });
    }
  });

  app.get('/api/intelliide/files', (_req: Request, res: Response) => {
    const tree = buildWorkspaceTree(PROJECT_ROOT);
    res.json({
      projectRoot: PROJECT_ROOT,
      tree,
    });
  });

  app.get('/api/intelliide/file', (req: Request, res: Response) => {
    const rel = String(req.query.path || '');
    if (!rel || rel.includes('..') || path.isAbsolute(rel)) {
      res.status(400).json({ error: 'Ongeldig bestandspad' });
      return;
    }
    const target = path.resolve(PROJECT_ROOT, rel);
    if (!target.startsWith(path.resolve(PROJECT_ROOT))) {
      res.status(403).json({ error: 'Toegang geweigerd' });
      return;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.status(404).json({ error: 'Bestand niet gevonden' });
      return;
    }
    const stat = fs.statSync(target);
    if (stat.size > 512 * 1024) {
      res.json({
        path: rel,
        size: stat.size,
        truncated: true,
        content: fs.readFileSync(target, 'utf8').slice(0, 64000),
      });
      return;
    }
    res.json({
      path: rel,
      size: stat.size,
      truncated: false,
      content: fs.readFileSync(target, 'utf8'),
    });
  });

  app.get('/api/sync/status', async (_req: Request, res: Response) => {
    const [gitLocal, githubRemote] = await Promise.all([
      getGitLocalStatus(),
      getGitHubRemoteRefs(),
    ]);
    const bundle = computeSourceBundleFingerprint();
    let appVersion = '0.0.0';
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')) as {
        version?: string;
      };
      if (pkg.version) appVersion = pkg.version;
    } catch {
      // Ignore
    }

    res.json({
      environment: isCloudContainerEnv() ? 'aistudio-cloud' : 'host-pc',
      hostname: os.hostname(),
      platform: `${process.platform}/${process.arch}`,
      nodeVersion: process.version,
      projectRoot: PROJECT_ROOT,
      appVersion,
      bundleHash: bundle.bundleHash,
      files: bundle.files,
      gitLocal,
      githubRemote,
      checkedAt: new Date().toISOString(),
    });
  });

  app.post('/api/sync/action', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      action?: 'fetch' | 'pull' | 'push' | 'checkout';
      branch?: string;
      message?: string;
    };
    const action = body.action;
    const branch = (body.branch || DEFAULT_BRANCH).replace(/[^a-zA-Z0-9._/-]/g, '');
    if (!action || !['fetch', 'pull', 'push', 'checkout'].includes(action)) {
      res.status(400).json({ ok: false, message: 'Onbekende sync-actie.' });
      return;
    }

    const gitDir = path.join(PROJECT_ROOT, '.git');
    if (!fs.existsSync(gitDir)) {
      res.json({
        ok: false,
        requiresHostGit: true,
        message:
          'Geen .git-repository aanwezig in deze container (AI Studio). Voer Git pull/push uit op je Host PC of gebruik het gegenereerde Host Sync script.',
      });
      return;
    }

    try {
      let output = '';
      if (action === 'fetch') {
        const r = await execFileAsync('git', ['fetch', '--all', '--prune'], {
          cwd: PROJECT_ROOT,
          timeout: 15000,
        });
        output = (r.stdout + '\n' + r.stderr).trim() || 'Fetch voltooid.';
      } else if (action === 'checkout') {
        const r = await execFileAsync('git', ['checkout', branch], {
          cwd: PROJECT_ROOT,
          timeout: 8000,
        });
        output = (r.stdout + '\n' + r.stderr).trim() || `Switched to ${branch}`;
      } else if (action === 'pull') {
        const r = await execFileAsync('git', ['pull', '--rebase', 'origin', branch], {
          cwd: PROJECT_ROOT,
          timeout: 20000,
        });
        output = (r.stdout + '\n' + r.stderr).trim() || `Pull van origin/${branch} voltooid.`;
      } else if (action === 'push') {
        const st = await execFileAsync('git', ['status', '--porcelain'], {
          cwd: PROJECT_ROOT,
          timeout: 4000,
        });
        if (st.stdout.trim()) {
          await execFileAsync('git', ['add', '-A'], { cwd: PROJECT_ROOT, timeout: 6000 });
          const commitMsg = (body.message || `Sync SiliciumKern ${new Date().toISOString()}`).slice(0, 120);
          await execFileAsync('git', ['commit', '-m', commitMsg], {
            cwd: PROJECT_ROOT,
            timeout: 8000,
          });
        }
        const r = await execFileAsync('git', ['push', '-u', 'origin', branch], {
          cwd: PROJECT_ROOT,
          timeout: 25000,
        });
        output = (r.stdout + '\n' + r.stderr).trim() || `Push naar origin/${branch} voltooid.`;
      }

      const [gitLocal, githubRemote] = await Promise.all([
        getGitLocalStatus(),
        getGitHubRemoteRefs(),
      ]);
      res.json({
        ok: true,
        message: output,
        gitLocal,
        githubRemote,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: err instanceof Error ? err.message : 'Git actie mislukt.',
      });
    }
  });

  app.get('/api/sync/script', (req: Request, res: Response) => {
    const kind = String(req.query.os || 'ps1');
    const branch = String(req.query.branch || DEFAULT_BRANCH).replace(/[^a-zA-Z0-9._/-]/g, '');

    if (kind === 'sh') {
      const sh = [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        `BRANCH="${branch}"`,
        `REPO="${GITHUB_GIT_URL}"`,
        'echo "[SiliciumKern Sync] Fetch & rebase vanaf GitHub ($BRANCH)..."',
        'git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REPO"',
        'git fetch origin',
        'if ! git diff --quiet || ! git diff --cached --quiet; then',
        '  git add -A',
        '  git commit -m "Host PC sync $(date -u +%Y-%m-%dT%H:%M:%SZ)"',
        'fi',
        'git pull --rebase origin "$BRANCH"',
        'git push -u origin "$BRANCH"',
        'echo "[SiliciumKern Sync] Commit $(git rev-parse --short HEAD) gelijk met GitHub ($BRANCH)."',
        'if command -v idea >/dev/null 2>&1 && ! pgrep -f "intellij|idea" >/dev/null 2>&1; then',
        '  nohup idea . >/dev/null 2>&1 &',
        'fi',
        'echo "[SiliciumKern Sync] Check server: http://localhost:3000/api/sync/status"',
      ].join('\n');
      res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sync-siliciumkern.sh"');
      res.send(sh);
      return;
    }

    const ps1 = [
      `$Branch = "${branch}"`,
      `$Repo = "${GITHUB_GIT_URL}"`,
      'Write-Host "[SiliciumKern Sync] Fetch & rebase vanaf GitHub ($Branch)..." -ForegroundColor Cyan',
      '$origin = git remote get-url origin 2>$null',
      'if (-not $origin) { git remote add origin $Repo }',
      'git fetch origin',
      '$dirty = git status --porcelain',
      'if ($dirty) {',
      '  git add -A',
      '  git commit -m ("Host PC sync " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))',
      '}',
      'git pull --rebase origin $Branch',
      'git push -u origin $Branch',
      '$head = git rev-parse --short HEAD',
      'Write-Host "[SiliciumKern Sync] Commit $head gelijk met GitHub ($Branch)." -ForegroundColor Green',
      '$ideaRunning = Get-Process -Name "idea64","idea" -ErrorAction SilentlyContinue',
      'if (-not $ideaRunning) {',
      '  $ideaCmd = Get-Command "idea64.exe","idea.cmd","idea" -ErrorAction SilentlyContinue | Select-Object -First 1',
      '  if ($ideaCmd) { Start-Process $ideaCmd.Source -ArgumentList "." }',
      '}',
      'Write-Host "[SiliciumKern Sync] Lokale server: http://localhost:3000" -ForegroundColor Yellow',
    ].join('\r\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sync-siliciumkern.ps1"');
    res.send(ps1);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(PROJECT_ROOT, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SiliciumKern server actief op http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
