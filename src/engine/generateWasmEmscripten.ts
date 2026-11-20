import {
  decodeInstruction,
  disassembleInstruction,
  PROG_LEN,
  RAM_WORDS,
  MAX_CYCLES_PER_TICK,
  OPCODE_COUNT,
  scalarWidth,
  type BitWidth,
  type TaskId,
  TASKS,
} from './machineVm';

/**
 * Generate Emscripten-compatible C code for WebAssembly compilation.
 * The output is a single .c file that can be compiled with Emscripten:
 *
 *   emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_silicium_tick","_silicium_init","_malloc","_free"]' \
 *        -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
 *        -s MODULARIZE=1 -s EXPORT_NAME='SiliciumWasm' \
 *        silicium_wasm.c -o silicium_wasm.js
 *
 * Usage in JavaScript:
 *   const SiliciumWasm = await SiliciumWasm();
 *   const vmPtr = SiliciumWasm._malloc(SiliciumWasm.cwrap('sizeof_vm', 'number', [])());
 *   SiliciumWasm._silicium_init(vmPtr);
 *   const portsPtr = SiliciumWasm._malloc(8 * 4); // 8 x int32_t
 *   // write ports...
 *   const action = SiliciumWasm._silicium_tick(vmPtr, portsPtr);
 */
export function generateWasmCCode(
  genome: Uint8Array,
  taskId: TaskId,
  bitWidth: BitWidth = 32,
  maxCycles: number = MAX_CYCLES_PER_TICK
): string {
  const sw = scalarWidth(bitWidth);
  const cType = sw === 16 ? 'int16_t' : sw === 64 ? 'int64_t' : 'int32_t';
  const uType = sw === 16 ? 'uint16_t' : sw === 64 ? 'uint64_t' : 'uint32_t';

  const hexLines: string[] = [];
  for (let i = 0; i < PROG_LEN; i++) {
    const base = i * 4;
    const bytes = [0, 1, 2, 3]
      .map((k) => `0x${genome[base + k].toString(16).padStart(2, '0')}`)
      .join(', ');
    const asm = disassembleInstruction(decodeInstruction(genome, i));
    hexLines.push(`    ${bytes}, /* @0x${i.toString(16).padStart(2, '0')}: ${asm} */`);
  }

  return `/* SiliciumKern — WebAssembly Export (${bitWidth}-bit) via Emscripten
 * Taakprofiel: ${TASKS[taskId].name}
 * Compileer met Emscripten:
 *   emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_silicium_tick","_silicium_init","_malloc","_free"]' \\
 *        -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \\
 *        -s MODULARIZE=1 -s EXPORT_NAME='SiliciumWasm' \\
 *        silicium_wasm.c -o silicium_wasm.js
 *
 * Gebruik in JavaScript:
 *   const SiliciumWasm = await SiliciumWasm();
 *   const vmPtr = SiliciumWasm._malloc(SiliciumWasm.cwrap('sizeof_vm', 'number', [])());
 *   SiliciumWasm._silicium_init(vmPtr);
 *   const portsPtr = SiliciumWasm._malloc(8 * 4);
 *   const action = SiliciumWasm._silicium_tick(vmPtr, portsPtr);
 */
#include <stdint.h>
#include <string.h>
#include <emscripten.h>

#define PROG_LEN 32
#define RAM_WORDS 16
#define MAX_CYCLES ${maxCycles}
#define SCALAR_BITS ${sw}

typedef struct {
    ${cType} regs[8];
    int32_t xmm[4][4];
    ${cType} ram[RAM_WORDS];
    uint8_t active_code[PROG_LEN * 4];
    int32_t bus[8];
    uint8_t code_ready;
    uint8_t ip, zf, cf, sf;
    int32_t out;
} SiliciumVM;

static const uint8_t GENOME[PROG_LEN * 4] = {
${hexLines.join('\n')}
};

EMSCRIPTEN_KEEPALIVE
void silicium_init(SiliciumVM *vm) {
    memset(vm, 0, sizeof(SiliciumVM));
    memcpy(vm->active_code, GENOME, sizeof(GENOME));
    vm->code_ready = 1;
}

EMSCRIPTEN_KEEPALIVE
size_t sizeof_vm(void) {
    return sizeof(SiliciumVM);
}

EMSCRIPTEN_KEEPALIVE
int32_t silicium_tick(SiliciumVM *vm, const int32_t ports[8]) {
    if (!vm->code_ready) silicium_init(vm);
    vm->ip = 0;
    for (int cycle = 0; cycle < MAX_CYCLES; cycle++) {
        uint8_t idx = vm->ip % PROG_LEN;
        uint8_t op  = vm->active_code[idx * 4 + 0] % ${OPCODE_COUNT};
        uint8_t dst = vm->active_code[idx * 4 + 1] & 7;
        uint8_t src = vm->active_code[idx * 4 + 2] & 7;
        int8_t  imm = (int8_t)vm->active_code[idx * 4 + 3];
        uint8_t jumped = 0;

        switch (op) {
            case 0x00: break;
            case 0x01: vm->regs[dst] = (${cType})imm; break;
            case 0x02: vm->regs[dst] = vm->regs[src]; break;
            case 0x03: { ${cType} t = vm->regs[dst]; vm->regs[dst] = vm->regs[src]; vm->regs[src] = t; break; }
            case 0x04: vm->regs[dst] += vm->regs[src]; break;
            case 0x05: vm->regs[dst] += (${cType})imm; break;
            case 0x06: vm->regs[dst] -= vm->regs[src]; break;
            case 0x07: vm->regs[dst] *= vm->regs[src]; break;
            case 0x08: if (vm->regs[src] != 0) vm->regs[dst] /= vm->regs[src]; break;
            case 0x09: if (vm->regs[src] != 0) vm->regs[dst] %= vm->regs[src]; break;
            case 0x0A: vm->regs[dst] = -vm->regs[dst]; break;
            case 0x0B: if (vm->regs[dst] < 0) vm->regs[dst] = -vm->regs[dst]; break;
            case 0x0C: vm->regs[dst] += 1; break;
            case 0x0D: vm->regs[dst] -= 1; break;
            case 0x0E: vm->regs[dst] &= vm->regs[src]; break;
            case 0x0F: vm->regs[dst] |= vm->regs[src]; break;
            case 0x10: vm->regs[dst] ^= vm->regs[src]; break;
            case 0x11: vm->regs[dst] = ~vm->regs[dst]; break;
            case 0x12: vm->regs[dst] <<= (imm & 7); break;
            case 0x13: vm->regs[dst] >>= (imm & 7); break;
            case 0x14: {
                ${uType} u = (${uType})vm->regs[dst];
                uint8_t sh = (uint8_t)(imm & 7);
                vm->regs[dst] = (${cType})((u << sh) | (u >> (SCALAR_BITS - sh)));
                break;
            }
            case 0x15: {
                ${uType} u = (${uType})vm->regs[dst];
                uint8_t sh = (uint8_t)(imm & 7);
                vm->regs[dst] = (${cType})((u >> sh) | (u << (SCALAR_BITS - sh)));
                break;
            }
            case 0x16: {
                ${uType} v = (${uType})vm->regs[src];
                ${cType} c = 0;
                while (v) { c += (v & 1u); v >>= 1; }
                vm->regs[dst] = c;
                break;
            }
            case 0x17: {
                ${uType} v = (${uType})vm->regs[dst], out = 0;
                for (int i = 0; i < (SCALAR_BITS / 8); i++) { out = (out << 8) | (v & 0xFFu); v >>= 8; }
                vm->regs[dst] = (${cType})out;
                break;
            }
            case 0x18:
                vm->zf = (vm->regs[dst] == vm->regs[src]);
                vm->cf = (vm->regs[dst] <  vm->regs[src]);
                vm->sf = (vm->regs[dst] <  vm->regs[src]);
                break;
            case 0x19: {
                ${cType} m = (vm->regs[dst] & vm->regs[src]);
                vm->zf = (m == 0);
                vm->cf = 0;
                vm->sf = (m < 0);
                break;
            }
            case 0x1A: vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; break;
            case 0x1B: if (vm->zf)             { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1C: if (!vm->zf)            { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1D: if (vm->cf || vm->sf)   { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1E: vm->regs[dst] = vm->ram[vm->regs[src] & (RAM_WORDS - 1)]; break;
            case 0x1F: vm->ram[vm->regs[dst] & (RAM_WORDS - 1)] = vm->regs[src]; break;
            case 0x20: if (vm->cf || vm->sf) vm->regs[dst] = vm->regs[src]; break;
            case 0x21: {
                int base = (int)(vm->regs[src] & (RAM_WORDS - 1));
                for (int l = 0; l < 4; l++) vm->xmm[dst & 3][l] = (int32_t)vm->ram[(base + l) & (RAM_WORDS - 1)];
                break;
            }
            case 0x22: {
                int base = (int)(vm->regs[dst] & (RAM_WORDS - 1));
                for (int l = 0; l < 4; l++) vm->ram[(base + l) & (RAM_WORDS - 1)] = (${cType})vm->xmm[src & 3][l];
                break;
            }
            case 0x23: for (int l = 0; l < 4; l++) vm->xmm[dst & 3][l] += vm->xmm[src & 3][l]; break;
            case 0x24: for (int l = 0; l < 4; l++) vm->xmm[dst & 3][l] ^= vm->xmm[src & 3][l]; break;
            case 0x25: {
                ${cType} s = 0;
                for (int l = 0; l < 4; l++) s += (${cType})vm->xmm[src & 3][l];
                vm->regs[dst] = s;
                break;
            }
            case 0x26: vm->regs[dst] = (${cType})ports[src & 7]; break;
            case 0x27: vm->out = (int32_t)vm->regs[src]; return vm->out;
            case 0x28: {
                uint8_t p = (uint8_t)(vm->regs[src] & (PROG_LEN - 1));
                uint32_t w = (uint32_t)vm->active_code[p*4] | ((uint32_t)vm->active_code[p*4+1]<<8) | ((uint32_t)vm->active_code[p*4+2]<<16) | ((uint32_t)vm->active_code[p*4+3]<<24);
                vm->regs[dst] = (${cType})((int32_t)w);
                break;
            }
            case 0x29: {
                uint8_t p = (uint8_t)(vm->regs[dst] & (PROG_LEN - 1));
                uint32_t w = (uint32_t)((int32_t)vm->regs[src]);
                vm->active_code[p*4 + 0] = (uint8_t)((w & 0xFFu) % ${OPCODE_COUNT});
                vm->active_code[p*4 + 1] = (uint8_t)(((w >> 8) & 0xFFu) & 7u);
                vm->active_code[p*4 + 2] = (uint8_t)(((w >> 16) & 0xFFu) & 7u);
                vm->active_code[p*4 + 3] = (uint8_t)((w >> 24) & 0xFFu);
                break;
            }
            case 0x2A: vm->bus[vm->regs[dst] & 7] = (int32_t)vm->regs[src]; break;
            case 0x2B: vm->regs[dst] = (${cType})vm->bus[vm->regs[src] & 7]; break;
        }
        if (!jumped) vm->ip = (idx + 1) % PROG_LEN;
    }
    return (int32_t)vm->regs[0];
}

/* Helper: write ports from JS array to C memory */
EMSCRIPTEN_KEEPALIVE
void write_ports(int32_t *ptr, const int32_t *ports, int count) {
    for (int i = 0; i < count && i < 8; i++) ptr[i] = ports[i];
}

/* Helper: read register value */
EMSCRIPTEN_KEEPALIVE
int32_t read_reg(SiliciumVM *vm, int idx) {
    if (idx >= 0 && idx < 8) return (int32_t)vm->regs[idx];
    return 0;
}

/* Helper: read flag state */
EMSCRIPTEN_KEEPALIVE
int read_flags(SiliciumVM *vm) {
    return (vm->zf ? 1 : 0) | (vm->cf ? 2 : 0) | (vm->sf ? 4 : 0);
}
`;
}

/**
 * Generate the Emscripten compile command as a shell script.
 */
export function generateWasmBuildScript(
  bitWidth: BitWidth = 32
): string {
  return `#!/bin/bash
# SiliciumKern WebAssembly Build Script
# Requires Emscripten SDK: https://emscripten.org/docs/getting_started/downloads.html
#
# Usage:
#   ./build_wasm.sh [output_dir]
#
# Output:
#   silicium_wasm.js  - JavaScript glue code
#   silicium_wasm.wasm - WebAssembly binary
#   silicium_wasm.html - Standalone HTML demo

OUTPUT_DIR="\${1:-.}"

emcc -O3 \\\\
     -s WASM=1 \\\\
     -s EXPORTED_FUNCTIONS='["_silicium_tick","_silicium_init","_sizeof_vm","_write_ports","_read_reg","_read_flags","_malloc","_free"]' \\\\
     -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","setValue"]' \\\\
     -s MODULARIZE=1 \\\\
     -s EXPORT_NAME='SiliciumWasm' \\\\
     -s ALLOW_MEMORY_GROWTH=1 \\\\
     -o "\${OUTPUT_DIR}/silicium_wasm.js" \\\\
     silicium_wasm.c

echo "Build complete: \${OUTPUT_DIR}/silicium_wasm.js + silicium_wasm.wasm"
echo ""
echo "Usage in JavaScript:"
echo "  const SiliciumWasm = await SiliciumWasm();"
echo "  const vmPtr = SiliciumWasm._malloc(SiliciumWasm._sizeof_vm());"
echo "  SiliciumWasm._silicium_init(vmPtr);"
echo "  const action = SiliciumWasm._silicium_tick(vmPtr, portsPtr);"
`;
}

/**
 * Generate a JavaScript wrapper for the compiled WASM module.
 * This provides a clean API for using the WASM module in the browser or Node.js.
 */
export function generateWasmWrapperJS(): string {
  return `/**
 * SiliciumKern WebAssembly Runtime Wrapper
 * 
 * Usage:
 *   const vm = new SiliciumWasmVM();
 *   await vm.load('silicium_wasm.js');
 *   vm.init(genomeBytes);
 *   const action = vm.tick([64, 48, 70, 9, 8, 1, 0, 1]);
 *   console.log('Action:', action);
 *   console.log('Registers:', vm.getRegisters());
 *   console.log('Flags:', vm.getFlags());
 */

class SiliciumWasmVM {
  constructor() {
    this.module = null;
    this.vmPtr = null;
    this.portsPtr = null;
  }

  async load(modulePath = 'silicium_wasm.js') {
    // Dynamic import of the Emscripten module
    const ModuleFactory = await import(modulePath);
    this.module = await ModuleFactory.default();
    return this;
  }

  init() {
    const size = this.module._sizeof_vm();
    this.vmPtr = this.module._malloc(size);
    this.portsPtr = this.module._malloc(8 * 4); // 8 x int32_t
    this.module._silicium_init(this.vmPtr);
    return this;
  }

  tick(ports) {
    // Write ports to WASM memory
    for (let i = 0; i < 8 && i < ports.length; i++) {
      this.module.setValue(this.portsPtr + i * 4, ports[i], 'i32');
    }
    const action = this.module._silicium_tick(this.vmPtr, this.portsPtr);
    return action;
  }

  getRegisters() {
    const regs = [];
    for (let i = 0; i < 8; i++) {
      regs.push(this.module._read_reg(this.vmPtr, i));
    }
    return regs;
  }

  getFlags() {
    const flags = this.module._read_flags(this.vmPtr);
    return {
      zf: (flags & 1) !== 0,
      cf: (flags & 2) !== 0,
      sf: (flags & 4) !== 0,
    };
  }

  dispose() {
    if (this.portsPtr) {
      this.module._free(this.portsPtr);
      this.portsPtr = null;
    }
    if (this.vmPtr) {
      this.module._free(this.vmPtr);
      this.vmPtr = null;
    }
  }
}

export default SiliciumWasmVM;
`;
}
