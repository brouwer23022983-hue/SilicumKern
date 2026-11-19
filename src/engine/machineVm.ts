export const PROG_LEN = 32; // 32 instructions * 4 bytes = 128 bytes
export const RAM_WORDS = 16; // 16 * 8 bytes = 128 bytes L1 scratchpad RAM
export const REG_COUNT = 8; // R0..R7
export const XMM_COUNT = 4; // XMM0..XMM3 (4 x 32-bit lanes = 128-bit SIMD each)
export const MAX_CYCLES_PER_TICK = 24;

export type BitWidth = 16 | 32 | 64 | 128;

export enum Opcode {
  NOP = 0x00,
  MOVI = 0x01,
  MOV = 0x02,
  SWAP = 0x03,
  ADD = 0x04,
  ADDI = 0x05,
  SUB = 0x06,
  MUL = 0x07,
  DIV = 0x08,
  MOD = 0x09,
  NEG = 0x0a,
  ABS = 0x0b,
  INC = 0x0c,
  DEC = 0x0d,
  AND = 0x0e,
  OR = 0x0f,
  XOR = 0x10,
  NOT = 0x11,
  SHL = 0x12,
  SHR = 0x13,
  ROL = 0x14,
  ROR = 0x15,
  POPCNT = 0x16,
  BSWAP = 0x17,
  CMP = 0x18,
  TEST = 0x19,
  JMP = 0x1a,
  JZ = 0x1b,
  JNZ = 0x1c,
  JLT = 0x1d,
  LOAD = 0x1e,
  STORE = 0x1f,
  CMOVLT = 0x20,
  VLOAD = 0x21,
  VSTORE = 0x22,
  VADD = 0x23,
  VXOR = 0x24,
  VSUM = 0x25,
  SENSE = 0x26,
  ACT = 0x27,
  PREAD = 0x28,
  PWRITE = 0x29,
  BWRITE = 0x2a,
  BREAD = 0x2b,
}

export const OPCODE_COUNT = 44;

export type OpcodeCategory = 'data' | 'alu' | 'bit' | 'flow' | 'mem' | 'simd' | 'io' | 'smc';

export interface OpcodeMeta {
  code: Opcode;
  mnemonic: string;
  category: OpcodeCategory;
  syntax: string;
  description: string;
}

export const OPCODE_TABLE: OpcodeMeta[] = [
  { code: Opcode.NOP, mnemonic: 'NOP', category: 'flow', syntax: 'NOP', description: 'Geen bewerking (1 CPU-cyclus rust).' },
  { code: Opcode.MOVI, mnemonic: 'MOVI', category: 'data', syntax: 'MOVI Rd, #imm', description: 'Laad constante (-128..127) sign-extended in register Rd.' },
  { code: Opcode.MOV, mnemonic: 'MOV', category: 'data', syntax: 'MOV Rd, Rs', description: 'Kopieer waarde van Rs naar Rd op actieve bitbreedte.' },
  { code: Opcode.SWAP, mnemonic: 'SWAP', category: 'data', syntax: 'SWAP Rd, Rs', description: 'Wissel inhoud van Rd en Rs direct om (XCHG).' },
  { code: Opcode.ADD, mnemonic: 'ADD', category: 'alu', syntax: 'ADD Rd, Rs', description: 'Tel Rs op bij Rd met hardware wrap-around (16/32/64-bit).' },
  { code: Opcode.ADDI, mnemonic: 'ADDI', category: 'alu', syntax: 'ADDI Rd, #imm', description: 'Tel directe constante #imm op bij Rd.' },
  { code: Opcode.SUB, mnemonic: 'SUB', category: 'alu', syntax: 'SUB Rd, Rs', description: 'Trek Rs af van Rd.' },
  { code: Opcode.MUL, mnemonic: 'MUL', category: 'alu', syntax: 'MUL Rd, Rs', description: 'Signed integer vermenigvuldiging (IMUL).' },
  { code: Opcode.DIV, mnemonic: 'DIV', category: 'alu', syntax: 'DIV Rd, Rs', description: 'Veilige deling (IDIV); bij deler 0 blijft Rd ongewijzigd.' },
  { code: Opcode.MOD, mnemonic: 'MOD', category: 'alu', syntax: 'MOD Rd, Rs', description: 'Modulo-restwaarde van Rd / Rs.' },
  { code: Opcode.NEG, mnemonic: 'NEG', category: 'alu', syntax: 'NEG Rd', description: 'Twee-complement tekenomkering (-Rd).' },
  { code: Opcode.ABS, mnemonic: 'ABS', category: 'alu', syntax: 'ABS Rd', description: 'Absolute waarde van Rd zonder branch.' },
  { code: Opcode.INC, mnemonic: 'INC', category: 'alu', syntax: 'INC Rd', description: 'Verhoog register Rd met 1.' },
  { code: Opcode.DEC, mnemonic: 'DEC', category: 'alu', syntax: 'DEC Rd', description: 'Verlaag register Rd met 1.' },
  { code: Opcode.AND, mnemonic: 'AND', category: 'bit', syntax: 'AND Rd, Rs', description: 'Bitwise AND tussen Rd en Rs.' },
  { code: Opcode.OR, mnemonic: 'OR', category: 'bit', syntax: 'OR Rd, Rs', description: 'Bitwise OR tussen Rd en Rs.' },
  { code: Opcode.XOR, mnemonic: 'XOR', category: 'bit', syntax: 'XOR Rd, Rs', description: 'Bitwise exclusieve OR tussen Rd en Rs.' },
  { code: Opcode.NOT, mnemonic: 'NOT', category: 'bit', syntax: 'NOT Rd', description: 'Inverteer alle bits van Rd (~Rd).' },
  { code: Opcode.SHL, mnemonic: 'SHL', category: 'bit', syntax: 'SHL Rd, #n', description: 'Schuif bits naar links (0..7 posities).' },
  { code: Opcode.SHR, mnemonic: 'SHR', category: 'bit', syntax: 'SHR Rd, #n', description: 'Rekenkundige bit-shift naar rechts (0..7 posities).' },
  { code: Opcode.ROL, mnemonic: 'ROL', category: 'bit', syntax: 'ROL Rd, #n', description: 'Circulaire bit-rotatie naar links over 16/32/64 bits.' },
  { code: Opcode.ROR, mnemonic: 'ROR', category: 'bit', syntax: 'ROR Rd, #n', description: 'Circulaire bit-rotatie naar rechts over 16/32/64 bits.' },
  { code: Opcode.POPCNT, mnemonic: 'POPCNT', category: 'bit', syntax: 'POPCNT Rd, Rs', description: 'Hardware POPCNT: tel het aantal 1-bits in Rs.' },
  { code: Opcode.BSWAP, mnemonic: 'BSWAP', category: 'bit', syntax: 'BSWAP Rd', description: 'Wissel byte-volgorde (endianness) binnen actieve breedte.' },
  { code: Opcode.CMP, mnemonic: 'CMP', category: 'flow', syntax: 'CMP Rd, Rs', description: 'Vergelijk Rd en Rs; zet ZF (==), CF (<) en SF (< 0).' },
  { code: Opcode.TEST, mnemonic: 'TEST', category: 'flow', syntax: 'TEST Rd, Rs', description: 'Hardware TEST: zet ZF als (Rd & Rs) == 0.' },
  { code: Opcode.JMP, mnemonic: 'JMP', category: 'flow', syntax: 'JMP @addr', description: 'Onvoorwaardelijke sprong naar instructie-adres.' },
  { code: Opcode.JZ, mnemonic: 'JZ', category: 'flow', syntax: 'JZ @addr', description: 'Spring naar adres als Zero Flag (ZF == 1).' },
  { code: Opcode.JNZ, mnemonic: 'JNZ', category: 'flow', syntax: 'JNZ @addr', description: 'Spring naar adres als Zero Flag (ZF == 0).' },
  { code: Opcode.JLT, mnemonic: 'JLT', category: 'flow', syntax: 'JLT @addr', description: 'Spring naar adres als Carry/Less Flag (CF == 1).' },
  { code: Opcode.LOAD, mnemonic: 'LOAD', category: 'mem', syntax: 'LOAD Rd, [Rs]', description: 'Lees woord uit L1 RAM[Rs & 15] naar Rd.' },
  { code: Opcode.STORE, mnemonic: 'STORE', category: 'mem', syntax: 'STORE [Rd], Rs', description: 'Schrijf Rs naar L1 RAM[Rd & 15].' },
  { code: Opcode.CMOVLT, mnemonic: 'CMOVLT', category: 'mem', syntax: 'CMOVLT Rd, Rs', description: 'Voorwaardelijke verplaatsing (CMOVL) zonder sprong als CF == 1.' },
  { code: Opcode.VLOAD, mnemonic: 'VLOAD', category: 'simd', syntax: 'VLOAD Xd, [Rs]', description: '128-bit SIMD: laad 4 RAM-woorden in vectorregister XMMd.' },
  { code: Opcode.VSTORE, mnemonic: 'VSTORE', category: 'simd', syntax: 'VSTORE [Rd], Xs', description: '128-bit SIMD: schrijf 4 lanes van XMMs naar L1 RAM.' },
  { code: Opcode.VADD, mnemonic: 'VADD', category: 'simd', syntax: 'VADD Xd, Xs', description: '128-bit SIMD PADDD: tel 4 lanes parallel in 1 cyclus op.' },
  { code: Opcode.VXOR, mnemonic: 'VXOR', category: 'simd', syntax: 'VXOR Xd, Xs', description: '128-bit SIMD PXOR: parallelle XOR over 128 bits.' },
  { code: Opcode.VSUM, mnemonic: 'VSUM', category: 'simd', syntax: 'VSUM Rd, Xs', description: '128-bit SIMD reductie: som van 4 lanes in scalar Rd.' },
  { code: Opcode.SENSE, mnemonic: 'SENSE', category: 'io', syntax: 'SENSE Rd, P#', description: 'Lees live hardware-sensorpoort P0..P7 direct in Rd.' },
  { code: Opcode.ACT, mnemonic: 'ACT', category: 'io', syntax: 'ACT Rs', description: 'Stuur uitvoer Rs naar actuator-bus en beëindig tick.' },
  { code: Opcode.PREAD, mnemonic: 'PREAD', category: 'smc', syntax: 'PREAD Rd, [Rs]', description: 'Zelf-inspectie: lees eigen instructiewoord op @Rs in Rd.' },
  { code: Opcode.PWRITE, mnemonic: 'PWRITE', category: 'smc', syntax: 'PWRITE [Rd], Rs', description: 'Zelf-modificatie: herschrijf eigen code op @Rd met waarde Rs.' },
  { code: Opcode.BWRITE, mnemonic: 'BWRITE', category: 'smc', syntax: 'BWRITE [Rd], Rs', description: 'Multi-kern bus: schrijf Rs naar gedeeld buskanaal BUS[Rd & 7].' },
  { code: Opcode.BREAD, mnemonic: 'BREAD', category: 'smc', syntax: 'BREAD Rd, [Rs]', description: 'Multi-kern bus: lees gedeeld buskanaal BUS[Rs & 7] in Rd.' },
];

export type TaskId = 'homeostasis' | 'arena' | 'bitstream' | 'hardware';

export interface TaskSpec {
  id: TaskId;
  name: string;
  shortDesc: string;
  ports: string[];
  actions: string[];
}

export const TASKS: Record<TaskId, TaskSpec> = {
  homeostasis: {
    id: 'homeostasis',
    name: 'Thermische & Bus-Balans',
    shortDesc: 'Houd CPU-temperatuur, werklast en energierail in balans onder wisselende stresstoestanden.',
    ports: [
      'P0: Temp (0..100°C)',
      'P1: Werklast-wachtrij',
      'P2: Energie-rail (%)',
      'P3: Temp-afwijking',
      'P4: Wachtrij-druk',
      'P5: Vorige actie',
      'P6: Hardware-mask',
      'P7: Klok-tick',
    ],
    actions: ['0: Rust / Laad', '1: Normaal werk', '2: Turbo-burst', '3: Actief koelen'],
  },
  arena: {
    id: 'arena',
    name: '2D Hardware-Signaalzoeker',
    shortDesc: 'Navigeer autonoom over een 16×16 bus-grid naar energiebronnen en ontwijk storing.',
    ports: [
      'P0: Delta X Energie',
      'P1: Delta Y Energie',
      'P2: Delta X Storing',
      'P3: Delta Y Storing',
      'P4: Energie (%)',
      'P5: Afstand Bron',
      'P6: Hardware-mask',
      'P7: Klok-tick',
    ],
    actions: ['0: Noord (Y-1)', '1: Oost (X+1)', '2: Zuid (Y+1)', '3: West (X-1)'],
  },
  bitstream: {
    id: 'bitstream',
    name: 'Bit-Patroon Cortex',
    shortDesc: 'Ontdek 4-bit shift-XOR-patronen (P0 ^ (P1 >> 1)) uit live buswoorden.',
    ports: [
      'P0: Huidig buswoord',
      'P1: Vorig buswoord',
      'P2: Klok-pariteit (0/1)',
      'P3: Bit-gewicht P0 (popcnt)',
      'P4: Vorige bitfout',
      'P5: Vorige voorspelling',
      'P6: P0 XOR P1',
      'P7: Klok-tick',
    ],
    actions: ['ACT waarde & 0x0F = Voorspelde 4-bit code'],
  },
  hardware: {
    id: 'hardware',
    name: 'Open Hardware-Bus (Live I/O)',
    shortDesc: 'Plug-and-play sensorbus voor GPU, muis, toetsenbord, gamepad en live camera-invoer.',
    ports: [
      'P0: Kanaal A (Cam/Muis)',
      'P1: Kanaal B (Beweging)',
      'P2: Invoerwoord (HID/Lens)',
      'P3: Hardware-mask',
      'P4: Signaal-delta (dP0)',
      'P5: Vorige ACT-echo',
      'P6: Bus-entropie',
      'P7: Klok-tick',
    ],
    actions: ['ACT waarde & 0x0F = Live bus-respons & signaalvoorspelling'],
  },
};

export interface Instruction {
  opcode: Opcode;
  dst: number;
  src: number;
  imm: number; // signed -128..127
}

export interface VMState {
  regs: BigInt64Array; // 8 x 64-bit signed registers (masked to 16/32/64)
  xmm: Int32Array; // 4 x 4 x 32-bit SIMD lanes = 4 x 128-bit registers
  ram: BigInt64Array; // 16 x 64-bit words
  activeCode: Uint8Array; // Runtime copy of 128-byte program (supports live SMC)
  smcModified: Uint8Array; // 32 flags marking addresses rewritten by PWRITE
  ip: number;
  zf: boolean;
  cf: boolean;
  sf: boolean;
  out: number;
  cyclesUsed: number;
  totalCycles: number;
  hitCounts: Uint32Array;
  lastRamRead: number;
  lastRamWrite: number;
  lastBusRead: number;
  lastBusWrite: number;
}

export interface Agent {
  id: number;
  genome: Uint8Array; // 128 bytes
  fitness: number;
  generationBorn: number;
}

export interface EnvSnapshot {
  taskId: TaskId;
  tick: number;
  ports: number[];
  lastAction: number;
  rewardDelta: number;
  cumulativeScore: number;
  temp: number;
  queue: number;
  energy: number;
  alive: boolean;
  history: Array<{ tick: number; temp: number; queue: number; energy: number; action: number }>;
  agentX: number;
  agentY: number;
  nodes: Array<{ x: number; y: number }>;
  hazards: Array<{ x: number; y: number }>;
  trail: Array<{ x: number; y: number }>;
  nodesCollected: number;
  hazardHits: number;
  bitCurr: number;
  bitPrev: number;
  bitTarget: number;
  bitPred: number;
  bitLastErr: number;
  bitExactHits: number;
  bitStreamHistory: Array<{ tick: number; target: number; pred: number; match: boolean }>;
  hwMask: number;
  hwStreamA: number;
  hwStreamB: number;
  hwInputWord: number;
  hwPrevA: number;
  cameraActive: boolean;
  cameraGrid: number[] | null;
}

function scalarWidth(width: BitWidth): number {
  return width === 128 ? 64 : width;
}

function maskSigned(val: bigint, width: BitWidth): bigint {
  return BigInt.asIntN(scalarWidth(width), val);
}

function maskUnsigned(val: bigint, width: BitWidth): bigint {
  return BigInt.asUintN(scalarWidth(width), val);
}

function popcountBigInt(val: bigint, width: BitWidth): bigint {
  let u = maskUnsigned(val, width);
  let count = 0n;
  while (u > 0n) {
    count += u & 1n;
    u >>= 1n;
  }
  return count;
}

function bswapBigInt(val: bigint, width: BitWidth): bigint {
  const sw = scalarWidth(width);
  let u = maskUnsigned(val, width);
  const bytes = sw / 8;
  let out = 0n;
  for (let i = 0; i < bytes; i++) {
    out = (out << 8n) | (u & 0xffn);
    u >>= 8n;
  }
  return BigInt.asIntN(sw, out);
}

export function createVMState(initialGenome?: Uint8Array): VMState {
  return {
    regs: new BigInt64Array(REG_COUNT),
    xmm: new Int32Array(XMM_COUNT * 4),
    ram: new BigInt64Array(RAM_WORDS),
    activeCode: initialGenome ? new Uint8Array(initialGenome) : new Uint8Array(PROG_LEN * 4),
    smcModified: new Uint8Array(PROG_LEN),
    ip: 0,
    zf: false,
    cf: false,
    sf: false,
    out: 0,
    cyclesUsed: 0,
    totalCycles: 0,
    hitCounts: new Uint32Array(PROG_LEN),
    lastRamRead: -1,
    lastRamWrite: -1,
    lastBusRead: -1,
    lastBusWrite: -1,
  };
}

export function decodeInstruction(genome: Uint8Array, index: number): Instruction {
  const base = (index % PROG_LEN) * 4;
  const rawOp = genome[base] % OPCODE_COUNT;
  const dst = genome[base + 1] & 7;
  const src = genome[base + 2] & 7;
  const rawImm = genome[base + 3];
  const imm = rawImm > 127 ? rawImm - 256 : rawImm;
  return { opcode: rawOp as Opcode, dst, src, imm };
}

export function encodeInstruction(
  genome: Uint8Array,
  index: number,
  opcode: Opcode,
  dst: number,
  src: number,
  imm: number
): void {
  const base = (index % PROG_LEN) * 4;
  genome[base] = opcode % OPCODE_COUNT;
  genome[base + 1] = dst & 7;
  genome[base + 2] = src & 7;
  genome[base + 3] = ((imm | 0) + 256) & 0xff;
}

export function formatHexBytes(genome: Uint8Array, index: number): string {
  const base = index * 4;
  return [0, 1, 2, 3]
    .map((offset) => genome[base + offset].toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export function disassembleInstruction(inst: Instruction): string {
  const rd = `R${inst.dst}`;
  const rs = `R${inst.src}`;
  const xd = `XMM${inst.dst & 3}`;
  const xs = `XMM${inst.src & 3}`;
  const addrHex = `@0x${(((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()}`;

  switch (inst.opcode) {
    case Opcode.NOP: return 'NOP';
    case Opcode.MOVI: return `MOVI ${rd}, #${inst.imm}`;
    case Opcode.MOV: return `MOV ${rd}, ${rs}`;
    case Opcode.SWAP: return `SWAP ${rd}, ${rs}`;
    case Opcode.ADD: return `ADD ${rd}, ${rs}`;
    case Opcode.ADDI: return `ADDI ${rd}, #${inst.imm}`;
    case Opcode.SUB: return `SUB ${rd}, ${rs}`;
    case Opcode.MUL: return `MUL ${rd}, ${rs}`;
    case Opcode.DIV: return `DIV ${rd}, ${rs}`;
    case Opcode.MOD: return `MOD ${rd}, ${rs}`;
    case Opcode.NEG: return `NEG ${rd}`;
    case Opcode.ABS: return `ABS ${rd}`;
    case Opcode.INC: return `INC ${rd}`;
    case Opcode.DEC: return `DEC ${rd}`;
    case Opcode.AND: return `AND ${rd}, ${rs}`;
    case Opcode.OR: return `OR ${rd}, ${rs}`;
    case Opcode.XOR: return `XOR ${rd}, ${rs}`;
    case Opcode.NOT: return `NOT ${rd}`;
    case Opcode.SHL: return `SHL ${rd}, #${inst.imm & 7}`;
    case Opcode.SHR: return `SHR ${rd}, #${inst.imm & 7}`;
    case Opcode.ROL: return `ROL ${rd}, #${inst.imm & 7}`;
    case Opcode.ROR: return `ROR ${rd}, #${inst.imm & 7}`;
    case Opcode.POPCNT: return `POPCNT ${rd}, ${rs}`;
    case Opcode.BSWAP: return `BSWAP ${rd}`;
    case Opcode.CMP: return `CMP ${rd}, ${rs}`;
    case Opcode.TEST: return `TEST ${rd}, ${rs}`;
    case Opcode.JMP: return `JMP ${addrHex}`;
    case Opcode.JZ: return `JZ ${addrHex}`;
    case Opcode.JNZ: return `JNZ ${addrHex}`;
    case Opcode.JLT: return `JLT ${addrHex}`;
    case Opcode.LOAD: return `LOAD ${rd}, [${rs}]`;
    case Opcode.STORE: return `STORE [${rd}], ${rs}`;
    case Opcode.CMOVLT: return `CMOVLT ${rd}, ${rs}`;
    case Opcode.VLOAD: return `VLOAD ${xd}, [${rs}]`;
    case Opcode.VSTORE: return `VSTORE [${rd}], ${xs}`;
    case Opcode.VADD: return `VADD ${xd}, ${xs}`;
    case Opcode.VXOR: return `VXOR ${xd}, ${xs}`;
    case Opcode.VSUM: return `VSUM ${rd}, ${xs}`;
    case Opcode.SENSE: return `SENSE ${rd}, P${inst.src & 7}`;
    case Opcode.ACT: return `ACT ${rs}`;
    case Opcode.PREAD: return `PREAD ${rd}, [${rs}]`;
    case Opcode.PWRITE: return `PWRITE [${rd}], ${rs}`;
    case Opcode.BWRITE: return `BWRITE [${rd}], ${rs}`;
    case Opcode.BREAD: return `BREAD ${rd}, [${rs}]`;
    default: return 'NOP';
  }
}

export interface VMExecOptions {
  allowSmc?: boolean;
  sharedBus?: Int32Array;
}

export function stepSingleInstruction(
  genome: Uint8Array,
  vm: VMState,
  ports: number[],
  bitWidth: BitWidth = 32,
  options: VMExecOptions = {}
): { acted: boolean } {
  const codeSource = options.allowSmc ? vm.activeCode : genome;
  const idx = vm.ip % PROG_LEN;
  const inst = decodeInstruction(codeSource, idx);
  vm.hitCounts[idx] = (vm.hitCounts[idx] + 1) >>> 0;
  vm.cyclesUsed += 1;
  vm.totalCycles += 1;
  vm.lastRamRead = -1;
  vm.lastRamWrite = -1;
  vm.lastBusRead = -1;
  vm.lastBusWrite = -1;

  const sw = BigInt(scalarWidth(bitWidth));
  let jumped = false;
  let acted = false;

  const rdVal = vm.regs[inst.dst];
  const rsVal = vm.regs[inst.src];

  switch (inst.opcode) {
    case Opcode.NOP:
      break;
    case Opcode.MOVI:
      vm.regs[inst.dst] = maskSigned(BigInt(inst.imm), bitWidth);
      break;
    case Opcode.MOV:
      vm.regs[inst.dst] = maskSigned(rsVal, bitWidth);
      break;
    case Opcode.SWAP: {
      const t = rdVal;
      vm.regs[inst.dst] = maskSigned(rsVal, bitWidth);
      vm.regs[inst.src] = maskSigned(t, bitWidth);
      break;
    }
    case Opcode.ADD:
      vm.regs[inst.dst] = maskSigned(rdVal + rsVal, bitWidth);
      break;
    case Opcode.ADDI:
      vm.regs[inst.dst] = maskSigned(rdVal + BigInt(inst.imm), bitWidth);
      break;
    case Opcode.SUB:
      vm.regs[inst.dst] = maskSigned(rdVal - rsVal, bitWidth);
      break;
    case Opcode.MUL:
      vm.regs[inst.dst] = maskSigned(rdVal * rsVal, bitWidth);
      break;
    case Opcode.DIV:
      if (rsVal !== 0n) {
        vm.regs[inst.dst] = maskSigned(rdVal / rsVal, bitWidth);
      }
      break;
    case Opcode.MOD:
      if (rsVal !== 0n) {
        vm.regs[inst.dst] = maskSigned(rdVal % rsVal, bitWidth);
      }
      break;
    case Opcode.NEG:
      vm.regs[inst.dst] = maskSigned(-rdVal, bitWidth);
      break;
    case Opcode.ABS:
      vm.regs[inst.dst] = maskSigned(rdVal < 0n ? -rdVal : rdVal, bitWidth);
      break;
    case Opcode.INC:
      vm.regs[inst.dst] = maskSigned(rdVal + 1n, bitWidth);
      break;
    case Opcode.DEC:
      vm.regs[inst.dst] = maskSigned(rdVal - 1n, bitWidth);
      break;
    case Opcode.AND:
      vm.regs[inst.dst] = maskSigned(rdVal & rsVal, bitWidth);
      break;
    case Opcode.OR:
      vm.regs[inst.dst] = maskSigned(rdVal | rsVal, bitWidth);
      break;
    case Opcode.XOR:
      vm.regs[inst.dst] = maskSigned(rdVal ^ rsVal, bitWidth);
      break;
    case Opcode.NOT:
      vm.regs[inst.dst] = maskSigned(~rdVal, bitWidth);
      break;
    case Opcode.SHL:
      vm.regs[inst.dst] = maskSigned(rdVal << BigInt(inst.imm & 7), bitWidth);
      break;
    case Opcode.SHR:
      vm.regs[inst.dst] = maskSigned(rdVal >> BigInt(inst.imm & 7), bitWidth);
      break;
    case Opcode.ROL: {
      const sh = BigInt(inst.imm & 7);
      const u = maskUnsigned(rdVal, bitWidth);
      vm.regs[inst.dst] = maskSigned((u << sh) | (u >> (sw - sh)), bitWidth);
      break;
    }
    case Opcode.ROR: {
      const sh = BigInt(inst.imm & 7);
      const u = maskUnsigned(rdVal, bitWidth);
      vm.regs[inst.dst] = maskSigned((u >> sh) | (u << (sw - sh)), bitWidth);
      break;
    }
    case Opcode.POPCNT:
      vm.regs[inst.dst] = popcountBigInt(rsVal, bitWidth);
      break;
    case Opcode.BSWAP:
      vm.regs[inst.dst] = bswapBigInt(rdVal, bitWidth);
      break;
    case Opcode.CMP: {
      const a = maskSigned(rdVal, bitWidth);
      const b = maskSigned(rsVal, bitWidth);
      vm.zf = a === b;
      vm.cf = a < b;
      vm.sf = a - b < 0n;
      break;
    }
    case Opcode.TEST: {
      const masked = maskSigned(rdVal & rsVal, bitWidth);
      vm.zf = masked === 0n;
      vm.cf = false;
      vm.sf = masked < 0n;
      break;
    }
    case Opcode.JMP:
      vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
      jumped = true;
      break;
    case Opcode.JZ:
      if (vm.zf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    case Opcode.JNZ:
      if (!vm.zf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    case Opcode.JLT:
      if (vm.cf || vm.sf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    case Opcode.LOAD: {
      const addr = Number(rsVal & BigInt(RAM_WORDS - 1));
      vm.regs[inst.dst] = maskSigned(vm.ram[addr], bitWidth);
      vm.lastRamRead = addr;
      break;
    }
    case Opcode.STORE: {
      const addr = Number(rdVal & BigInt(RAM_WORDS - 1));
      vm.ram[addr] = maskSigned(rsVal, bitWidth);
      vm.lastRamWrite = addr;
      break;
    }
    case Opcode.CMOVLT:
      if (vm.cf || vm.sf) {
        vm.regs[inst.dst] = maskSigned(rsVal, bitWidth);
      }
      break;
    case Opcode.VLOAD: {
      const xd = (inst.dst & 3) * 4;
      const base = Number(rsVal & BigInt(RAM_WORDS - 1));
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Number(BigInt.asIntN(32, vm.ram[(base + lane) & (RAM_WORDS - 1)]));
      }
      vm.lastRamRead = base;
      break;
    }
    case Opcode.VSTORE: {
      const xs = (inst.src & 3) * 4;
      const base = Number(rdVal & BigInt(RAM_WORDS - 1));
      for (let lane = 0; lane < 4; lane++) {
        vm.ram[(base + lane) & (RAM_WORDS - 1)] = BigInt(vm.xmm[xs + lane]);
      }
      vm.lastRamWrite = base;
      break;
    }
    case Opcode.VADD: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] + vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.VXOR: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] ^ vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.VSUM: {
      const xs = (inst.src & 3) * 4;
      let sum = 0n;
      for (let lane = 0; lane < 4; lane++) {
        sum += BigInt(vm.xmm[xs + lane]);
      }
      vm.regs[inst.dst] = maskSigned(sum, bitWidth);
      break;
    }
    case Opcode.SENSE: {
      const port = inst.src & 7;
      vm.regs[inst.dst] = maskSigned(BigInt((ports[port] ?? 0) | 0), bitWidth);
      break;
    }
    case Opcode.ACT:
      vm.out = Number(BigInt.asIntN(32, rsVal));
      acted = true;
      break;
    case Opcode.PREAD: {
      const pIdx = Number(maskUnsigned(rsVal, bitWidth) & BigInt(PROG_LEN - 1));
      const base = pIdx * 4;
      const packed =
        (codeSource[base] & 0xff) |
        ((codeSource[base + 1] & 0xff) << 8) |
        ((codeSource[base + 2] & 0xff) << 16) |
        ((codeSource[base + 3] & 0xff) << 24);
      vm.regs[inst.dst] = maskSigned(BigInt(packed | 0), bitWidth);
      break;
    }
    case Opcode.PWRITE: {
      if (options.allowSmc) {
        const pIdx = Number(maskUnsigned(rdVal, bitWidth) & BigInt(PROG_LEN - 1));
        const base = pIdx * 4;
        const packed = Number(BigInt.asUintN(32, rsVal));
        vm.activeCode[base] = (packed & 0xff) % OPCODE_COUNT;
        vm.activeCode[base + 1] = ((packed >> 8) & 0xff) & 7;
        vm.activeCode[base + 2] = ((packed >> 16) & 0xff) & 7;
        vm.activeCode[base + 3] = (packed >> 24) & 0xff;
        vm.smcModified[pIdx] = 1;
      }
      break;
    }
    case Opcode.BWRITE: {
      const ch = Number(maskUnsigned(rdVal, bitWidth) & 7n);
      if (options.sharedBus) {
        options.sharedBus[ch] = Number(BigInt.asIntN(32, rsVal));
        vm.lastBusWrite = ch;
      }
      break;
    }
    case Opcode.BREAD: {
      const ch = Number(maskUnsigned(rsVal, bitWidth) & 7n);
      if (options.sharedBus) {
        vm.regs[inst.dst] = maskSigned(BigInt(options.sharedBus[ch]), bitWidth);
        vm.lastBusRead = ch;
      }
      break;
    }
  }

  if (!jumped) {
    vm.ip = (idx + 1) % PROG_LEN;
  }

  return { acted };
}

export function runVMTick(
  genome: Uint8Array,
  vm: VMState,
  ports: number[],
  bitWidth: BitWidth = 32,
  maxCycles: number = MAX_CYCLES_PER_TICK,
  options: VMExecOptions = {}
): { action: number; didAct: boolean } {
  vm.ip = 0;
  vm.cyclesUsed = 0;
  let didAct = false;
  for (let c = 0; c < maxCycles; c++) {
    const res = stepSingleInstruction(genome, vm, ports, bitWidth, options);
    if (res.acted) {
      didAct = true;
      break;
    }
  }
  if (!didAct) {
    vm.out = Number(BigInt.asIntN(32, vm.regs[0]));
  }
  return { action: vm.out, didAct };
}

export function createRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const BASIC_CPU_OPS: Opcode[] = [
  Opcode.MOVI,
  Opcode.MOV,
  Opcode.ADD,
  Opcode.ADDI,
  Opcode.SUB,
  Opcode.XOR,
  Opcode.AND,
  Opcode.SHR,
  Opcode.SHL,
  Opcode.INC,
  Opcode.DEC,
  Opcode.CMP,
  Opcode.TEST,
  Opcode.JLT,
  Opcode.JZ,
  Opcode.JNZ,
  Opcode.LOAD,
  Opcode.STORE,
  Opcode.CMOVLT,
  Opcode.SENSE,
  Opcode.ACT,
];

function sampleNeutralCpuOpcode(rng: () => number): Opcode {
  if (rng() < 0.65) {
    return BASIC_CPU_OPS[Math.floor(rng() * BASIC_CPU_OPS.length)];
  }
  return Math.floor(rng() * OPCODE_COUNT) as Opcode;
}

export function createRandomGenome(
  rng: () => number,
  _bitWidth: BitWidth = 32,
  _options: { dualCore?: boolean; isCoCore?: boolean } = {}
): Uint8Array {
  const g = new Uint8Array(PROG_LEN * 4);
  for (let i = 0; i < PROG_LEN; i++) {
    const op = sampleNeutralCpuOpcode(rng);
    const dst = Math.floor(rng() * 8);
    const src = Math.floor(rng() * 8);
    const imm = Math.floor(rng() * 48) - 16;
    encodeInstruction(g, i, op, dst, src, imm);
  }
  return g;
}

export function createStarterGenome(taskId: TaskId): Uint8Array {
  const g = new Uint8Array(PROG_LEN * 4);
  if (taskId === 'homeostasis') {
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);
    encodeInstruction(g, 2, Opcode.SENSE, 2, 2, 0);
    encodeInstruction(g, 3, Opcode.MOVI, 3, 0, 72);
    encodeInstruction(g, 4, Opcode.CMP, 3, 0, 0);
    encodeInstruction(g, 5, Opcode.JLT, 0, 0, 14);
    encodeInstruction(g, 6, Opcode.MOVI, 3, 0, 28);
    encodeInstruction(g, 7, Opcode.CMP, 2, 3, 0);
    encodeInstruction(g, 8, Opcode.JLT, 0, 0, 17);
    encodeInstruction(g, 9, Opcode.MOVI, 3, 0, 48);
    encodeInstruction(g, 10, Opcode.CMP, 3, 1, 0);
    encodeInstruction(g, 11, Opcode.JLT, 0, 0, 20);
    encodeInstruction(g, 12, Opcode.MOVI, 4, 0, 1);
    encodeInstruction(g, 13, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 14, Opcode.MOVI, 4, 0, 3);
    encodeInstruction(g, 15, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 16, Opcode.NOP, 0, 0, 0);
    encodeInstruction(g, 17, Opcode.MOVI, 4, 0, 0);
    encodeInstruction(g, 18, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 19, Opcode.NOP, 0, 0, 0);
    encodeInstruction(g, 20, Opcode.MOVI, 4, 0, 2);
    encodeInstruction(g, 21, Opcode.ACT, 0, 4, 0);
  } else if (taskId === 'arena') {
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);
    encodeInstruction(g, 2, Opcode.MOVI, 2, 0, 0);
    encodeInstruction(g, 3, Opcode.CMP, 0, 2, 0);
    encodeInstruction(g, 4, Opcode.JLT, 0, 0, 11);
    encodeInstruction(g, 5, Opcode.CMP, 2, 0, 0);
    encodeInstruction(g, 6, Opcode.JLT, 0, 0, 13);
    encodeInstruction(g, 7, Opcode.CMP, 1, 2, 0);
    encodeInstruction(g, 8, Opcode.JLT, 0, 0, 16);
    encodeInstruction(g, 9, Opcode.MOVI, 4, 0, 2);
    encodeInstruction(g, 10, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 11, Opcode.MOVI, 4, 0, 3);
    encodeInstruction(g, 12, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 13, Opcode.MOVI, 4, 0, 1);
    encodeInstruction(g, 14, Opcode.ACT, 0, 4, 0);
    encodeInstruction(g, 15, Opcode.NOP, 0, 0, 0);
    encodeInstruction(g, 16, Opcode.MOVI, 4, 0, 0);
    encodeInstruction(g, 17, Opcode.ACT, 0, 4, 0);
  } else if (taskId === 'bitstream') {
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);
    encodeInstruction(g, 2, Opcode.SHR, 1, 0, 1);
    encodeInstruction(g, 3, Opcode.XOR, 0, 1, 0);
    encodeInstruction(g, 4, Opcode.MOVI, 2, 0, 15);
    encodeInstruction(g, 5, Opcode.AND, 0, 2, 0);
    encodeInstruction(g, 6, Opcode.MOVI, 3, 0, 0);
    encodeInstruction(g, 7, Opcode.STORE, 3, 0, 0);
    encodeInstruction(g, 8, Opcode.LOAD, 4, 3, 0);
    encodeInstruction(g, 9, Opcode.ACT, 0, 4, 0);
  } else {
    // hardware starter reflex: P0 ^ P1 + (P4 >> 1) & 0x0F
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);
    encodeInstruction(g, 2, Opcode.SENSE, 2, 4, 0);
    encodeInstruction(g, 3, Opcode.XOR, 0, 1, 0);
    encodeInstruction(g, 4, Opcode.SHR, 2, 0, 1);
    encodeInstruction(g, 5, Opcode.ADD, 0, 2, 0);
    encodeInstruction(g, 6, Opcode.MOVI, 3, 0, 15);
    encodeInstruction(g, 7, Opcode.AND, 0, 3, 0);
    encodeInstruction(g, 8, Opcode.ACT, 0, 0, 0);
  }
  return g;
}

const HOMEOSTASIS_REGIMES = [
  { temp: 48, queue: 32, energy: 82 },
  { temp: 80, queue: 25, energy: 70 },
  { temp: 40, queue: 76, energy: 88 },
  { temp: 62, queue: 45, energy: 22 },
];

export function createInitialEnv(
  taskId: TaskId,
  seed: number = 1337,
  hwMask: number = 0
): EnvSnapshot {
  const rng = createRng(seed);
  const nodes: Array<{ x: number; y: number }> = [];
  const hazards: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 4; i++) {
    nodes.push({ x: Math.floor(rng() * 16), y: Math.floor(rng() * 16) });
  }
  for (let i = 0; i < 5; i++) {
    const hx = Math.floor(rng() * 16);
    const hy = Math.floor(rng() * 16);
    if (hx !== 8 || hy !== 8) hazards.push({ x: hx, y: hy });
  }

  const regime = HOMEOSTASIS_REGIMES[Math.abs(seed) % HOMEOSTASIS_REGIMES.length];
  const bitCurr = Math.floor(rng() * 16);
  const bitPrev = Math.floor(rng() * 16);
  const hwStreamA = Math.floor(rng() * 64);
  const hwStreamB = Math.floor(rng() * 32);

  const env: EnvSnapshot = {
    taskId,
    tick: 0,
    ports: [0, 0, 0, 0, 0, 0, 0, 0],
    lastAction: 0,
    rewardDelta: 0,
    cumulativeScore: 0,
    temp: regime.temp,
    queue: regime.queue,
    energy: regime.energy,
    alive: true,
    history: [
      { tick: 0, temp: regime.temp, queue: regime.queue, energy: regime.energy, action: 1 },
    ],
    agentX: 8,
    agentY: 8,
    nodes,
    hazards,
    trail: [{ x: 8, y: 8 }],
    nodesCollected: 0,
    hazardHits: 0,
    bitCurr,
    bitPrev,
    bitTarget: (bitCurr ^ (bitPrev >> 1)) & 0x0f,
    bitPred: 0,
    bitLastErr: 0,
    bitExactHits: 0,
    bitStreamHistory: [],
    hwMask,
    hwStreamA,
    hwStreamB,
    hwInputWord: (hwStreamA ^ hwStreamB) & 0xff,
    hwPrevA: hwStreamA,
    cameraActive: false,
    cameraGrid: null,
  };

  updateEnvPorts(env);
  return env;
}

export function updateEnvPorts(env: EnvSnapshot): void {
  if (env.taskId === 'homeostasis') {
    env.ports = [
      Math.round(env.temp),
      Math.round(env.queue),
      Math.round(env.energy),
      Math.round(env.temp - 55),
      Math.round(env.queue - 40),
      env.lastAction,
      env.hwMask,
      env.tick & 0xff,
    ];
  } else if (env.taskId === 'arena') {
    let bestNode = env.nodes[0];
    let bestNodeDist = 999;
    for (const n of env.nodes) {
      const d = Math.abs(n.x - env.agentX) + Math.abs(n.y - env.agentY);
      if (d < bestNodeDist) {
        bestNodeDist = d;
        bestNode = n;
      }
    }
    let bestHaz = env.hazards[0];
    let bestHazDist = 999;
    for (const h of env.hazards) {
      const d = Math.abs(h.x - env.agentX) + Math.abs(h.y - env.agentY);
      if (d < bestHazDist) {
        bestHazDist = d;
        bestHaz = h;
      }
    }
    env.ports = [
      bestNode.x - env.agentX,
      bestNode.y - env.agentY,
      bestHaz.x - env.agentX,
      bestHaz.y - env.agentY,
      Math.round(env.energy),
      bestNodeDist,
      env.hwMask,
      env.tick & 0xff,
    ];
  } else if (env.taskId === 'bitstream') {
    env.ports = [
      env.bitCurr,
      env.bitPrev,
      env.tick & 1,
      popcount4(env.bitCurr),
      env.bitLastErr,
      env.bitPred,
      (env.bitCurr ^ env.bitPrev) & 0x0f,
      env.tick & 0xff,
    ];
  } else {
    const dP0 = env.hwStreamA - env.hwPrevA;
    env.ports = [
      env.hwStreamA,
      env.hwStreamB,
      env.hwInputWord,
      env.hwMask,
      dP0,
      env.lastAction,
      (env.hwStreamA ^ env.hwStreamB ^ env.hwInputWord) & 0xff,
      env.tick & 0xff,
    ];
  }
}

function popcount4(x: number): number {
  let v = x & 0x0f;
  let c = 0;
  while (v) {
    c += v & 1;
    v >>= 1;
  }
  return c;
}

export interface LivePeripheralSample {
  streamA: number;
  streamB: number;
  inputWord: number;
  capabilityMask: number;
  cameraActive: boolean;
  cameraGrid: number[] | null;
}

export function stepEnvironment(
  env: EnvSnapshot,
  rawAction: number,
  didAct: boolean,
  rng: () => number,
  disturbance: { tempSpike?: number; loadSpike?: number; energyDip?: number } = {},
  livePeripheral?: LivePeripheralSample
): void {
  env.tick += 1;
  if (livePeripheral) {
    env.hwMask = livePeripheral.capabilityMask;
    env.cameraActive = livePeripheral.cameraActive;
    env.cameraGrid = livePeripheral.cameraGrid;
  }

  let reward = didAct ? 0.5 : -2.0;

  if (env.taskId === 'homeostasis') {
    const act = ((rawAction % 4) + 4) % 4;
    env.lastAction = act;
    const incomingLoad =
      4 + Math.floor(rng() * 6) + (env.tick % 9 === 0 ? 15 : 0) + (disturbance.loadSpike ?? 0);

    if (disturbance.tempSpike) env.temp += disturbance.tempSpike;
    if (disturbance.energyDip) env.energy -= disturbance.energyDip;

    if (act === 0) {
      env.temp -= 5;
      env.energy += 8;
      env.queue += incomingLoad;
    } else if (act === 1) {
      env.temp += 2.0;
      env.energy -= 3.0;
      env.queue += incomingLoad - 7;
    } else if (act === 2) {
      env.temp += 7.0;
      env.energy -= 7.5;
      env.queue += incomingLoad - 16;
    } else {
      env.temp -= 10;
      env.energy -= 4.5;
      env.queue += incomingLoad - 2;
    }

    env.temp += (32 - env.temp) * 0.04;
    env.temp = Math.max(15, Math.min(105, env.temp));
    env.queue = Math.max(0, Math.min(100, env.queue));
    env.energy = Math.max(0, Math.min(100, env.energy));

    if (env.temp >= 96 || env.energy <= 3) {
      env.alive = false;
      reward -= 50;
    } else {
      const tempScore = Math.max(0, 12 - Math.abs(env.temp - 52) * 0.45);
      const queueScore = Math.max(0, 10 - env.queue * 0.22);
      const energyScore = env.energy > 25 ? 6 : -8;
      reward += tempScore + queueScore + energyScore;
    }

    env.history.push({
      tick: env.tick,
      temp: Math.round(env.temp),
      queue: Math.round(env.queue),
      energy: Math.round(env.energy),
      action: act,
    });
    if (env.history.length > 60) env.history.shift();
  } else if (env.taskId === 'arena') {
    const act = ((rawAction % 4) + 4) % 4;
    env.lastAction = act;

    let prevMinDist = 999;
    for (const n of env.nodes) {
      const d = Math.abs(n.x - env.agentX) + Math.abs(n.y - env.agentY);
      if (d < prevMinDist) prevMinDist = d;
    }

    let nx = env.agentX;
    let ny = env.agentY;
    if (act === 0) ny -= 1;
    else if (act === 1) nx += 1;
    else if (act === 2) ny += 1;
    else nx -= 1;

    let hitWall = false;
    if (nx < 0 || nx > 15 || ny < 0 || ny > 15) {
      hitWall = true;
      nx = Math.max(0, Math.min(15, nx));
      ny = Math.max(0, Math.min(15, ny));
    }

    env.agentX = nx;
    env.agentY = ny;
    env.trail.push({ x: nx, y: ny });
    if (env.trail.length > 24) env.trail.shift();

    env.energy = Math.max(0, env.energy - 1.2);
    if (hitWall) reward -= 3.5;

    let newMinDist = 999;
    for (let i = 0; i < env.nodes.length; i++) {
      const n = env.nodes[i];
      if (n.x === nx && n.y === ny) {
        env.nodesCollected += 1;
        env.energy = Math.min(100, env.energy + 25);
        reward += 30;
        env.nodes[i] = { x: Math.floor(rng() * 16), y: Math.floor(rng() * 16) };
      }
      const d = Math.abs(env.nodes[i].x - nx) + Math.abs(env.nodes[i].y - ny);
      if (d < newMinDist) newMinDist = d;
    }

    reward += (prevMinDist - newMinDist) * 2.5 + Math.max(0, 14 - newMinDist) * 0.45;

    for (const h of env.hazards) {
      if (h.x === nx && h.y === ny) {
        env.hazardHits += 1;
        env.energy = Math.max(0, env.energy - 22);
        reward -= 18;
      }
    }

    if (disturbance.energyDip) {
      env.energy = Math.max(0, env.energy - disturbance.energyDip);
    }

    if (env.energy <= 0) {
      env.alive = false;
      reward -= 25;
    }
  } else if (env.taskId === 'bitstream') {
    const pred = rawAction & 0x0f;
    env.lastAction = pred;
    env.bitPred = pred;

    const target = (env.bitCurr ^ (env.bitPrev >> 1)) & 0x0f;
    env.bitTarget = target;
    const bitErr = popcount4(pred ^ target);
    env.bitLastErr = bitErr;
    const exact = pred === target;
    if (exact) env.bitExactHits += 1;
    reward += (4 - bitErr) * 4 + (exact ? 10 : 0);

    env.bitStreamHistory.push({
      tick: env.tick,
      target,
      pred,
      match: exact,
    });
    if (env.bitStreamHistory.length > 24) env.bitStreamHistory.shift();

    const nextByte = (Math.floor(rng() * 16) + (disturbance.loadSpike ? 7 : 0)) & 0x0f;
    env.bitPrev = env.bitCurr;
    env.bitCurr = nextByte;
  } else {
    // Open Hardware-Bus (GPU / Input / Camera hot-plug)
    const pred = rawAction & 0x0f;
    env.lastAction = pred;
    env.bitPred = pred;

    const dP0 = env.hwStreamA - env.hwPrevA;
    const target = ((env.hwStreamA ^ env.hwStreamB) + (dP0 >> 1)) & 0x0f;
    env.bitTarget = target;
    const bitErr = popcount4(pred ^ target);
    env.bitLastErr = bitErr;
    const exact = pred === target;
    if (exact) env.bitExactHits += 1;
    reward += (4 - bitErr) * 4 + (exact ? 10 : 0);

    env.bitStreamHistory.push({
      tick: env.tick,
      target,
      pred,
      match: exact,
    });
    if (env.bitStreamHistory.length > 24) env.bitStreamHistory.shift();

    env.hwPrevA = env.hwStreamA;
    if (
      livePeripheral &&
      (livePeripheral.cameraActive ||
        livePeripheral.streamA !== 0 ||
        livePeripheral.streamB !== 0)
    ) {
      env.hwStreamA = livePeripheral.streamA;
      env.hwStreamB = livePeripheral.streamB;
      env.hwInputWord = livePeripheral.inputWord;
    } else {
      // Deterministic hardware oscillator fallback + manual disturbance injection
      const stepOsc = Math.round(
        32 + 24 * Math.sin(env.tick * 0.45 + (rng() - 0.5) * 0.6)
      );
      env.hwStreamA =
        (stepOsc + (disturbance.loadSpike ?? 0) + (disturbance.energyDip ?? 0)) & 0xff;
      env.hwStreamB = Math.floor(rng() * 32) ^ (env.hwStreamA & 0x0f);
      env.hwInputWord = livePeripheral
        ? livePeripheral.inputWord || ((env.hwStreamA ^ env.hwStreamB) & 0xff)
        : (env.hwStreamA ^ env.hwStreamB) & 0xff;
    }
  }

  env.rewardDelta = reward;
  env.cumulativeScore += reward;
  updateEnvPorts(env);
}

const BENCHMARK_ANCHOR_SEEDS = [1012, 2029, 3048, 4099];

export function evaluateAgentDetailed(
  genome: Uint8Array,
  taskId: TaskId,
  seed: number,
  bitWidth: BitWidth = 32,
  ticks: number = 36,
  options: { allowSmc?: boolean; coGenome?: Uint8Array | null; maxCycles?: number } = {}
): {
  score: number;
  modifiedCode: Uint8Array;
  smcModifiedCount: number;
  alive: boolean;
  hitCounts: Uint32Array;
} {
  const env = createInitialEnv(taskId, seed);
  const vmA = createVMState(genome);
  const vmB = options.coGenome ? createVMState(options.coGenome) : null;
  const sharedBus = new Int32Array(8);
  const rng = createRng(seed + 7919);
  const cycleCap = options.maxCycles ?? MAX_CYCLES_PER_TICK;

  for (let t = 0; t < ticks; t++) {
    if (!env.alive) break;
    if (vmB && options.coGenome) {
      runVMTick(options.coGenome, vmB, env.ports, bitWidth, cycleCap, {
        allowSmc: options.allowSmc,
        sharedBus,
      });
    }
    const { action, didAct } = runVMTick(genome, vmA, env.ports, bitWidth, cycleCap, {
      allowSmc: options.allowSmc,
      sharedBus,
    });
    stepEnvironment(env, action, didAct, rng);
  }

  let smcModifiedCount = 0;
  for (let i = 0; i < PROG_LEN; i++) {
    if (vmA.smcModified[i]) smcModifiedCount++;
  }

  return {
    score: env.cumulativeScore,
    modifiedCode: vmA.activeCode,
    smcModifiedCount,
    alive: env.alive,
    hitCounts: vmA.hitCounts,
  };
}

export function evaluateAgent(
  genome: Uint8Array,
  taskId: TaskId,
  seed: number,
  bitWidth: BitWidth = 32,
  ticks: number = 36,
  options: { allowSmc?: boolean; coGenome?: Uint8Array | null; maxCycles?: number } = {}
): number {
  return evaluateAgentDetailed(genome, taskId, seed, bitWidth, ticks, options).score;
}

export interface GenomeHwBias {
  bitWidth?: BitWidth;
  dualCore?: boolean;
  isCoCore?: boolean;
  activeSlots?: number[] | null;
  surgical?: boolean;
}

function genomeDiversityKey(genome: Uint8Array): string {
  let key = '';
  for (let i = 0; i < PROG_LEN; i++) {
    const base = i * 4;
    key += genome[base].toString(36) + (genome[base + 1] & 7).toString(8);
  }
  return key;
}

export function mutateGenome(
  parent: Uint8Array,
  mutationRate: number,
  rng: () => number,
  opts: GenomeHwBias = {}
): Uint8Array {
  const child = new Uint8Array(parent);
  const activePool =
    opts.activeSlots && opts.activeSlots.length > 0 && rng() < 0.8 ? opts.activeSlots : null;

  if (opts.surgical) {
    const edits = rng() < 0.65 ? 1 : 2;
    for (let e = 0; e < edits; e++) {
      const i = activePool
        ? activePool[Math.floor(rng() * activePool.length)]
        : Math.floor(rng() * PROG_LEN);
      const base = i * 4;
      const r = rng();
      if (r < 0.36) {
        child[base] = sampleNeutralCpuOpcode(rng);
      } else if (r < 0.58) {
        child[base + 1] = Math.floor(rng() * 8);
      } else if (r < 0.8) {
        child[base + 2] = Math.floor(rng() * 8);
      } else if (rng() < 0.5) {
        const cur = child[base + 3] > 127 ? child[base + 3] - 256 : child[base + 3];
        const delta = Math.floor(rng() * 9) - 4;
        child[base + 3] = ((cur + delta) + 256) & 0xff;
      } else {
        child[base + 3] = Math.floor(rng() * 256);
      }
    }
    return child;
  }

  for (let i = 0; i < PROG_LEN; i++) {
    if (rng() < mutationRate) {
      const r = rng();
      const base = i * 4;
      if (r < 0.36) {
        child[base] = sampleNeutralCpuOpcode(rng);
      } else if (r < 0.58) {
        child[base + 1] = Math.floor(rng() * 8);
      } else if (r < 0.8) {
        child[base + 2] = Math.floor(rng() * 8);
      } else {
        child[base + 3] = Math.floor(rng() * 256);
      }
    }
  }

  const structRoll = rng();
  if (structRoll < 0.22) {
    // Indel insert-shift around an active slot
    const pos = activePool
      ? Math.min(PROG_LEN - 2, activePool[Math.floor(rng() * activePool.length)])
      : Math.floor(rng() * (PROG_LEN - 1));
    for (let i = PROG_LEN - 1; i > pos; i--) {
      for (let k = 0; k < 4; k++) child[i * 4 + k] = child[(i - 1) * 4 + k];
    }
    encodeInstruction(
      child,
      pos,
      sampleNeutralCpuOpcode(rng),
      Math.floor(rng() * 8),
      Math.floor(rng() * 8),
      Math.floor(rng() * 48) - 16
    );
  } else if (structRoll < 0.44) {
    const a = Math.floor(rng() * PROG_LEN) * 4;
    const b = Math.floor(rng() * PROG_LEN) * 4;
    for (let k = 0; k < 4; k++) {
      const tmp = child[a + k];
      child[a + k] = child[b + k];
      child[b + k] = tmp;
    }
  }
  return child;
}

export function crossoverGenomes(a: Uint8Array, b: Uint8Array, rng: () => number): Uint8Array {
  const child = new Uint8Array(a);
  let p1 = Math.floor(rng() * PROG_LEN);
  let p2 = Math.floor(rng() * PROG_LEN);
  if (p1 > p2) {
    const t = p1;
    p1 = p2;
    p2 = t;
  }
  for (let i = p1; i <= p2; i++) {
    const base = i * 4;
    for (let k = 0; k < 4; k++) {
      child[base + k] = b[base + k];
    }
  }
  return child;
}

export function evolveGeneration(
  population: Agent[],
  taskId: TaskId,
  generation: number,
  mutationRate: number,
  bitWidth: BitWidth = 32,
  options: {
    allowSmc?: boolean;
    inheritSmc?: boolean;
    dualCore?: boolean;
    coPopulation?: Agent[] | null;
    maxCycles?: number;
  } = {}
): {
  nextPopulation: Agent[];
  nextCoPopulation: Agent[] | null;
  bestFitness: number;
  meanFitness: number;
  coBestFitness: number | null;
  bestAgent: Agent;
  coAgent: Agent | null;
} {
  const taskOffset =
    taskId === 'homeostasis' ? 0 : taskId === 'arena' ? 29 : taskId === 'bitstream' ? 53 : 71;
  // Epoch rotates smoothly every 8 generations so improvements consolidate across multi-regime anchors + unseen seeds
  const epochSeedA = 5100 + Math.floor(generation / 8) * 197 + taskOffset;
  const epochSeedB = 6101 + Math.floor(generation / 8) * 313 + taskOffset;
  const evalSeeds = [...BENCHMARK_ANCHOR_SEEDS, epochSeedA, epochSeedB];
  const rng = createRng((generation + 1) * 997 * 31 + taskOffset + 7);
  const popSize = population.length;
  const cycleCap = options.maxCycles ?? MAX_CYCLES_PER_TICK;

  let activeCoPop: Agent[] | null = null;
  if (options.dualCore) {
    if (options.coPopulation && options.coPopulation.length === popSize) {
      activeCoPop = options.coPopulation;
    } else {
      const coRng = createRng((generation + 1) * 1709 + 131);
      activeCoPop = Array.from({ length: popSize }, (_, idx) => ({
        id: idx,
        genome: createRandomGenome(coRng, bitWidth, { dualCore: true, isCoCore: true }),
        fitness: 0,
        generationBorn: generation,
      }));
    }
  }

  const prevBestCoGenome =
    activeCoPop && activeCoPop.length > 0 ? new Uint8Array(activeCoPop[0].genome) : null;

  const activeSlotsByAgent: number[][] = new Array(popSize);
  let sum = 0;

  for (let i = 0; i < popSize; i++) {
    const agent = population[i];
    let totalScore = 0;
    let lastModifiedCode: Uint8Array | null = null;
    let lastSmcCount = 0;
    const hitAccum = new Uint32Array(PROG_LEN);

    for (let s = 0; s < evalSeeds.length; s++) {
      const res = evaluateAgentDetailed(
        agent.genome,
        taskId,
        evalSeeds[s],
        bitWidth,
        36,
        {
          allowSmc: options.allowSmc,
          coGenome: prevBestCoGenome,
          maxCycles: cycleCap,
        }
      );
      totalScore += res.score;
      for (let k = 0; k < PROG_LEN; k++) {
        if (res.hitCounts[k] > 0) hitAccum[k] = 1;
      }
      if (s === evalSeeds.length - 1) {
        lastModifiedCode = res.modifiedCode;
        lastSmcCount = res.smcModifiedCount;
      }
    }

    const activeSlots: number[] = [];
    for (let k = 0; k < PROG_LEN; k++) {
      if (hitAccum[k] > 0) activeSlots.push(k);
    }
    activeSlotsByAgent[i] = activeSlots;

    agent.fitness = totalScore / evalSeeds.length;
    if (options.allowSmc && options.inheritSmc && lastModifiedCode && lastSmcCount > 0) {
      agent.genome = new Uint8Array(lastModifiedCode);
    }
    sum += agent.fitness;
  }

  const indexed = population.map((agent, origIdx) => ({
    agent,
    activeSlots: activeSlotsByAgent[origIdx],
  }));
  indexed.sort((a, b) => b.agent.fitness - a.agent.fitness);

  const bestAgent = indexed[0].agent;
  const meanFitness = sum / popSize;

  const eliteCount = Math.max(2, Math.floor(popSize * 0.1));
  const parentSpan = Math.max(4, Math.floor(popSize * 0.55));
  const freshImmigrants = Math.max(2, Math.floor(popSize * 0.08));
  const nextPopulation: Agent[] = [];
  const seenElites = new Set<string>();

  for (let i = 0; i < indexed.length && nextPopulation.length < eliteCount; i++) {
    const key = genomeDiversityKey(indexed[i].agent.genome);
    if (!seenElites.has(key)) {
      seenElites.add(key);
      nextPopulation.push({
        id: nextPopulation.length,
        genome: new Uint8Array(indexed[i].agent.genome),
        fitness: indexed[i].agent.fitness,
        generationBorn: indexed[i].agent.generationBorn,
      });
    }
  }

  for (let i = 0; i < freshImmigrants && nextPopulation.length < popSize; i++) {
    nextPopulation.push({
      id: nextPopulation.length,
      genome: createRandomGenome(rng, bitWidth, { dualCore: options.dualCore, isCoCore: false }),
      fitness: 0,
      generationBorn: generation + 1,
    });
  }

  while (nextPopulation.length < popSize) {
    const idx1 = Math.floor(Math.min(rng(), rng()) * parentSpan);
    const idx2 = Math.floor(Math.min(rng(), rng()) * parentSpan);
    const p1 = indexed[idx1];
    const p2 = indexed[idx2];
    const baseGenome =
      rng() < 0.55 ? crossoverGenomes(p1.agent.genome, p2.agent.genome, rng) : p1.agent.genome;
    const mutated = mutateGenome(baseGenome, mutationRate, rng, {
      bitWidth,
      dualCore: options.dualCore,
      isCoCore: false,
      activeSlots: p1.activeSlots,
      surgical: rng() < 0.68,
    });
    nextPopulation.push({
      id: nextPopulation.length,
      genome: mutated,
      fitness: 0,
      generationBorn: generation + 1,
    });
  }

  // Dedicated Co-Processor Population (Kern B) co-evolves against Kern A's best agent via BUS0..BUS7
  let nextCoPopulation: Agent[] | null = null;
  let coAgent: Agent | null = indexed.length > 1 ? indexed[1].agent : null;
  let coBestFitness: number | null = null;

  if (options.dualCore && activeCoPop) {
    const primaryChamp = new Uint8Array(bestAgent.genome);
    for (let j = 0; j < activeCoPop.length; j++) {
      const co = activeCoPop[j];
      let totalCoScore = 0;
      for (let s = 0; s < evalSeeds.length; s++) {
        totalCoScore += evaluateAgentDetailed(
          primaryChamp,
          taskId,
          evalSeeds[s],
          bitWidth,
          36,
          {
            allowSmc: options.allowSmc,
            coGenome: co.genome,
            maxCycles: cycleCap,
          }
        ).score;
      }
      co.fitness = totalCoScore / evalSeeds.length;
    }

    const sortedCo = [...activeCoPop].sort((a, b) => b.fitness - a.fitness);
    coAgent = sortedCo[0];
    coBestFitness = coAgent.fitness;
    nextCoPopulation = [];
    const seenCo = new Set<string>();

    for (let i = 0; i < sortedCo.length && nextCoPopulation.length < eliteCount; i++) {
      const key = genomeDiversityKey(sortedCo[i].genome);
      if (!seenCo.has(key)) {
        seenCo.add(key);
        nextCoPopulation.push({
          id: nextCoPopulation.length,
          genome: new Uint8Array(sortedCo[i].genome),
          fitness: sortedCo[i].fitness,
          generationBorn: sortedCo[i].generationBorn,
        });
      }
    }

    while (nextCoPopulation.length < popSize) {
      const p1 = sortedCo[Math.floor(Math.min(rng(), rng()) * parentSpan)];
      const p2 = sortedCo[Math.floor(Math.min(rng(), rng()) * parentSpan)];
      const baseGenome = rng() < 0.55 ? crossoverGenomes(p1.genome, p2.genome, rng) : p1.genome;
      const mutated = mutateGenome(baseGenome, mutationRate, rng, {
        bitWidth,
        dualCore: true,
        isCoCore: true,
        surgical: rng() < 0.65,
      });
      nextCoPopulation.push({
        id: nextCoPopulation.length,
        genome: mutated,
        fitness: 0,
        generationBorn: generation + 1,
      });
    }
  }

  return {
    nextPopulation,
    nextCoPopulation,
    bestFitness: bestAgent.fitness,
    meanFitness,
    coBestFitness,
    bestAgent,
    coAgent,
  };
}

export interface GeneralizationResult {
  seedsTested: number;
  agentMean: number;
  agentMin: number;
  agentMax: number;
  agentSurvivalRate: number;
  randomMean: number;
  delta: number;
  smcActiveSeeds: number;
  agentScores: number[];
  randomScores: number[];
}

export function runGeneralizationBenchmark(
  genome: Uint8Array,
  taskId: TaskId,
  bitWidth: BitWidth,
  allowSmc: boolean,
  coGenome: Uint8Array | null = null,
  seedsTested: number = 100,
  maxCycles: number = MAX_CYCLES_PER_TICK
): GeneralizationResult {
  const agentScores: number[] = [];
  const randomScores: number[] = [];
  const rng = createRng(88421);
  const randomPool = Array.from({ length: 16 }, () =>
    createRandomGenome(rng, bitWidth, { dualCore: Boolean(coGenome) })
  );

  let agentSum = 0;
  let agentMin = Infinity;
  let agentMax = -Infinity;
  let survived = 0;
  let smcActiveSeeds = 0;
  let randomSum = 0;

  for (let i = 0; i < seedsTested; i++) {
    const seed = 50001 + i * 37;
    const res = evaluateAgentDetailed(genome, taskId, seed, bitWidth, 36, {
      allowSmc,
      coGenome,
      maxCycles,
    });
    agentScores.push(res.score);
    agentSum += res.score;
    if (res.score < agentMin) agentMin = res.score;
    if (res.score > agentMax) agentMax = res.score;
    if (res.alive) survived++;
    if (res.smcModifiedCount > 0) smcActiveSeeds++;

    const rGenome = randomPool[i % randomPool.length];
    const rScore = evaluateAgent(rGenome, taskId, seed, bitWidth, 36, { allowSmc, maxCycles });
    randomScores.push(rScore);
    randomSum += rScore;
  }

  const agentMean = agentSum / seedsTested;
  const randomMean = randomSum / seedsTested;

  return {
    seedsTested,
    agentMean,
    agentMin,
    agentMax,
    agentSurvivalRate: (survived / seedsTested) * 100,
    randomMean,
    delta: agentMean - randomMean,
    smcActiveSeeds,
    agentScores,
    randomScores,
  };
}

export interface SmcAbResult {
  generations: number;
  smcSeries: Array<{ generation: number; best: number; mean: number }>;
  noSmcSeries: Array<{ generation: number; best: number; mean: number }>;
  smcValidationMean: number;
  noSmcValidationMean: number;
  smcModifiedOpcodes: number;
}

export function runSmcAbExperiment(
  taskId: TaskId,
  bitWidth: BitWidth,
  popSize: number = 48,
  generations: number = 40,
  mutationRate: number = 0.08,
  inheritSmc: boolean = false,
  maxCycles: number = MAX_CYCLES_PER_TICK
): SmcAbResult {
  const rng = createRng(91237);
  const initial: Agent[] = Array.from({ length: popSize }, (_, i) => ({
    id: i,
    genome: createRandomGenome(rng, bitWidth),
    fitness: 0,
    generationBorn: 0,
  }));

  let popSmc: Agent[] = initial.map((a) => ({ ...a, genome: new Uint8Array(a.genome) }));
  let popNoSmc: Agent[] = initial.map((a) => ({ ...a, genome: new Uint8Array(a.genome) }));

  const smcSeries: Array<{ generation: number; best: number; mean: number }> = [];
  const noSmcSeries: Array<{ generation: number; best: number; mean: number }> = [];

  let bestSmc: Uint8Array = popSmc[0].genome;
  let bestNoSmc: Uint8Array = popNoSmc[0].genome;

  for (let g = 0; g < generations; g++) {
    const rSmc = evolveGeneration(popSmc, taskId, g, mutationRate, bitWidth, {
      allowSmc: true,
      inheritSmc,
      maxCycles,
    });
    popSmc = rSmc.nextPopulation;
    bestSmc = rSmc.bestAgent.genome;
    smcSeries.push({ generation: g + 1, best: rSmc.bestFitness, mean: rSmc.meanFitness });

    const rNo = evolveGeneration(popNoSmc, taskId, g, mutationRate, bitWidth, {
      allowSmc: false,
      inheritSmc: false,
      maxCycles,
    });
    popNoSmc = rNo.nextPopulation;
    bestNoSmc = rNo.bestAgent.genome;
    noSmcSeries.push({ generation: g + 1, best: rNo.bestFitness, mean: rNo.meanFitness });
  }

  let valSmc = 0;
  let valNoSmc = 0;
  let totalModified = 0;
  const valSeeds = 50;
  for (let i = 0; i < valSeeds; i++) {
    const seed = 70001 + i * 41;
    const dSmc = evaluateAgentDetailed(bestSmc, taskId, seed, bitWidth, 36, {
      allowSmc: true,
      maxCycles,
    });
    valSmc += dSmc.score;
    totalModified += dSmc.smcModifiedCount;
    valNoSmc += evaluateAgent(bestNoSmc, taskId, seed, bitWidth, 36, {
      allowSmc: false,
      maxCycles,
    });
  }

  return {
    generations,
    smcSeries,
    noSmcSeries,
    smcValidationMean: valSmc / valSeeds,
    noSmcValidationMean: valNoSmc / valSeeds,
    smcModifiedOpcodes: Math.round((totalModified / valSeeds) * 10) / 10,
  };
}

// ==========================================
// NATIVE CODE GENERATORS (C99 / x86-64 / HEX)
// ==========================================

export function generateC99Code(
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

  return `/* SiliciumKern — Multi-Breedte (${bitWidth}-bit) Machinetaal Autonome AI (C99)
 * Taakprofiel: ${TASKS[taskId].name}
 * Scalar breedte: ${sw}-bit (${cType}) + 4x 128-bit SIMD XMM-vectoren + SMC (PREAD/PWRITE) + Shared Bus
 * Compileer lokaal (0 dependencies): gcc -O3 -march=native micro_ai.c -o micro_ai
 */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define PROG_LEN 32
#define RAM_WORDS 16
#define MAX_CYCLES ${maxCycles}
#define SCALAR_BITS ${sw}

typedef struct {
    ${cType} regs[8];
    int32_t xmm[4][4]; /* 128-bit SIMD vector registers XMM0..XMM3 */
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

static inline void silicium_init(SiliciumVM *vm) {
    memcpy(vm->active_code, GENOME, sizeof(GENOME));
    vm->code_ready = 1;
}

static inline ${cType} popcnt_fn(${uType} v) {
    ${cType} c = 0;
    while (v) { c += (v & 1u); v >>= 1; }
    return c;
}

static inline ${cType} bswap_fn(${uType} v) {
    ${uType} out = 0;
    for (int i = 0; i < (SCALAR_BITS / 8); i++) {
        out = (out << 8) | (v & 0xFFu);
        v >>= 8;
    }
    return (${cType})out;
}

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
            case 0x16: vm->regs[dst] = popcnt_fn((${uType})vm->regs[src]); break;
            case 0x17: vm->regs[dst] = bswap_fn((${uType})vm->regs[dst]); break;
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

int main(void) {
    SiliciumVM vm = {0};
    silicium_init(&vm);
    int32_t sample_ports[8] = {64, 48, 70, 9, 8, 1, 0, 1};
    int32_t action = silicium_tick(&vm, sample_ports);
    printf("SiliciumKern (${bitWidth}-bit) ACT output: %d\\n", action);
    return 0;
}
`;
}

export function generateNasmX64Code(
  genome: Uint8Array,
  taskId: TaskId,
  bitWidth: BitWidth = 32,
  maxCycles: number = MAX_CYCLES_PER_TICK
): string {
  const sw = scalarWidth(bitWidth);
  const regMap =
    sw === 16
      ? ['r8w', 'r9w', 'r10w', 'r11w', 'r12w', 'r13w', 'r14w', 'r15w']
      : sw === 64
        ? ['r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15']
        : ['r8d', 'r9d', 'r10d', 'r11d', 'r12d', 'r13d', 'r14d', 'r15d'];
  const axReg = sw === 16 ? 'ax' : sw === 64 ? 'rax' : 'eax';
  const cxReg = sw === 16 ? 'cx' : sw === 64 ? 'rcx' : 'ecx';
  const ptrSize = sw === 16 ? 'word' : sw === 64 ? 'qword' : 'dword';
  const wordStride = sw === 16 ? 2 : sw === 64 ? 8 : 4;

  const lines: string[] = [
    `; SiliciumKern — Directe x86-64 + SSE2 (128-bit XMM) NASM Assembly`,
    `; Taakprofiel: ${TASKS[taskId].name} | Bitbreedte-profiel: ${bitWidth}-bit`,
    `; Conventie (System V AMD64 ABI):`,
    `;   rdi = pointer naar int32_t ports[6]`,
    `;   rsi = pointer naar scratchpad RAM (16 woorden)`,
    `;   rdx = optionele pointer naar int32_t bus[8] (NULL => lokale stack-bus)`,
    `;   ebx = MAX_CYCLES (${maxCycles}) loop-teller (bescherming tegen oneindige JMP-lussen)`,
    `;   r8..r15 (${regMap[0]}..${regMap[7]}) = scalaire registers R0..R7`,
    `;   xmm0..xmm3 = echte 128-bit SIMD hardware-registers`,
    ``,
    `section .text`,
    `global silicium_think`,
    ``,
    `silicium_think:`,
    `    push rbx`,
    `    push rbp`,
    `    push r12`,
    `    push r13`,
    `    push r14`,
    `    push r15`,
    `    sub rsp, 40 ; 32B lokale bus[8] fallback + 16B stack alignment`,
    `    xor eax, eax`,
    `    mov [rsp], rax`,
    `    mov [rsp + 8], rax`,
    `    mov [rsp + 16], rax`,
    `    mov [rsp + 24], rax`,
    `    test rdx, rdx`,
    `    mov rbp, rsp`,
    `    cmovnz rbp, rdx`,
    `    mov ebx, ${maxCycles}`,
    `    xor r8d, r8d`,
    `    xor r9d, r9d`,
    `    xor r10d, r10d`,
    `    xor r11d, r11d`,
    `    xor r12d, r12d`,
    `    xor r13d, r13d`,
    `    xor r14d, r14d`,
    `    xor r15d, r15d`,
    `    pxor xmm0, xmm0`,
    `    pxor xmm1, xmm1`,
    `    pxor xmm2, xmm2`,
    `    pxor xmm3, xmm3`,
    ``,
  ];

  for (let i = 0; i < PROG_LEN; i++) {
    const inst = decodeInstruction(genome, i);
    const label = `.L${i.toString(16).padStart(2, '0').toUpperCase()}`;
    const rd = regMap[inst.dst];
    const rs = regMap[inst.src];
    const rd32 = `r${8 + inst.dst}d`;
    const rs32 = `r${8 + inst.src}d`;
    const xd = `xmm${inst.dst & 3}`;
    const xs = `xmm${inst.src & 3}`;
    const target = (((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

    lines.push(`${label}:`);
    lines.push(`    lea ebx, [rbx - 1] ; 1 cyclus verbruikt (laat ZF/CF/SF intact)`);
    switch (inst.opcode) {
      case Opcode.NOP: lines.push(`    nop`); break;
      case Opcode.MOVI: lines.push(`    mov ${rd}, ${inst.imm}`); break;
      case Opcode.MOV: lines.push(`    mov ${rd}, ${rs}`); break;
      case Opcode.SWAP: lines.push(`    xchg ${rd}, ${rs}`); break;
      case Opcode.ADD: lines.push(`    add ${rd}, ${rs}`); break;
      case Opcode.ADDI: lines.push(`    add ${rd}, ${inst.imm}`); break;
      case Opcode.SUB: lines.push(`    sub ${rd}, ${rs}`); break;
      case Opcode.MUL: lines.push(`    imul ${rd}, ${rs}`); break;
      case Opcode.DIV:
        lines.push(`    test ${rs}, ${rs}`);
        lines.push(`    jz .skip_div_${i}`);
        lines.push(`    mov ${axReg}, ${rd}`);
        lines.push(sw === 64 ? `    cqo` : sw === 16 ? `    cwd` : `    cdq`);
        lines.push(`    idiv ${rs}`);
        lines.push(`    mov ${rd}, ${axReg}`);
        lines.push(`.skip_div_${i}:`);
        break;
      case Opcode.MOD:
        lines.push(`    test ${rs}, ${rs}`);
        lines.push(`    jz .skip_mod_${i}`);
        lines.push(`    mov ${axReg}, ${rd}`);
        lines.push(sw === 64 ? `    cqo` : sw === 16 ? `    cwd` : `    cdq`);
        lines.push(`    idiv ${rs}`);
        lines.push(`    mov ${rd}, ${sw === 16 ? 'dx' : sw === 64 ? 'rdx' : 'edx'}`);
        lines.push(`.skip_mod_${i}:`);
        break;
      case Opcode.NEG: lines.push(`    neg ${rd}`); break;
      case Opcode.ABS:
        lines.push(`    mov ${axReg}, ${rd}`);
        lines.push(`    neg ${axReg}`);
        lines.push(`    test ${rd}, ${rd}`);
        lines.push(`    cmovs ${rd}, ${axReg}`);
        break;
      case Opcode.INC: lines.push(`    inc ${rd}`); break;
      case Opcode.DEC: lines.push(`    dec ${rd}`); break;
      case Opcode.AND: lines.push(`    and ${rd}, ${rs}`); break;
      case Opcode.OR: lines.push(`    or ${rd}, ${rs}`); break;
      case Opcode.XOR: lines.push(`    xor ${rd}, ${rs}`); break;
      case Opcode.NOT: lines.push(`    not ${rd}`); break;
      case Opcode.SHL: lines.push(`    shl ${rd}, ${inst.imm & 7}`); break;
      case Opcode.SHR: lines.push(`    sar ${rd}, ${inst.imm & 7}`); break;
      case Opcode.ROL: lines.push(`    rol ${rd}, ${inst.imm & 7}`); break;
      case Opcode.ROR: lines.push(`    ror ${rd}, ${inst.imm & 7}`); break;
      case Opcode.POPCNT:
        lines.push(`    popcnt ${rd}, ${rs}`);
        break;
      case Opcode.BSWAP:
        if (sw === 16) lines.push(`    rol ${rd}, 8`);
        else lines.push(`    bswap ${rd}`);
        break;
      case Opcode.CMP: lines.push(`    cmp ${rd}, ${rs}`); break;
      case Opcode.TEST: lines.push(`    test ${rd}, ${rs}`); break;
      case Opcode.JMP:
        lines.push(`    test ebx, ebx`);
        lines.push(`    jle .timeout_done`);
        lines.push(`    jmp .L${target}`);
        break;
      case Opcode.JZ:
        lines.push(`    jne .no_jz_${i}`);
        lines.push(`    test ebx, ebx`);
        lines.push(`    jle .timeout_done`);
        lines.push(`    jmp .L${target}`);
        lines.push(`.no_jz_${i}:`);
        break;
      case Opcode.JNZ:
        lines.push(`    je .no_jnz_${i}`);
        lines.push(`    test ebx, ebx`);
        lines.push(`    jle .timeout_done`);
        lines.push(`    jmp .L${target}`);
        lines.push(`.no_jnz_${i}:`);
        break;
      case Opcode.JLT:
        lines.push(`    jge .no_jlt_${i}`);
        lines.push(`    test ebx, ebx`);
        lines.push(`    jle .timeout_done`);
        lines.push(`    jmp .L${target}`);
        lines.push(`.no_jlt_${i}:`);
        break;
      case Opcode.LOAD:
        lines.push(`    mov ${cxReg}, ${rs}`);
        lines.push(`    and ecx, 15`);
        lines.push(`    mov ${rd}, ${ptrSize} [rsi + rcx*${wordStride}]`);
        break;
      case Opcode.STORE:
        lines.push(`    mov ${cxReg}, ${rd}`);
        lines.push(`    and ecx, 15`);
        lines.push(`    mov ${ptrSize} [rsi + rcx*${wordStride}], ${rs}`);
        break;
      case Opcode.CMOVLT:
        lines.push(`    cmovl ${rd}, ${rs}`);
        break;
      case Opcode.VLOAD:
        lines.push(`    movdqu ${xd}, [rsi] ; 128-bit load`);
        break;
      case Opcode.VSTORE:
        lines.push(`    movdqu [rsi], ${xs} ; 128-bit store`);
        break;
      case Opcode.VADD:
        lines.push(`    paddd ${xd}, ${xs} ; 4x 32-bit parallel add`);
        break;
      case Opcode.VXOR:
        lines.push(`    pxor ${xd}, ${xs} ; 128-bit XOR`);
        break;
      case Opcode.VSUM:
        lines.push(`    movdqu xmm4, ${xs}`);
        lines.push(`    phaddd xmm4, xmm4`);
        lines.push(`    phaddd xmm4, xmm4`);
        lines.push(`    movd eax, xmm4`);
        lines.push(`    mov ${rd}, ${axReg}`);
        break;
      case Opcode.SENSE:
        if (sw === 16) {
          lines.push(`    mov eax, dword [rdi + ${(inst.src & 7) * 4}]`);
          lines.push(`    mov ${rd}, ax`);
        } else if (sw === 64) {
          lines.push(`    movsxd ${rd}, dword [rdi + ${(inst.src & 7) * 4}]`);
        } else {
          lines.push(`    mov ${rd}, dword [rdi + ${(inst.src & 7) * 4}]`);
        }
        break;
      case Opcode.ACT:
        if (sw === 16) lines.push(`    movsx eax, ${rs}`);
        else lines.push(`    mov eax, ${rs32}`);
        lines.push(`    jmp .done`);
        break;
      case Opcode.BWRITE:
        lines.push(`    mov ecx, ${rd32}`);
        lines.push(`    and ecx, 7`);
        if (sw === 16) {
          lines.push(`    movsx eax, ${rs}`);
          lines.push(`    mov dword [rbp + rcx*4], eax`);
        } else {
          lines.push(`    mov dword [rbp + rcx*4], ${rs32}`);
        }
        break;
      case Opcode.BREAD:
        lines.push(`    mov ecx, ${rs32}`);
        lines.push(`    and ecx, 7`);
        if (sw === 16) {
          lines.push(`    mov eax, dword [rbp + rcx*4]`);
          lines.push(`    mov ${rd}, ax`);
        } else if (sw === 64) {
          lines.push(`    movsxd ${rd}, dword [rbp + rcx*4]`);
        } else {
          lines.push(`    mov ${rd}, dword [rbp + rcx*4]`);
        }
        break;
      case Opcode.PREAD:
      case Opcode.PWRITE:
        lines.push(`    nop ; ${disassembleInstruction(inst)} (.text is W^X; zie C99 export voor SMC)`);
        break;
    }
  }

  lines.push(``);
  lines.push(`.timeout_done:`);
  lines.push(`    mov eax, r8d`);
  lines.push(`.done:`);
  lines.push(`    add rsp, 40`);
  lines.push(`    pop r15`);
  lines.push(`    pop r14`);
  lines.push(`    pop r13`);
  lines.push(`    pop r12`);
  lines.push(`    pop rbp`);
  lines.push(`    pop rbx`);
  lines.push(`    ret`);

  return lines.join('\n');
}

export function generateHexDump(genome: Uint8Array): string {
  const rows: string[] = [];
  for (let i = 0; i < PROG_LEN; i += 4) {
    const addr = (i * 4).toString(16).padStart(4, '0').toUpperCase();
    const bytes: string[] = [];
    for (let j = 0; j < 16; j++) {
      bytes.push(genome[i * 4 + j].toString(16).padStart(2, '0').toUpperCase());
    }
    rows.push(`0x${addr}:  ${bytes.slice(0, 8).join(' ')}  ${bytes.slice(8, 16).join(' ')}`);
  }
  return rows.join('\n');
}

export function generateStandaloneTrainerC99(
  genome: Uint8Array,
  taskId: TaskId,
  bitWidth: BitWidth = 32,
  maxCycles: number = MAX_CYCLES_PER_TICK,
  popSize: number = 64
): string {
  const sw = scalarWidth(bitWidth);
  const cType = sw === 16 ? 'int16_t' : sw === 64 ? 'int64_t' : 'int32_t';
  const hexBytes = Array.from(genome)
    .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
    .join(', ');

  const evalFnC =
    taskId === 'arena'
      ? `static double eval_task(const uint8_t *g, uint32_t seed) {
    rng_state = seed ? seed : 1;
    SiliciumVM vm = {0};
    memcpy(vm.active_code, g, PROG_LEN * 4);
    int nx[4], ny[4], hx[5], hy[5];
    for (int i = 0; i < 4; i++) { nx[i] = (int)(xorshift32() & 15); ny[i] = (int)(xorshift32() & 15); }
    for (int i = 0; i < 5; i++) { hx[i] = (int)(xorshift32() & 15); hy[i] = (int)(xorshift32() & 15); }
    int ax = 8, ay = 8;
    double energy = 82.0, score = 0.0;

    for (int t = 0; t < TICKS; t++) {
        int bnd = 999, bx = nx[0], by = ny[0], bhd = 999, bhx = hx[0], bhy = hy[0];
        for (int i = 0; i < 4; i++) { int d = (ax>nx[i]?ax-nx[i]:nx[i]-ax)+(ay>ny[i]?ay-ny[i]:ny[i]-ay); if (d<bnd) { bnd=d; bx=nx[i]; by=ny[i]; } }
        for (int i = 0; i < 5; i++) { int d = (ax>hx[i]?ax-hx[i]:hx[i]-ax)+(ay>hy[i]?ay-hy[i]:hy[i]-ay); if (d<bhd) { bhd=d; bhx=hx[i]; bhy=hy[i]; } }
        int32_t ports[8] = {bx - ax, by - ay, bhx - ax, bhy - ay, (int32_t)energy, bnd, 0, t & 0xFF};
        int acted = 0;
        int32_t raw = vm_tick(&vm, ports, &acted);
        int act = ((raw % 4) + 4) % 4;
        score += acted ? 0.5 : -2.0;

        if (act == 0) ay--; else if (act == 1) ax++; else if (act == 2) ay++; else ax--;
        if (ax < 0) { ax = 0; score -= 3.5; } else if (ax > 15) { ax = 15; score -= 3.5; }
        if (ay < 0) { ay = 0; score -= 3.5; } else if (ay > 15) { ay = 15; score -= 3.5; }
        energy -= 1.2;

        int newd = 999;
        for (int i = 0; i < 4; i++) {
            if (nx[i] == ax && ny[i] == ay) {
                score += 30.0; energy = energy + 25.0 > 100.0 ? 100.0 : energy + 25.0;
                nx[i] = (int)(xorshift32() & 15); ny[i] = (int)(xorshift32() & 15);
            }
            int d = (ax>nx[i]?ax-nx[i]:nx[i]-ax)+(ay>ny[i]?ay-ny[i]:ny[i]-ay);
            if (d < newd) newd = d;
        }
        score += (bnd - newd) * 2.5 + (newd < 14 ? (14 - newd) * 0.45 : 0.0);
        for (int i = 0; i < 5; i++) if (hx[i] == ax && hy[i] == ay) { energy -= 22.0; score -= 18.0; }
        if (energy <= 0.0) { score -= 25.0; break; }
    }
    return score;
}`
      : taskId === 'bitstream'
        ? `static double eval_task(const uint8_t *g, uint32_t seed) {
    rng_state = seed ? seed : 1;
    SiliciumVM vm = {0};
    memcpy(vm.active_code, g, PROG_LEN * 4);
    int cur = (int)(xorshift32() & 15), prev = (int)(xorshift32() & 15), pred = 0, last_err = 0;
    double score = 0.0;

    for (int t = 0; t < TICKS; t++) {
        int c = cur, hw = 0; while (c) { hw += (c & 1); c >>= 1; }
        int32_t ports[8] = {cur, prev, t & 1, hw, last_err, pred, (cur ^ prev) & 15, t & 0xFF};
        int acted = 0;
        int32_t raw = vm_tick(&vm, ports, &acted);
        pred = raw & 15;
        score += acted ? 0.5 : -2.0;
        int target = (cur ^ (prev >> 1)) & 15;
        int x = pred ^ target, err = 0;
        while (x) { err += (x & 1); x >>= 1; }
        last_err = err;
        score += (4 - err) * 4.0 + (pred == target ? 10.0 : 0.0);
        prev = cur;
        cur = (int)(xorshift32() & 15);
    }
    return score;
}`
        : taskId === 'hardware'
          ? `static double eval_task(const uint8_t *g, uint32_t seed) {
    rng_state = seed ? seed : 1;
    SiliciumVM vm = {0};
    memcpy(vm.active_code, g, PROG_LEN * 4);
    int streamA = (int)(xorshift32() & 63), prevA = streamA, streamB = (int)(xorshift32() & 31), pred = 0;
    double score = 0.0;

    for (int t = 0; t < TICKS; t++) {
        int dP0 = streamA - prevA;
        int inw = (streamA ^ streamB) & 0xFF;
        int32_t ports[8] = {streamA, streamB, inw, 0, dP0, pred, (streamA ^ streamB ^ inw) & 0xFF, t & 0xFF};
        int acted = 0;
        int32_t raw = vm_tick(&vm, ports, &acted);
        pred = raw & 15;
        score += acted ? 0.5 : -2.0;
        int target = ((streamA ^ streamB) + (dP0 >> 1)) & 15;
        int x = pred ^ target, err = 0;
        while (x) { err += (x & 1); x >>= 1; }
        score += (4 - err) * 4.0 + (pred == target ? 10.0 : 0.0);
        prevA = streamA;
        streamA = (int)((streamA + 7 + (xorshift32() & 15)) & 63);
        streamB = (int)(xorshift32() & 31);
    }
    return score;
}`
          : `static double eval_task(const uint8_t *g, uint32_t seed) {
    rng_state = seed ? seed : 1;
    SiliciumVM vm = {0};
    memcpy(vm.active_code, g, PROG_LEN * 4);
    static const double T0[4] = {48.0, 80.0, 40.0, 62.0};
    static const double Q0[4] = {32.0, 25.0, 76.0, 45.0};
    static const double E0[4] = {82.0, 70.0, 88.0, 22.0};
    uint32_t idx = seed & 3u;
    double temp = T0[idx], queue = Q0[idx], energy = E0[idx], score = 0.0;
    int32_t last_act = 1;

    for (int t = 0; t < TICKS; t++) {
        int32_t ports[8] = {(int32_t)temp, (int32_t)queue, (int32_t)energy,
                            (int32_t)(temp - 55.0), (int32_t)(queue - 40.0), last_act, 0, t & 0xFF};
        int acted = 0;
        int32_t raw = vm_tick(&vm, ports, &acted);
        int act = ((raw % 4) + 4) % 4;
        last_act = act;
        score += acted ? 0.5 : -2.0;

        int load = 4 + (int)(xorshift32() % 6) + (t % 9 == 0 ? 15 : 0);
        if (act == 0)      { temp -= 5.0; energy += 8.0; queue += load; }
        else if (act == 1) { temp += 2.0; energy -= 3.0; queue += load - 7; }
        else if (act == 2) { temp += 7.0; energy -= 7.5; queue += load - 16; }
        else               { temp -= 10.0; energy -= 4.5; queue += load - 2; }

        temp += (32.0 - temp) * 0.04;
        if (temp < 15.0) temp = 15.0; if (temp > 105.0) temp = 105.0;
        if (queue < 0.0) queue = 0.0; if (queue > 100.0) queue = 100.0;
        if (energy < 0.0) energy = 0.0; if (energy > 100.0) energy = 100.0;

        if (temp >= 96.0 || energy <= 3.0) { score -= 50.0; break; }
        double ts = 12.0 - ((temp > 52.0 ? temp - 52.0 : 52.0 - temp) * 0.45);
        double qs = 10.0 - queue * 0.22;
        score += (ts > 0 ? ts : 0) + (qs > 0 ? qs : 0) + (energy > 25.0 ? 6.0 : -8.0);
    }
    return score;
}`;

  return `/* SiliciumKern — Volledige Losse C99 Evolutie-Trainer + VM (${bitWidth}-bit)
 * Taakprofiel: ${TASKS[taskId].name}
 * Bevat alle 44 opcodes (16/32/64-bit + 128-bit SIMD XMM0..XMM3 + SMC PREAD/PWRITE + Bus)
 * Evalueert met 4 anker-regimes + epoche-seeds.
 * Compileer: gcc -O3 -march=native silicium_trainer.c -o silicium_trainer && ./silicium_trainer
 */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define PROG_LEN   32
#define RAM_WORDS  16
#define MAX_CYCLES ${maxCycles}
#define POP_SIZE   ${popSize}
#define TICKS      36
#define GENS       200
#define SCALAR_BITS ${sw}

typedef struct {
    ${cType} regs[8];
    int32_t xmm[4][4];
    ${cType} ram[RAM_WORDS];
    uint8_t active_code[PROG_LEN * 4];
    int32_t bus[8];
    uint8_t ip, zf, cf, sf;
    int32_t out;
} SiliciumVM;

typedef struct {
    uint8_t genome[PROG_LEN * 4];
    double fitness;
} Agent;

static uint32_t rng_state = 0x13572468u;
static uint32_t xorshift32(void) {
    uint32_t x = rng_state;
    x ^= x << 13; x ^= x >> 17; x ^= x << 5;
    rng_state = x;
    return x;
}
static double rand_unit(void) { return (double)xorshift32() / 4294967296.0; }

static const uint8_t SEED_GENOME[PROG_LEN * 4] = {
    ${hexBytes}
};

static int32_t vm_tick(SiliciumVM *vm, const int32_t ports[8], int *acted) {
    vm->ip = 0;
    *acted = 0;
    for (int c = 0; c < MAX_CYCLES; c++) {
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
            case 0x08: if (vm->regs[src]) vm->regs[dst] /= vm->regs[src]; break;
            case 0x09: if (vm->regs[src]) vm->regs[dst] %= vm->regs[src]; break;
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
                uint64_t mask = (SCALAR_BITS == 16) ? 0xFFFFull : (SCALAR_BITS == 64 ? ~0ull : 0xFFFFFFFFull);
                uint64_t u = ((uint64_t)vm->regs[dst]) & mask;
                uint8_t sh = (uint8_t)(imm & 7);
                vm->regs[dst] = (${cType})(((u << sh) | (u >> (SCALAR_BITS - sh))) & mask);
                break;
            }
            case 0x15: {
                uint64_t mask = (SCALAR_BITS == 16) ? 0xFFFFull : (SCALAR_BITS == 64 ? ~0ull : 0xFFFFFFFFull);
                uint64_t u = ((uint64_t)vm->regs[dst]) & mask;
                uint8_t sh = (uint8_t)(imm & 7);
                vm->regs[dst] = (${cType})(((u >> sh) | (u << (SCALAR_BITS - sh))) & mask);
                break;
            }
            case 0x16: {
                uint64_t mask = (SCALAR_BITS == 16) ? 0xFFFFull : (SCALAR_BITS == 64 ? ~0ull : 0xFFFFFFFFull);
                uint64_t u = ((uint64_t)vm->regs[src]) & mask;
                ${cType} pc = 0;
                while (u) { pc += (u & 1ull); u >>= 1; }
                vm->regs[dst] = pc;
                break;
            }
            case 0x17: {
                uint64_t u = (uint64_t)vm->regs[dst], out = 0;
                for (int i = 0; i < (SCALAR_BITS / 8); i++) { out = (out << 8) | (u & 0xFFull); u >>= 8; }
                vm->regs[dst] = (${cType})out;
                break;
            }
            case 0x18: vm->zf = (vm->regs[dst] == vm->regs[src]); vm->cf = (vm->regs[dst] < vm->regs[src]); vm->sf = vm->cf; break;
            case 0x19: { ${cType} m = (vm->regs[dst] & vm->regs[src]); vm->zf = (m == 0); vm->cf = 0; vm->sf = (m < 0); break; }
            case 0x1A: vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; break;
            case 0x1B: if (vm->zf)           { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1C: if (!vm->zf)          { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1D: if (vm->cf || vm->sf) { vm->ip = ((imm % PROG_LEN) + PROG_LEN) % PROG_LEN; jumped = 1; } break;
            case 0x1E: vm->regs[dst] = vm->ram[vm->regs[src] & 15]; break;
            case 0x1F: vm->ram[vm->regs[dst] & 15] = vm->regs[src]; break;
            case 0x20: if (vm->cf || vm->sf) vm->regs[dst] = vm->regs[src]; break;
            case 0x21: { int b = (int)(vm->regs[src] & 15); for (int l=0;l<4;l++) vm->xmm[dst&3][l] = (int32_t)vm->ram[(b+l)&15]; break; }
            case 0x22: { int b = (int)(vm->regs[dst] & 15); for (int l=0;l<4;l++) vm->ram[(b+l)&15] = (${cType})vm->xmm[src&3][l]; break; }
            case 0x23: for (int l=0;l<4;l++) vm->xmm[dst&3][l] += vm->xmm[src&3][l]; break;
            case 0x24: for (int l=0;l<4;l++) vm->xmm[dst&3][l] ^= vm->xmm[src&3][l]; break;
            case 0x25: { ${cType} s=0; for (int l=0;l<4;l++) s += (${cType})vm->xmm[src&3][l]; vm->regs[dst]=s; break; }
            case 0x26: vm->regs[dst] = (${cType})ports[src & 7]; break;
            case 0x27: vm->out = (int32_t)vm->regs[src]; *acted = 1; return vm->out;
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
    vm->out = (int32_t)vm->regs[0];
    return vm->out;
}

${evalFnC}

int main(void) {
    Agent pop[POP_SIZE];
    Agent next_pop[POP_SIZE];
    static const uint32_t ANCHORS[3] = {1013u, 2029u, 3049u};
    memcpy(pop[0].genome, SEED_GENOME, PROG_LEN * 4);
    for (int i = 1; i < POP_SIZE; i++) {
        memcpy(pop[i].genome, SEED_GENOME, PROG_LEN * 4);
        for (int b = 0; b < PROG_LEN * 4; b++) {
            if (rand_unit() < 0.15) pop[i].genome[b] = (uint8_t)(xorshift32() & 0xFF);
        }
    }

    for (int gen = 1; gen <= GENS; gen++) {
        uint32_t rot_seed = (uint32_t)(gen * 997 + 11);
        for (int i = 0; i < POP_SIZE; i++) {
            double total = eval_task(pop[i].genome, rot_seed);
            for (int a = 0; a < 3; a++) total += eval_task(pop[i].genome, ANCHORS[a]);
            pop[i].fitness = total / 4.0;
        }
        for (int i = 0; i < POP_SIZE - 1; i++) {
            for (int j = i + 1; j < POP_SIZE; j++) {
                if (pop[j].fitness > pop[i].fitness) { Agent tmp = pop[i]; pop[i] = pop[j]; pop[j] = tmp; }
            }
        }
        if (gen == 1 || gen % 20 == 0 || gen == GENS) printf("Gen %3d | Beste fitness (4-seed gem): %7.2f\\n", gen, pop[0].fitness);
        int elite = POP_SIZE / 8;
        for (int i = 0; i < elite; i++) next_pop[i] = pop[i];
        int pool = POP_SIZE / 3;
        for (int i = elite; i < POP_SIZE; i++) {
            const Agent *p = &pop[xorshift32() % pool];
            next_pop[i] = *p;
            for (int inst = 0; inst < PROG_LEN; inst++) {
                if (rand_unit() < 0.08) next_pop[i].genome[inst * 4 + (xorshift32() & 3)] = (uint8_t)(xorshift32() & 0xFF);
            }
        }
        memcpy(pop, next_pop, sizeof(pop));
    }
    printf("\\nGeëvolueerde 128-byte kernel (hex):\\n");
    for (int i = 0; i < PROG_LEN * 4; i++) printf("%02X%s", pop[0].genome[i], (i % 16 == 15) ? "\\n" : " ");
    return 0;
}
`;
}
