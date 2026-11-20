import type { BitWidth } from './machineVm';

export type CycleBudget = 24 | 36 | 48;
export type PopSizeOption = 32 | 64 | 128 | 256;

export interface DetectedHardware {
  arch: string;
  bitness: 32 | 64;
  logicalCores: number;
  deviceMemoryGb: number | null;
  hasWasmSimd: boolean;
  hasSharedMemory: boolean;
  hasGpuCompute: boolean;
  gpuName: string | null;
  gpuBackend: 'WebGPU' | 'WebGL2' | 'WebGL' | 'Geen';
  maxTextureSize: number | null;
  cameraCount: number;
  micCount: number;
  gamepadCount: number;
  hasPointerOrKeyboard: boolean;
  capabilityMask: number;
  recommendedBitWidth: BitWidth;
  recommendedPopSize: PopSizeOption;
  recommendedDualCore: boolean;
  recommendedCycles: CycleBudget;
  recommendedWorkerCount: number; // Aantal Web Workers voor parallelle evolutie (alle beschikbare threads)
  summaryLine: string;
  peripheralsLine: string;
}

export interface LivePeripheralFrame {
  streamA: number; // Primary signal: Camera luma, Pointer X delta, or Gamepad axis 0
  streamB: number; // Motion / Secondary: Camera motion, Pointer Y delta, or Gamepad axis 1
  inputWord: number; // Keyboard scancode, mouse buttons, gamepad buttons, or camera LR-contrast
  capabilityMask: number;
  cameraActive: boolean;
  cameraGrid: number[] | null; // Optional 8x8 grayscale luminance (0..255) for canvas preview
}

interface NavigatorUADataExtended {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
    platform?: string;
  }>;
}

interface NavigatorHardwareExtended {
  userAgentData?: NavigatorUADataExtended;
  deviceMemory?: number;
  gpu?: {
    requestAdapter: () => Promise<{
      info?: {
        vendor?: string;
        architecture?: string;
        device?: string;
        description?: string;
      };
    } | null>;
  };
}

// Valid 39-byte WASM module containing `v128.const 0; drop; end` to probe real 128-bit SIMD support
const WASM_SIMD_PROBE_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
  0x03, 0x02, 0x01, 0x00,
  0x0a, 0x17, 0x01, 0x15, 0x00,
  0xfd, 0x0c,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x1a, 0x0b,
]);

export function checkWasmSimdSupport(): boolean {
  try {
    if (typeof WebAssembly === 'undefined' || typeof WebAssembly.validate !== 'function') {
      return false;
    }
    return WebAssembly.validate(WASM_SIMD_PROBE_BYTES);
  } catch {
    return false;
  }
}

function inferArchFromUa(): { arch: string; bitness: 32 | 64 } {
  if (typeof navigator === 'undefined') {
    return { arch: 'x86-64', bitness: 64 };
  }
  const ua = `${navigator.userAgent || ''} ${navigator.platform || ''}`.toLowerCase();
  const has64 =
    typeof BigInt64Array !== 'undefined' &&
    (/x86_64|x64|win64|wow64|amd64|arm64|aarch64|macintel|apple/.test(ua) ||
      !/i686|i386|armv7/.test(ua));

  if (/arm64|aarch64|apple/.test(ua) && !/x86_64|intel/.test(ua)) {
    return { arch: 'arm64', bitness: 64 };
  }
  if (/arm/.test(ua)) {
    return { arch: has64 ? 'arm64' : 'arm', bitness: has64 ? 64 : 32 };
  }
  if (/x86_64|x64|win64|amd64|macintel/.test(ua)) {
    return { arch: 'x86-64', bitness: 64 };
  }
  if (/i686|i386|x86/.test(ua)) {
    return { arch: 'x86', bitness: 32 };
  }
  return { arch: has64 ? '64-bit CPU' : '32-bit CPU', bitness: has64 ? 64 : 32 };
}

function probeWebGlGpu(): {
  hasWebGl: boolean;
  backend: 'WebGL2' | 'WebGL' | 'Geen';
  rendererName: string | null;
  maxTextureSize: number | null;
} {
  if (typeof document === 'undefined') {
    return { hasWebGl: false, backend: 'Geen', rendererName: null, maxTextureSize: null };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const gl = gl2 || (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) {
      return { hasWebGl: false, backend: 'Geen', rendererName: null, maxTextureSize: null };
    }
    const backend: 'WebGL2' | 'WebGL' = gl2 ? 'WebGL2' : 'WebGL';
    const maxTex = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || null;
    let rendererName: string | null = null;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const rawRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').trim();
      const rawVendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '').trim();
      const cleaned = rawRenderer
        .replace(/^ANGLE \((.*)\)$/i, '$1')
        .replace(/Direct3D\d+ vs_\d+_\d+ ps_\d+_\d+,?\s*/i, '')
        .trim();
      rendererName = cleaned || rawVendor || null;
    }
    if (!rendererName) {
      const fallback = String(gl.getParameter(gl.RENDERER) || '').trim();
      rendererName = fallback || `${backend} GPU`;
    }
    return {
      hasWebGl: true,
      backend,
      rendererName,
      maxTextureSize: maxTex,
    };
  } catch {
    return { hasWebGl: false, backend: 'Geen', rendererName: null, maxTextureSize: null };
  }
}

function countConnectedGamepads(): number {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return 0;
    }
    const pads = navigator.getGamepads();
    let count = 0;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i]?.connected) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

export function computeHardwareCapabilityMask(params: {
  bitness: 32 | 64;
  hasWasmSimd: boolean;
  hasGpuCompute: boolean;
  recommendedDualCore: boolean;
  cameraCount: number;
  micCount: number;
  gamepadCount: number;
  hasPointerOrKeyboard: boolean;
}): number {
  let mask = 0;
  if (params.bitness === 64) mask |= 1 << 0;
  if (params.hasWasmSimd) mask |= 1 << 1;
  if (params.hasGpuCompute) mask |= 1 << 2;
  if (params.recommendedDualCore) mask |= 1 << 3;
  if (params.cameraCount > 0) mask |= 1 << 4;
  if (params.micCount > 0) mask |= 1 << 5;
  if (params.gamepadCount > 0) mask |= 1 << 6;
  if (params.hasPointerOrKeyboard) mask |= 1 << 7;
  return mask;
}

function computeRecommendations(params: {
  bitness: 32 | 64;
  logicalCores: number;
  deviceMemoryGb: number | null;
  hasWasmSimd: boolean;
  hasGpuCompute: boolean;
}): {
  recommendedBitWidth: BitWidth;
  recommendedPopSize: PopSizeOption;
  recommendedDualCore: boolean;
  recommendedCycles: CycleBudget;
  recommendedWorkerCount: number;
} {
  const { bitness, logicalCores, deviceMemoryGb, hasWasmSimd, hasGpuCompute } = params;

  const recommendedBitWidth: BitWidth =
    hasWasmSimd && bitness === 64 ? 128 : bitness === 64 ? 64 : 32;

  let recommendedPopSize: PopSizeOption = 64;
  if (logicalCores >= 12 && (deviceMemoryGb === null || deviceMemoryGb >= 8)) {
    recommendedPopSize = 256;
  } else if (logicalCores >= 6 && (deviceMemoryGb === null || deviceMemoryGb >= 4)) {
    recommendedPopSize = 128;
  } else if (logicalCores <= 2) {
    recommendedPopSize = 32;
  }

  const recommendedDualCore = logicalCores >= 4;

  let recommendedCycles: CycleBudget = 24;
  if (hasWasmSimd && (logicalCores >= 8 || hasGpuCompute)) {
    recommendedCycles = 48;
  } else if (hasWasmSimd || logicalCores >= 4) {
    recommendedCycles = 36;
  }

  // Parallelle evolutie: gebruik alle beschikbare threads
  const recommendedWorkerCount = Math.max(1, logicalCores);

  return {
    recommendedBitWidth,
    recommendedPopSize,
    recommendedDualCore,
    recommendedCycles,
    recommendedWorkerCount,
  };
}

function buildPeripheralsSummary(params: {
  gpuName: string | null;
  gpuBackend: string;
  cameraCount: number;
  micCount: number;
  gamepadCount: number;
  hasPointerOrKeyboard: boolean;
}): string {
  const parts: string[] = [];
  if (params.gpuName) {
    parts.push(`GPU: ${params.gpuName}`);
  } else if (params.gpuBackend !== 'Geen') {
    parts.push(`GPU: ${params.gpuBackend}`);
  }
  parts.push(`Cam: ${params.cameraCount}`);
  if (params.micCount > 0) parts.push(`Mic: ${params.micCount}`);
  if (params.gamepadCount > 0) parts.push(`Pad: ${params.gamepadCount}`);
  if (params.hasPointerOrKeyboard) parts.push('HID: Toets/Muis');
  return parts.join(' · ');
}

export function detectHardwareSync(): DetectedHardware {
  const nav = (typeof navigator !== 'undefined' ? navigator : {}) as Navigator &
    NavigatorHardwareExtended;
  const { arch, bitness } = inferArchFromUa();
  const logicalCores = Math.max(1, Number(nav.hardwareConcurrency) || 4);
  // navigator.deviceMemory is een browser API die vaak minder toont dan het echte RAM
  // (browsers ronden af naar 0.25, 0.5, 1, 2, 4, 8 GB en tonen max ~8GB zelfs bij meer RAM)
  // Dit is een browser-beperking, niet een bug in onze code
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const hasWasmSimd = checkWasmSimdSupport();
  const hasSharedMemory = typeof SharedArrayBuffer !== 'undefined';

  const webgl = probeWebGlGpu();
  const hasGpuCompute = Boolean(nav.gpu) || webgl.hasWebGl;
  const gpuBackend: DetectedHardware['gpuBackend'] = nav.gpu
    ? 'WebGPU'
    : webgl.backend;
  const gpuName = webgl.rendererName;
  const gamepadCount = countConnectedGamepads();
  const hasPointerOrKeyboard = typeof window !== 'undefined';

  const recs = computeRecommendations({
    bitness,
    logicalCores,
    deviceMemoryGb,
    hasWasmSimd,
    hasGpuCompute,
  });

  const capabilityMask = computeHardwareCapabilityMask({
    bitness,
    hasWasmSimd,
    hasGpuCompute,
    recommendedDualCore: recs.recommendedDualCore,
    cameraCount: 0,
    micCount: 0,
    gamepadCount,
    hasPointerOrKeyboard,
  });

  const summaryParts = [
    arch,
    `${logicalCores} threads`,
    hasWasmSimd ? '128b SIMD' : `${bitness}b scalair`,
  ];
  if (deviceMemoryGb !== null) {
    summaryParts.push(`${deviceMemoryGb} GB RAM`);
  }

  return {
    arch,
    bitness,
    logicalCores,
    deviceMemoryGb,
    hasWasmSimd,
    hasSharedMemory,
    hasGpuCompute,
    gpuName,
    gpuBackend,
    maxTextureSize: webgl.maxTextureSize,
    cameraCount: 0,
    micCount: 0,
    gamepadCount,
    hasPointerOrKeyboard,
    capabilityMask,
    ...recs,
    summaryLine: summaryParts.join(' · '),
    peripheralsLine: buildPeripheralsSummary({
      gpuName,
      gpuBackend,
      cameraCount: 0,
      micCount: 0,
      gamepadCount,
      hasPointerOrKeyboard,
    }),
  };
}

export async function detectHardwareAsync(): Promise<DetectedHardware> {
  const base = detectHardwareSync();
  const nav = (typeof navigator !== 'undefined' ? navigator : {}) as Navigator &
    NavigatorHardwareExtended;

  let arch = base.arch;
  let bitness = base.bitness;
  let hasGpuCompute = base.hasGpuCompute;
  let gpuName = base.gpuName;
  let gpuBackend = base.gpuBackend;
  let cameraCount = 0;
  let micCount = 0;

  try {
    if (nav.userAgentData?.getHighEntropyValues) {
      const vals = await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
      if (vals.architecture) {
        if (vals.architecture === 'x86' && vals.bitness === '64') arch = 'x86-64';
        else if (vals.architecture === 'arm' && vals.bitness === '64') arch = 'arm64';
        else arch = vals.architecture;
      }
      if (vals.bitness === '64') bitness = 64;
      else if (vals.bitness === '32') bitness = 32;
    }
  } catch {
    // Ignore UA client hints restrictions
  }

  try {
    if (nav.gpu?.requestAdapter) {
      const adapterPromise = nav.gpu.requestAdapter();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 600));
      const adapter = await Promise.race([adapterPromise, timeoutPromise]);
      if (adapter) {
        hasGpuCompute = true;
        gpuBackend = 'WebGPU';
        const info = adapter.info;
        const label = [info?.vendor, info?.architecture || info?.device || info?.description]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (label) gpuName = label;
      }
    }
  } catch {
    // Keep WebGL fallback intact
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameraCount = devices.filter((d) => d.kind === 'videoinput').length;
      micCount = devices.filter((d) => d.kind === 'audioinput').length;
    }
  } catch {
    // Ignore browser media enumeration blocks
  }

  const gamepadCount = countConnectedGamepads();
  const recs = computeRecommendations({
    bitness,
    logicalCores: base.logicalCores,
    deviceMemoryGb: base.deviceMemoryGb,
    hasWasmSimd: base.hasWasmSimd,
    hasGpuCompute,
  });

  const capabilityMask = computeHardwareCapabilityMask({
    bitness,
    hasWasmSimd: base.hasWasmSimd,
    hasGpuCompute,
    recommendedDualCore: recs.recommendedDualCore,
    cameraCount,
    micCount,
    gamepadCount,
    hasPointerOrKeyboard: base.hasPointerOrKeyboard,
  });

  const summaryParts = [
    arch,
    `${base.logicalCores} threads`,
    base.hasWasmSimd ? '128b SIMD' : `${bitness}b scalair`,
  ];
  if (base.deviceMemoryGb !== null) {
    summaryParts.push(`${base.deviceMemoryGb} GB RAM`);
  }

  return {
    ...base,
    arch,
    bitness,
    hasGpuCompute,
    gpuName,
    gpuBackend,
    cameraCount,
    micCount,
    gamepadCount,
    capabilityMask,
    ...recs,
    summaryLine: summaryParts.join(' · '),
    peripheralsLine: buildPeripheralsSummary({
      gpuName,
      gpuBackend,
      cameraCount,
      micCount,
      gamepadCount,
      hasPointerOrKeyboard: base.hasPointerOrKeyboard,
    }),
  };
}

export function subscribeHardwareHotplug(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleEvent = () => onChange();
  window.addEventListener('gamepadconnected', handleEvent);
  window.addEventListener('gamepaddisconnected', handleEvent);

  const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
  if (mediaDevices?.addEventListener) {
    mediaDevices.addEventListener('devicechange', handleEvent);
  }

  return () => {
    window.removeEventListener('gamepadconnected', handleEvent);
    window.removeEventListener('gamepaddisconnected', handleEvent);
    if (mediaDevices?.removeEventListener) {
      mediaDevices.removeEventListener('devicechange', handleEvent);
    }
  };
}

export interface PeripheralMonitor {
  sampleFrame: (capabilityMask: number) => LivePeripheralFrame;
  enableCamera: () => Promise<boolean>;
  disableCamera: () => void;
  isCameraActive: () => boolean;
  destroy: () => void;
}

export function createPeripheralMonitor(): PeripheralMonitor {
  let pointerX = 0;
  let pointerY = 0;
  let pointerDx = 0;
  let pointerDy = 0;
  let lastKeyCode = 0;
  let pointerButtons = 0;

  let videoEl: HTMLVideoElement | null = null;
  let sampleCanvas: HTMLCanvasElement | null = null;
  let sampleCtx: CanvasRenderingContext2D | null = null;
  let mediaStream: MediaStream | null = null;
  let prevGrid: Uint8Array | null = null;
  let cameraActive = false;

  const onPointerMove = (e: PointerEvent) => {
    pointerDx = Math.max(-127, Math.min(127, Math.round(e.clientX - pointerX)));
    pointerDy = Math.max(-127, Math.min(127, Math.round(e.clientY - pointerY)));
    pointerX = e.clientX;
    pointerY = e.clientY;
    pointerButtons = e.buttons & 0x0f;
  };

  const onPointerDown = (e: PointerEvent) => {
    pointerButtons = e.buttons & 0x0f;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    lastKeyCode = (e.keyCode || e.key.charCodeAt(0) || 0) & 0xff;
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
  }

  const disableCamera = () => {
    cameraActive = false;
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        track.stop();
      }
      mediaStream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl = null;
    }
    prevGrid = null;
  };

  const enableCamera = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    if (cameraActive && mediaStream) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 160 }, height: { ideal: 120 }, facingMode: 'user' },
        audio: false,
      });
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      mediaStream = stream;
      videoEl = video;
      sampleCanvas = canvas;
      sampleCtx = ctx;
      prevGrid = new Uint8Array(64);
      cameraActive = true;
      return true;
    } catch {
      disableCamera();
      return false;
    }
  };

  const sampleFrame = (capabilityMask: number): LivePeripheralFrame => {
    let streamA = pointerDx;
    let streamB = pointerDy;
    let inputWord = ((lastKeyCode & 0x7f) | ((pointerButtons & 0x0f) << 7)) & 0xff;
    let cameraGrid: number[] | null = null;

    // Decay pointer velocity smoothly after sampling
    pointerDx = Math.trunc(pointerDx * 0.5);
    pointerDy = Math.trunc(pointerDy * 0.5);

    // Poll first connected gamepad if present
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
          const pad = pads[i];
          if (pad && pad.connected) {
            const ax0 = Math.round((pad.axes[0] ?? 0) * 64);
            const ax1 = Math.round((pad.axes[1] ?? 0) * 64);
            if (Math.abs(ax0) > 2 || Math.abs(ax1) > 2) {
              streamA = ax0;
              streamB = ax1;
            }
            let btnMask = 0;
            for (let b = 0; b < Math.min(8, pad.buttons.length); b++) {
              if (pad.buttons[b]?.pressed) btnMask |= 1 << b;
            }
            if (btnMask !== 0) inputWord = (inputWord ^ btnMask) & 0xff;
            break;
          }
        }
      }
    } catch {
      // Ignore gamepad sandbox blocks
    }

    if (cameraActive && videoEl && sampleCtx && sampleCanvas && videoEl.readyState >= 2) {
      sampleCtx.drawImage(videoEl, 0, 0, 8, 8);
      const data = sampleCtx.getImageData(0, 0, 8, 8).data;
      const grid = new Array<number>(64);
      let lumaSum = 0;
      let motionSum = 0;
      let leftSum = 0;
      let rightSum = 0;
      for (let i = 0; i < 64; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grid[i] = luma;
        lumaSum += luma;
        if (prevGrid) {
          motionSum += Math.abs(luma - prevGrid[i]);
          prevGrid[i] = luma;
        }
        if ((i & 7) < 4) leftSum += luma;
        else rightSum += luma;
      }
      streamA = Math.round(lumaSum / 64);
      streamB = Math.min(255, Math.round(motionSum / 16));
      const lrDiff = Math.max(-127, Math.min(127, Math.round((rightSum - leftSum) / 32)));
      inputWord = (lrDiff ^ (inputWord & 0x0f)) & 0xff;
      cameraGrid = grid;
    }

    return {
      streamA,
      streamB,
      inputWord,
      capabilityMask,
      cameraActive,
      cameraGrid,
    };
  };

  const destroy = () => {
    disableCamera();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    }
  };

  return {
    sampleFrame,
    enableCamera,
    disableCamera,
    isCameraActive: () => cameraActive,
    destroy,
  };
}
