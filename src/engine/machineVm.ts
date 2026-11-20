export const PROG_LEN = 64; // 64 instructions * 4 bytes = 256 bytes
export const RAM_WORDS = 32; // 32 * 8 bytes = 256 bytes L1 scratchpad RAM
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
  // === MMX (Pentium MMX, 1997) — SIMD integer op mm0-mm7 ===
  PADDSB = 0x2c,
  PADDSW = 0x2d,
  PADDUSB = 0x2e,
  PADDUSW = 0x2f,
  PADDD = 0x30,
  PADDQ = 0x31,
  PSUBB = 0x32,
  PSUBW = 0x33,
  PSUBSB = 0x34,
  PSUBSW = 0x35,
  PSUBUSB = 0x36,
  PSUBUSW = 0x37,
  PSUBD = 0x38,
  PSUBQ = 0x39,
  PMULLW = 0x3a,
  PMULHW = 0x3b,
  PMULHWS = 0x3c,
  PMULUDQ = 0x3d,
  PSLLW = 0x3e,
  PSLLD = 0x3f,
  PSLLQ = 0x40,
  PSRLW = 0x41,
  PSRLD = 0x42,
  PSRLQ = 0x43,
  PSRAW = 0x44,
  PSRAD = 0x45,
  PCMPEQB = 0x46,
  PCMPEQW = 0x47,
  PCMPEQD = 0x48,
  PACKSSWB = 0x49,
  PACKUSWB = 0x4a,
  PACKSSDW = 0x4b,
  PUNPCKHBW = 0x4c,
  PUNPCKHWD = 0x4d,
  PUNPCKHDQ = 0x4e,
  PUNPCKLHBW = 0x4f,
  PUNPCKLWD = 0x50,
  PUNPCKLDQ = 0x51,
  PAND = 0x52,
  PANDN = 0x53,
  POR = 0x54,
  PXOR = 0x55,
  MOVQ = 0x56,
  EMMS = 0x57,
  // === SSE (Pentium III, 1999) — SIMD floating-point op xmm0-xmm7 ===
  ADDSS = 0x58,
  ADDPS = 0x59,
  MULSS = 0x5a,
  MULPS = 0x5b,
  SUBSS = 0x5c,
  SUBPS = 0x5d,
  DIVSS = 0x5e,
  DIVPS = 0x5f,
  MINSS = 0x60,
  MINPS = 0x61,
  MAXSS = 0x62,
  MAXPS = 0x63,
  SQRTSS = 0x64,
  SQRTPS = 0x65,
  CMPSS = 0x66,
  CMPPS = 0x67,
  MOVSS = 0x68,
  MOVPS = 0x69,
  MOVAPS = 0x6a,
  MOVUPS = 0x6b,
  MOVHLPS = 0x6c,
  MOVLHPS = 0x6d,
  MOVMSKPS = 0x6e,
  SHUFPS = 0x6f,
  UNPCKLPS = 0x70,
  UNPCKHPS = 0x71,
  CVTSS2SI = 0x72,
  CVTSI2SS = 0x73,
  CVTSS2SD = 0x74,
  CVTSD2SS = 0x75,
  // === SSE2 (Pentium 4, 2000) — SIMD integer+FP op xmm ===
  MOVDQA = 0x76,
  MOVDQU = 0x77,
  MOVDDUP = 0x78,
  MOVSHDUP = 0x79,
  MOVSLDUP = 0x7a,
  PADDSB2 = 0x7b,
  PADDSW2 = 0x7c,
  PADDUSB2 = 0x7d,
  PADDUSW2 = 0x7e,
  PADDD2 = 0x7f,
  PADDQ2 = 0x80,
  PSUBB2 = 0x81,
  PSUBW2 = 0x82,
  PSUBSB2 = 0x83,
  PSUBSW2 = 0x84,
  PSUBUSB2 = 0x85,
  PSUBUSW2 = 0x86,
  PSUBD2 = 0x87,
  PSUBQ2 = 0x88,
  PMULLW2 = 0x89,
  PMULHW2 = 0x8a,
  PMULUDQ2 = 0x8b,
  PSLLW2 = 0x8c,
  PSLLD2 = 0x8d,
  PSLLQ2 = 0x8e,
  PSRLW2 = 0x8f,
  PSRLD2 = 0x90,
  PSRLQ2 = 0x91,
  PSRAW2 = 0x92,
  PSRAD2 = 0x93,
  PCMPEQB2 = 0x94,
  PCMPEQW2 = 0x95,
  PCMPEQD2 = 0x96,
  PACKSSWB2 = 0x97,
  PACKUSWB2 = 0x98,
  PACKSSDW2 = 0x99,
  PUNPCKHBW2 = 0x9a,
  PUNPCKHWD2 = 0x9b,
  PUNPCKHDQ2 = 0x9c,
  PUNPCKLHBW2 = 0x9d,
  PUNPCKLWD2 = 0x9e,
  PUNPCKLDQ2 = 0x9f,
  PAND2 = 0xa0,
  PANDN2 = 0xa1,
  POR2 = 0xa2,
  PXOR2 = 0xa3,
  PMINSW = 0xa4,
  PMAXSW = 0xa5,
  PMINUB = 0xa6,
  PMAXUB = 0xa7,
  PMINSW2 = 0xa8,
  PMAXSW2 = 0xa9,
  PAVGB = 0xaa,
  PAVGW = 0xab,
  MOVMSKDQ = 0xac,
  CVTDQ2PS = 0xad,
  CVTPS2DQ = 0xae,
  CVTDQ2PD = 0xaf,
  CVTPD2DQ = 0xb0,
  ADDPD = 0xb1,
  MULPD = 0xb2,
  SUBPD = 0xb3,
  DIVPD = 0xb4,
  MINPD = 0xb5,
  MAXPD = 0xb6,
  SQRTPD = 0xb7,
  CMPPD = 0xb8,
  MOVAPD = 0xb9,
  MOVUPD = 0xba,
  MOVSD = 0xbb,
  MOVHPD = 0xbc,
  MOVLPD = 0xbd,
  UNPCKLPD = 0xbe,
  UNPCKHPD = 0xbf,
  CVTSI2SD = 0xc0,
  CVTSD2SI = 0xc1,
  CVTSS2SI2 = 0xc2,
  CVTSI2SS2 = 0xc3,
  ADDSUBPS = 0xc4,
  ADDSUBPD = 0xc5,
  HADDPS = 0xc6,
  HSUBPS = 0xc7,
  HADDPD = 0xc8,
  HSUBPD = 0xc9,
  LDDQU = 0xca,
  MOVNTDQ = 0xcb,
  // === SSE3 (Pentium 4 HT, 2004) ===
  FADDSS = 0xcc,
  FMULSS = 0xcd,
  MONITOR = 0xce,
  MWAIT = 0xcf,
  // === Extra SIMD voor evolutie ===
  VSUB = 0xd0,
  VMUL = 0xd1,
  VDIV = 0xd2,
  VMIN = 0xd3,
  VMAX = 0xd4,
  VAND = 0xd5,
  VOR = 0xd6,
  VSHUFFLE = 0xd7,
  VUNPCKH = 0xd8,
  VUNPCKL = 0xd9,
  VMOVMSK = 0xda,
  VMOV = 0xdb,
  VMOVHL = 0xdc,
  VMOVLH = 0xdd,
  VCMPEQ = 0xde,
  VCMPLT = 0xdf,
  VCMPLE = 0xe0,
  VABS = 0xe1,
  VNEG = 0xe2,
  VSQRT = 0xe3,
  VRSQRT = 0xe4,
  VRCPPS = 0xe5,
  VEXTRACT = 0xe6,
  VINSERT = 0xe7,
  VBLEND = 0xe8,
  VPERM = 0xe9,
  VSHL = 0xea,
  VSHR = 0xeb,
  VROL = 0xec,
  VROR = 0xed,
  VPOPCNT = 0xee,
  VBSWAP = 0xef,
  // === Extra flow & memory ===
  JGE = 0xf0,
  JLE = 0xf1,
  JG = 0xf2,
  CALL = 0xf3,
  RET = 0xf4,
  PUSH = 0xf5,
  POP = 0xf6,
  CMOVE = 0xf7,
  CMOVNE = 0xf8,
  CMOVGE = 0xf9,
  CMOVLE = 0xfa,
  CMOVG = 0xfb,
  // === Extra ALU ===
  IMUL = 0xfc,
  SAL = 0xfd,
  SAR = 0xfe,
  SETC = 0xff,
}

export const OPCODE_COUNT = 256;

export type OpcodeCategory = 'data' | 'alu' | 'bit' | 'flow' | 'mem' | 'simd' | 'simd_mmx' | 'simd_sse' | 'simd_sse2' | 'simd_sse3' | 'io' | 'smc';

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
  // === MMX (Pentium MMX, 1997) ===
  { code: Opcode.PADDSB, mnemonic: 'PADDSB', category: 'simd_mmx', syntax: 'PADDSB Xd, Xs', description: 'MMX: signed byte saturating add over 128-bit vector.' },
  { code: Opcode.PADDSW, mnemonic: 'PADDSW', category: 'simd_mmx', syntax: 'PADDSW Xd, Xs', description: 'MMX: signed word saturating add over 128-bit vector.' },
  { code: Opcode.PADDUSB, mnemonic: 'PADDUSB', category: 'simd_mmx', syntax: 'PADDUSB Xd, Xs', description: 'MMX: unsigned byte saturating add.' },
  { code: Opcode.PADDUSW, mnemonic: 'PADDUSW', category: 'simd_mmx', syntax: 'PADDUSW Xd, Xs', description: 'MMX: unsigned word saturating add.' },
  { code: Opcode.PADDD, mnemonic: 'PADDD', category: 'simd_mmx', syntax: 'PADDD Xd, Xs', description: 'MMX: parallel 32-bit integer add (4 lanes).' },
  { code: Opcode.PADDQ, mnemonic: 'PADDQ', category: 'simd_mmx', syntax: 'PADDQ Xd, Xs', description: 'MMX: parallel 64-bit integer add (2 lanes).' },
  { code: Opcode.PSUBB, mnemonic: 'PSUBB', category: 'simd_mmx', syntax: 'PSUBB Xd, Xs', description: 'MMX: parallel byte subtract.' },
  { code: Opcode.PSUBW, mnemonic: 'PSUBW', category: 'simd_mmx', syntax: 'PSUBW Xd, Xs', description: 'MMX: parallel word subtract.' },
  { code: Opcode.PSUBSB, mnemonic: 'PSUBSB', category: 'simd_mmx', syntax: 'PSUBSB Xd, Xs', description: 'MMX: signed byte saturating subtract.' },
  { code: Opcode.PSUBSW, mnemonic: 'PSUBSW', category: 'simd_mmx', syntax: 'PSUBSW Xd, Xs', description: 'MMX: signed word saturating subtract.' },
  { code: Opcode.PSUBUSB, mnemonic: 'PSUBUSB', category: 'simd_mmx', syntax: 'PSUBUSB Xd, Xs', description: 'MMX: unsigned byte saturating subtract.' },
  { code: Opcode.PSUBUSW, mnemonic: 'PSUBUSW', category: 'simd_mmx', syntax: 'PSUBUSW Xd, Xs', description: 'MMX: unsigned word saturating subtract.' },
  { code: Opcode.PSUBD, mnemonic: 'PSUBD', category: 'simd_mmx', syntax: 'PSUBD Xd, Xs', description: 'MMX: parallel 32-bit subtract.' },
  { code: Opcode.PSUBQ, mnemonic: 'PSUBQ', category: 'simd_mmx', syntax: 'PSUBQ Xd, Xs', description: 'MMX: parallel 64-bit subtract.' },
  { code: Opcode.PMULLW, mnemonic: 'PMULLW', category: 'simd_mmx', syntax: 'PMULLW Xd, Xs', description: 'MMX: parallel low word multiply (8×16→16).' },
  { code: Opcode.PMULHW, mnemonic: 'PMULHW', category: 'simd_mmx', syntax: 'PMULHW Xd, Xs', description: 'MMX: parallel high word multiply (8×16→16 signed).' },
  { code: Opcode.PMULHWS, mnemonic: 'PMULHWS', category: 'simd_mmx', syntax: 'PMULHWS Xd, Xs', description: 'MMX: parallel high word multiply with rounding.' },
  { code: Opcode.PMULUDQ, mnemonic: 'PMULUDQ', category: 'simd_mmx', syntax: 'PMULUDQ Xd, Xs', description: 'MMX: unsigned doubleword multiply (4×32→32 high).' },
  { code: Opcode.PSLLW, mnemonic: 'PSLLW', category: 'simd_mmx', syntax: 'PSLLW Xd, Xs', description: 'MMX: parallel logical shift left word.' },
  { code: Opcode.PSLLD, mnemonic: 'PSLLD', category: 'simd_mmx', syntax: 'PSLLD Xd, Xs', description: 'MMX: parallel logical shift left dword.' },
  { code: Opcode.PSLLQ, mnemonic: 'PSLLQ', category: 'simd_mmx', syntax: 'PSLLQ Xd, Xs', description: 'MMX: parallel logical shift left qword.' },
  { code: Opcode.PSRLW, mnemonic: 'PSRLW', category: 'simd_mmx', syntax: 'PSRLW Xd, Xs', description: 'MMX: parallel logical shift right word.' },
  { code: Opcode.PSRLD, mnemonic: 'PSRLD', category: 'simd_mmx', syntax: 'PSRLD Xd, Xs', description: 'MMX: parallel logical shift right dword.' },
  { code: Opcode.PSRLQ, mnemonic: 'PSRLQ', category: 'simd_mmx', syntax: 'PSRLQ Xd, Xs', description: 'MMX: parallel logical shift right qword.' },
  { code: Opcode.PSRAW, mnemonic: 'PSRAW', category: 'simd_mmx', syntax: 'PSRAW Xd, Xs', description: 'MMX: parallel arithmetic shift right word.' },
  { code: Opcode.PSRAD, mnemonic: 'PSRAD', category: 'simd_mmx', syntax: 'PSRAD Xd, Xs', description: 'MMX: parallel arithmetic shift right dword.' },
  { code: Opcode.PCMPEQB, mnemonic: 'PCMPEQB', category: 'simd_mmx', syntax: 'PCMPEQB Xd, Xs', description: 'MMX: parallel compare bytes equal.' },
  { code: Opcode.PCMPEQW, mnemonic: 'PCMPEQW', category: 'simd_mmx', syntax: 'PCMPEQW Xd, Xs', description: 'MMX: parallel compare words equal.' },
  { code: Opcode.PCMPEQD, mnemonic: 'PCMPEQD', category: 'simd_mmx', syntax: 'PCMPEQD Xd, Xs', description: 'MMX: parallel compare dwords equal.' },
  { code: Opcode.PACKSSWB, mnemonic: 'PACKSSWB', category: 'simd_mmx', syntax: 'PACKSSWB Xd, Xs', description: 'MMX: pack words to bytes with saturation.' },
  { code: Opcode.PACKUSWB, mnemonic: 'PACKUSWB', category: 'simd_mmx', syntax: 'PACKUSWB Xd, Xs', description: 'MMX: pack words to unsigned bytes.' },
  { code: Opcode.PACKSSDW, mnemonic: 'PACKSSDW', category: 'simd_mmx', syntax: 'PACKSSDW Xd, Xs', description: 'MMX: pack dwords to words with saturation.' },
  { code: Opcode.PUNPCKHBW, mnemonic: 'PUNPCKHBW', category: 'simd_mmx', syntax: 'PUNPCKHBW Xd, Xs', description: 'MMX: unpack high bytes/words.' },
  { code: Opcode.PUNPCKHWD, mnemonic: 'PUNPCKHWD', category: 'simd_mmx', syntax: 'PUNPCKHWD Xd, Xs', description: 'MMX: unpack high words/dwords.' },
  { code: Opcode.PUNPCKHDQ, mnemonic: 'PUNPCKHDQ', category: 'simd_mmx', syntax: 'PUNPCKHDQ Xd, Xs', description: 'MMX: unpack high dwords/qwords.' },
  { code: Opcode.PUNPCKLHBW, mnemonic: 'PUNPCKLHBW', category: 'simd_mmx', syntax: 'PUNPCKLHBW Xd, Xs', description: 'MMX: unpack low bytes/words.' },
  { code: Opcode.PUNPCKLWD, mnemonic: 'PUNPCKLWD', category: 'simd_mmx', syntax: 'PUNPCKLWD Xd, Xs', description: 'MMX: unpack low words/dwords.' },
  { code: Opcode.PUNPCKLDQ, mnemonic: 'PUNPCKLDQ', category: 'simd_mmx', syntax: 'PUNPCKLDQ Xd, Xs', description: 'MMX: unpack low dwords/qwords.' },
  { code: Opcode.PAND, mnemonic: 'PAND', category: 'simd_mmx', syntax: 'PAND Xd, Xs', description: 'MMX: parallel AND over 128 bits.' },
  { code: Opcode.PANDN, mnemonic: 'PANDN', category: 'simd_mmx', syntax: 'PANDN Xd, Xs', description: 'MMX: parallel AND NOT.' },
  { code: Opcode.POR, mnemonic: 'POR', category: 'simd_mmx', syntax: 'POR Xd, Xs', description: 'MMX: parallel OR over 128 bits.' },
  { code: Opcode.PXOR, mnemonic: 'PXOR', category: 'simd_mmx', syntax: 'PXOR Xd, Xs', description: 'MMX: parallel XOR over 128 bits.' },
  { code: Opcode.MOVQ, mnemonic: 'MOVQ', category: 'simd_mmx', syntax: 'MOVQ Xd, Xs', description: 'MMX: move 64-bit between vector registers.' },
  { code: Opcode.EMMS, mnemonic: 'EMMS', category: 'simd_mmx', syntax: 'EMMS', description: 'MMX: empty MMX state (clear vector registers).' },
  // === SSE (Pentium III, 1999) ===
  { code: Opcode.ADDSS, mnemonic: 'ADDSS', category: 'simd_sse', syntax: 'ADDSS Xd, Xs', description: 'SSE: add scalar single-precision FP (lane 0).' },
  { code: Opcode.ADDPS, mnemonic: 'ADDPS', category: 'simd_sse', syntax: 'ADDPS Xd, Xs', description: 'SSE: add packed single-precision FP (4 lanes).' },
  { code: Opcode.MULSS, mnemonic: 'MULSS', category: 'simd_sse', syntax: 'MULSS Xd, Xs', description: 'SSE: multiply scalar single-precision FP.' },
  { code: Opcode.MULPS, mnemonic: 'MULPS', category: 'simd_sse', syntax: 'MULPS Xd, Xs', description: 'SSE: multiply packed single-precision FP.' },
  { code: Opcode.SUBSS, mnemonic: 'SUBSS', category: 'simd_sse', syntax: 'SUBSS Xd, Xs', description: 'SSE: subtract scalar single-precision FP.' },
  { code: Opcode.SUBPS, mnemonic: 'SUBPS', category: 'simd_sse', syntax: 'SUBPS Xd, Xs', description: 'SSE: subtract packed single-precision FP.' },
  { code: Opcode.DIVSS, mnemonic: 'DIVSS', category: 'simd_sse', syntax: 'DIVSS Xd, Xs', description: 'SSE: divide scalar single-precision FP.' },
  { code: Opcode.DIVPS, mnemonic: 'DIVPS', category: 'simd_sse', syntax: 'DIVPS Xd, Xs', description: 'SSE: divide packed single-precision FP.' },
  { code: Opcode.MINSS, mnemonic: 'MINSS', category: 'simd_sse', syntax: 'MINSS Xd, Xs', description: 'SSE: minimum scalar single-precision FP.' },
  { code: Opcode.MINPS, mnemonic: 'MINPS', category: 'simd_sse', syntax: 'MINPS Xd, Xs', description: 'SSE: minimum packed single-precision FP.' },
  { code: Opcode.MAXSS, mnemonic: 'MAXSS', category: 'simd_sse', syntax: 'MAXSS Xd, Xs', description: 'SSE: maximum scalar single-precision FP.' },
  { code: Opcode.MAXPS, mnemonic: 'MAXPS', category: 'simd_sse', syntax: 'MAXPS Xd, Xs', description: 'SSE: maximum packed single-precision FP.' },
  { code: Opcode.SQRTSS, mnemonic: 'SQRTSS', category: 'simd_sse', syntax: 'SQRTSS Xd, Xs', description: 'SSE: square root scalar single-precision FP.' },
  { code: Opcode.SQRTPS, mnemonic: 'SQRTPS', category: 'simd_sse', syntax: 'SQRTPS Xd, Xs', description: 'SSE: square root packed single-precision FP.' },
  { code: Opcode.CMPSS, mnemonic: 'CMPSS', category: 'simd_sse', syntax: 'CMPSS Xd, Xs', description: 'SSE: compare scalar single-precision FP.' },
  { code: Opcode.CMPPS, mnemonic: 'CMPPS', category: 'simd_sse', syntax: 'CMPPS Xd, Xs', description: 'SSE: compare packed single-precision FP.' },
  { code: Opcode.MOVSS, mnemonic: 'MOVSS', category: 'simd_sse', syntax: 'MOVSS Xd, Xs', description: 'SSE: move scalar single-precision FP.' },
  { code: Opcode.MOVPS, mnemonic: 'MOVPS', category: 'simd_sse', syntax: 'MOVPS Xd, Xs', description: 'SSE: move packed single-precision FP.' },
  { code: Opcode.MOVAPS, mnemonic: 'MOVAPS', category: 'simd_sse', syntax: 'MOVAPS Xd, Xs', description: 'SSE: move aligned packed single-precision FP.' },
  { code: Opcode.MOVUPS, mnemonic: 'MOVUPS', category: 'simd_sse', syntax: 'MOVUPS Xd, Xs', description: 'SSE: move unaligned packed single-precision FP.' },
  { code: Opcode.MOVHLPS, mnemonic: 'MOVHLPS', category: 'simd_sse', syntax: 'MOVHLPS Xd, Xs', description: 'SSE: move high FP to low.' },
  { code: Opcode.MOVLHPS, mnemonic: 'MOVLHPS', category: 'simd_sse', syntax: 'MOVLHPS Xd, Xs', description: 'SSE: move low FP to high.' },
  { code: Opcode.MOVMSKPS, mnemonic: 'MOVMSKPS', category: 'simd_sse', syntax: 'MOVMSKPS Rd, Xs', description: 'SSE: extract sign mask to scalar.' },
  { code: Opcode.SHUFPS, mnemonic: 'SHUFPS', category: 'simd_sse', syntax: 'SHUFPS Xd, Xs', description: 'SSE: shuffle packed single-precision FP.' },
  { code: Opcode.UNPCKLPS, mnemonic: 'UNPCKLPS', category: 'simd_sse', syntax: 'UNPCKLPS Xd, Xs', description: 'SSE: unpack low single-precision FP.' },
  { code: Opcode.UNPCKHPS, mnemonic: 'UNPCKHPS', category: 'simd_sse', syntax: 'UNPCKHPS Xd, Xs', description: 'SSE: unpack high single-precision FP.' },
  { code: Opcode.CVTSS2SI, mnemonic: 'CVTSS2SI', category: 'simd_sse', syntax: 'CVTSS2SI Rd, Xs', description: 'SSE: convert scalar FP to integer.' },
  { code: Opcode.CVTSI2SS, mnemonic: 'CVTSI2SS', category: 'simd_sse', syntax: 'CVTSI2SS Xd, Rs', description: 'SSE: convert integer to scalar FP.' },
  { code: Opcode.CVTSS2SD, mnemonic: 'CVTSS2SD', category: 'simd_sse', syntax: 'CVTSS2SD Xd, Xs', description: 'SSE: convert single to double precision.' },
  { code: Opcode.CVTSD2SS, mnemonic: 'CVTSD2SS', category: 'simd_sse', syntax: 'CVTSD2SS Xd, Xs', description: 'SSE: convert double to single precision.' },
  // === SSE2 (Pentium 4, 2000) ===
  { code: Opcode.MOVDQA, mnemonic: 'MOVDQA', category: 'simd_sse2', syntax: 'MOVDQA Xd, Xs', description: 'SSE2: move aligned 128-bit integer.' },
  { code: Opcode.MOVDQU, mnemonic: 'MOVDQU', category: 'simd_sse2', syntax: 'MOVDQU Xd, Xs', description: 'SSE2: move unaligned 128-bit integer.' },
  { code: Opcode.MOVDDUP, mnemonic: 'MOVDDUP', category: 'simd_sse2', syntax: 'MOVDDUP Xd, Xs', description: 'SSE2: move and duplicate double-precision.' },
  { code: Opcode.MOVSHDUP, mnemonic: 'MOVSHDUP', category: 'simd_sse2', syntax: 'MOVSHDUP Xd, Xs', description: 'SSE2: move high single-precision duplicate.' },
  { code: Opcode.MOVSLDUP, mnemonic: 'MOVSLDUP', category: 'simd_sse2', syntax: 'MOVSLDUP Xd, Xs', description: 'SSE2: move low single-precision duplicate.' },
  { code: Opcode.PAVGB, mnemonic: 'PAVGB', category: 'simd_sse2', syntax: 'PAVGB Xd, Xs', description: 'SSE2: average bytes.' },
  { code: Opcode.PAVGW, mnemonic: 'PAVGW', category: 'simd_sse2', syntax: 'PAVGW Xd, Xs', description: 'SSE2: average words.' },
  { code: Opcode.PMINSW, mnemonic: 'PMINSW', category: 'simd_sse2', syntax: 'PMINSW Xd, Xs', description: 'SSE2: minimum signed words.' },
  { code: Opcode.PMAXSW, mnemonic: 'PMAXSW', category: 'simd_sse2', syntax: 'PMAXSW Xd, Xs', description: 'SSE2: maximum signed words.' },
  { code: Opcode.PMINUB, mnemonic: 'PMINUB', category: 'simd_sse2', syntax: 'PMINUB Xd, Xs', description: 'SSE2: minimum unsigned bytes.' },
  { code: Opcode.PMAXUB, mnemonic: 'PMAXUB', category: 'simd_sse2', syntax: 'PMAXUB Xd, Xs', description: 'SSE2: maximum unsigned bytes.' },
  { code: Opcode.MOVMSKDQ, mnemonic: 'MOVMSKDQ', category: 'simd_sse2', syntax: 'MOVMSKDQ Rd, Xs', description: 'SSE2: extract quadword sign mask.' },
  { code: Opcode.CVTDQ2PS, mnemonic: 'CVTDQ2PS', category: 'simd_sse2', syntax: 'CVTDQ2PS Xd, Xs', description: 'SSE2: convert dwords to single-precision FP.' },
  { code: Opcode.CVTPS2DQ, mnemonic: 'CVTPS2DQ', category: 'simd_sse2', syntax: 'CVTPS2DQ Xd, Xs', description: 'SSE2: convert single-precision FP to dwords.' },
  { code: Opcode.ADDPD, mnemonic: 'ADDPD', category: 'simd_sse2', syntax: 'ADDPD Xd, Xs', description: 'SSE2: add packed double-precision FP.' },
  { code: Opcode.MULPD, mnemonic: 'MULPD', category: 'simd_sse2', syntax: 'MULPD Xd, Xs', description: 'SSE2: multiply packed double-precision FP.' },
  { code: Opcode.SUBPD, mnemonic: 'SUBPD', category: 'simd_sse2', syntax: 'SUBPD Xd, Xs', description: 'SSE2: subtract packed double-precision FP.' },
  { code: Opcode.DIVPD, mnemonic: 'DIVPD', category: 'simd_sse2', syntax: 'DIVPD Xd, Xs', description: 'SSE2: divide packed double-precision FP.' },
  { code: Opcode.SQRTPD, mnemonic: 'SQRTPD', category: 'simd_sse2', syntax: 'SQRTPD Xd, Xs', description: 'SSE2: square root packed double-precision FP.' },
  { code: Opcode.CMPPD, mnemonic: 'CMPPD', category: 'simd_sse2', syntax: 'CMPPD Xd, Xs', description: 'SSE2: compare packed double-precision FP.' },
  { code: Opcode.MOVAPD, mnemonic: 'MOVAPD', category: 'simd_sse2', syntax: 'MOVAPD Xd, Xs', description: 'SSE2: move aligned packed double-precision.' },
  { code: Opcode.MOVUPD, mnemonic: 'MOVUPD', category: 'simd_sse2', syntax: 'MOVUPD Xd, Xs', description: 'SSE2: move unaligned packed double-precision.' },
  { code: Opcode.CVTSI2SD, mnemonic: 'CVTSI2SD', category: 'simd_sse2', syntax: 'CVTSI2SD Xd, Rs', description: 'SSE2: convert integer to scalar double-precision.' },
  { code: Opcode.CVTSD2SI, mnemonic: 'CVTSD2SI', category: 'simd_sse2', syntax: 'CVTSD2SI Rd, Xs', description: 'SSE2: convert scalar double-precision to integer.' },
  // === SSE3 (Pentium 4 HT, 2004) ===
  { code: Opcode.ADDSUBPS, mnemonic: 'ADDSUBPS', category: 'simd_sse3', syntax: 'ADDSUBPS Xd, Xs', description: 'SSE3: horizontal add/subtract single-precision.' },
  { code: Opcode.ADDSUBPD, mnemonic: 'ADDSUBPD', category: 'simd_sse3', syntax: 'ADDSUBPD Xd, Xs', description: 'SSE3: horizontal add/subtract double-precision.' },
  { code: Opcode.HADDPS, mnemonic: 'HADDPS', category: 'simd_sse3', syntax: 'HADDPS Xd, Xs', description: 'SSE3: horizontal add single-precision FP.' },
  { code: Opcode.HSUBPS, mnemonic: 'HSUBPS', category: 'simd_sse3', syntax: 'HSUBPS Xd, Xs', description: 'SSE3: horizontal subtract single-precision FP.' },
  { code: Opcode.HADDPD, mnemonic: 'HADDPD', category: 'simd_sse3', syntax: 'HADDPD Xd, Xs', description: 'SSE3: horizontal add double-precision FP.' },
  { code: Opcode.HSUBPD, mnemonic: 'HSUBPD', category: 'simd_sse3', syntax: 'HSUBPD Xd, Xs', description: 'SSE3: horizontal subtract double-precision FP.' },
  { code: Opcode.LDDQU, mnemonic: 'LDDQU', category: 'simd_sse3', syntax: 'LDDQU Xd, [Rs]', description: 'SSE3: load unaligned 128-bit integer (non-temporal).' },
  { code: Opcode.MOVNTDQ, mnemonic: 'MOVNTDQ', category: 'simd_sse3', syntax: 'MOVNTDQ [Rd], Xs', description: 'SSE3: non-temporal store 128-bit.' },
  { code: Opcode.FADDSS, mnemonic: 'FADDSS', category: 'simd_sse3', syntax: 'FADDSS Xd, Xs', description: 'SSE3: fused add single-precision (FMA-like).' },
  { code: Opcode.FMULSS, mnemonic: 'FMULSS', category: 'simd_sse3', syntax: 'FMULSS Xd, Xs', description: 'SSE3: fused multiply single-precision (FMA-like).' },
  { code: Opcode.MONITOR, mnemonic: 'MONITOR', category: 'simd_sse3', syntax: 'MONITOR', description: 'SSE3: set monitor address for MWAIT.' },
  { code: Opcode.MWAIT, mnemonic: 'MWAIT', category: 'simd_sse3', syntax: 'MWAIT', description: 'SSE3: monitor wait (low-power idle).' },
  // === Extra SIMD voor evolutie ===
  { code: Opcode.VSUB, mnemonic: 'VSUB', category: 'simd', syntax: 'VSUB Xd, Xs', description: '128-bit SIMD: parallel subtract over 4 lanes.' },
  { code: Opcode.VMUL, mnemonic: 'VMUL', category: 'simd', syntax: 'VMUL Xd, Xs', description: '128-bit SIMD: parallel multiply over 4 lanes.' },
  { code: Opcode.VDIV, mnemonic: 'VDIV', category: 'simd', syntax: 'VDIV Xd, Xs', description: '128-bit SIMD: parallel divide over 4 lanes.' },
  { code: Opcode.VMIN, mnemonic: 'VMIN', category: 'simd', syntax: 'VMIN Xd, Xs', description: '128-bit SIMD: parallel minimum over 4 lanes.' },
  { code: Opcode.VMAX, mnemonic: 'VMAX', category: 'simd', syntax: 'VMAX Xd, Xs', description: '128-bit SIMD: parallel maximum over 4 lanes.' },
  { code: Opcode.VAND, mnemonic: 'VAND', category: 'simd', syntax: 'VAND Xd, Xs', description: '128-bit SIMD: parallel AND over 4 lanes.' },
  { code: Opcode.VOR, mnemonic: 'VOR', category: 'simd', syntax: 'VOR Xd, Xs', description: '128-bit SIMD: parallel OR over 4 lanes.' },
  { code: Opcode.VSHUFFLE, mnemonic: 'VSHUFFLE', category: 'simd', syntax: 'VSHUFFLE Xd, Xs', description: '128-bit SIMD: shuffle lanes based on imm.' },
  { code: Opcode.VUNPCKH, mnemonic: 'VUNPCKH', category: 'simd', syntax: 'VUNPCKH Xd, Xs', description: '128-bit SIMD: unpack high lanes.' },
  { code: Opcode.VUNPCKL, mnemonic: 'VUNPCKL', category: 'simd', syntax: 'VUNPCKL Xd, Xs', description: '128-bit SIMD: unpack low lanes.' },
  { code: Opcode.VMOVMSK, mnemonic: 'VMOVMSK', category: 'simd', syntax: 'VMOVMSK Rd, Xs', description: '128-bit SIMD: extract sign mask to scalar.' },
  { code: Opcode.VMOV, mnemonic: 'VMOV', category: 'simd', syntax: 'VMOV Xd, Xs', description: '128-bit SIMD: move entire vector.' },
  { code: Opcode.VMOVHL, mnemonic: 'VMOVHL', category: 'simd', syntax: 'VMOVHL Xd, Xs', description: '128-bit SIMD: move high to low lanes.' },
  { code: Opcode.VMOVLH, mnemonic: 'VMOVLH', category: 'simd', syntax: 'VMOVLH Xd, Xs', description: '128-bit SIMD: move low to high lanes.' },
  { code: Opcode.VCMPEQ, mnemonic: 'VCMPEQ', category: 'simd', syntax: 'VCMPEQ Xd, Xs', description: '128-bit SIMD: compare equal (4 lanes).' },
  { code: Opcode.VCMPLT, mnemonic: 'VCMPLT', category: 'simd', syntax: 'VCMPLT Xd, Xs', description: '128-bit SIMD: compare less than (4 lanes).' },
  { code: Opcode.VCMPLE, mnemonic: 'VCMPLE', category: 'simd', syntax: 'VCMPLE Xd, Xs', description: '128-bit SIMD: compare less or equal (4 lanes).' },
  { code: Opcode.VABS, mnemonic: 'VABS', category: 'simd', syntax: 'VABS Xd', description: '128-bit SIMD: absolute value (4 lanes).' },
  { code: Opcode.VNEG, mnemonic: 'VNEG', category: 'simd', syntax: 'VNEG Xd', description: '128-bit SIMD: negate (4 lanes).' },
  { code: Opcode.VSQRT, mnemonic: 'VSQRT', category: 'simd', syntax: 'VSQRT Xd', description: '128-bit SIMD: square root (4 lanes).' },
  { code: Opcode.VRSQRT, mnemonic: 'VRSQRT', category: 'simd', syntax: 'VRSQRT Xd', description: '128-bit SIMD: reciprocal square root (approx).' },
  { code: Opcode.VRCPPS, mnemonic: 'VRCPPS', category: 'simd', syntax: 'VRCPPS Xd', description: '128-bit SIMD: reciprocal (1/x, approx).' },
  { code: Opcode.VEXTRACT, mnemonic: 'VEXTRACT', category: 'simd', syntax: 'VEXTRACT Rd, Xs', description: '128-bit SIMD: extract lane to scalar.' },
  { code: Opcode.VINSERT, mnemonic: 'VINSERT', category: 'simd', syntax: 'VINSERT Xd, Rs', description: '128-bit SIMD: insert scalar into lane.' },
  { code: Opcode.VBLEND, mnemonic: 'VBLEND', category: 'simd', syntax: 'VBLEND Xd, Xs', description: '128-bit SIMD: blend lanes from two vectors.' },
  { code: Opcode.VPERM, mnemonic: 'VPERM', category: 'simd', syntax: 'VPERM Xd, Xs', description: '128-bit SIMD: permute lanes.' },
  { code: Opcode.VSHL, mnemonic: 'VSHL', category: 'simd', syntax: 'VSHL Xd, Xs', description: '128-bit SIMD: logical shift left (4 lanes).' },
  { code: Opcode.VSHR, mnemonic: 'VSHR', category: 'simd', syntax: 'VSHR Xd, Xs', description: '128-bit SIMD: logical shift right (4 lanes).' },
  { code: Opcode.VROL, mnemonic: 'VROL', category: 'simd', syntax: 'VROL Xd, Xs', description: '128-bit SIMD: rotate left (4 lanes).' },
  { code: Opcode.VROR, mnemonic: 'VROR', category: 'simd', syntax: 'VROR Xd, Xs', description: '128-bit SIMD: rotate right (4 lanes).' },
  { code: Opcode.VPOPCNT, mnemonic: 'VPOPCNT', category: 'simd', syntax: 'VPOPCNT Xd', description: '128-bit SIMD: population count (4 lanes).' },
  { code: Opcode.VBSWAP, mnemonic: 'VBSWAP', category: 'simd', syntax: 'VBSWAP Xd', description: '128-bit SIMD: byte swap (4 lanes).' },
  // === Extra flow & memory ===
  { code: Opcode.JGE, mnemonic: 'JGE', category: 'flow', syntax: 'JGE @addr', description: 'Spring als greater-or-equal (CF==SF of ZF==1).' },
  { code: Opcode.JLE, mnemonic: 'JLE', category: 'flow', syntax: 'JLE @addr', description: 'Spring als less-or-equal (CF!=SF of ZF==1).' },
  { code: Opcode.JG, mnemonic: 'JG', category: 'flow', syntax: 'JG @addr', description: 'Spring als greater (ZF==0 en CF==SF).' },
  { code: Opcode.CALL, mnemonic: 'CALL', category: 'flow', syntax: 'CALL @addr', description: 'Subroutine call: push IP en spring naar adres.' },
  { code: Opcode.RET, mnemonic: 'RET', category: 'flow', syntax: 'RET', description: 'Subroutine return: pop IP van stack.' },
  { code: Opcode.PUSH, mnemonic: 'PUSH', category: 'mem', syntax: 'PUSH Rs', description: 'Push Rs op de stack (RAM).' },
  { code: Opcode.POP, mnemonic: 'POP', category: 'mem', syntax: 'POP Rd', description: 'Pop waarde van stack naar Rd.' },
  { code: Opcode.CMOVE, mnemonic: 'CMOVE', category: 'mem', syntax: 'CMOVE Rd, Rs', description: 'Conditional move als equal (ZF==1).' },
  { code: Opcode.CMOVNE, mnemonic: 'CMOVNE', category: 'mem', syntax: 'CMOVNE Rd, Rs', description: 'Conditional move als not equal (ZF==0).' },
  { code: Opcode.CMOVGE, mnemonic: 'CMOVGE', category: 'mem', syntax: 'CMOVGE Rd, Rs', description: 'Conditional move als greater-or-equal.' },
  { code: Opcode.CMOVLE, mnemonic: 'CMOVLE', category: 'mem', syntax: 'CMOVLE Rd, Rs', description: 'Conditional move als less-or-equal.' },
  { code: Opcode.CMOVG, mnemonic: 'CMOVG', category: 'mem', syntax: 'CMOVG Rd, Rs', description: 'Conditional move als greater.' },
  // === Extra ALU ===
  { code: Opcode.IMUL, mnemonic: 'IMUL', category: 'alu', syntax: 'IMUL Rd, Rs', description: 'Signed multiply (alias voor MUL, expliciete naam).' },
  { code: Opcode.SAL, mnemonic: 'SAL', category: 'bit', syntax: 'SAL Rd, #n', description: 'Arithmetic shift left (alias voor SHL).' },
  { code: Opcode.SAR, mnemonic: 'SAR', category: 'bit', syntax: 'SAR Rd, #n', description: 'Arithmetic shift right (sign-extending).' },
  { code: Opcode.SETC, mnemonic: 'SETC', category: 'flow', syntax: 'SETC Rd', description: 'Zet Rd op 1 als CF==1, anders 0.' },
];

export type TaskId = 'homeostasis' | 'arena' | 'bitstream' | 'hardware' | 'ecosystem';

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
  ecosystem: {
    id: 'ecosystem',
    name: 'Ecosysteem (4-in-1)',
    shortDesc: 'Navigeer door een bos met 4 zones: huisje (homeostasis), bos (arena), puzzelstenen (bitstream), en sensor-toren (hardware).',
    ports: [
      'P0: Zone-sensor A (temp/DX-energie/bitCurr/hwA)',
      'P1: Zone-sensor B (queue/DY-energie/bitPrev/hwB)',
      'P2: Zone-sensor C (energy/DX-hazard/tick&1/hwA^hwB)',
      'P3: Zone-sensor D (temp-delta/DY-hazard/popcnt/hwMask)',
      'P4: Energie (%)',
      'P5: Klok-tick',
      'P6: Zone-ID (0=Huisje, 1=Bos, 2=Puzzel, 3=Toren)',
      'P7: Huisje-richting (0=Noord, 1=Oost, 2=Zuid, 3=West)',
    ],
    actions: [
      'Zone 0 (Huisje): 0=Rust, 1=Werk, 2=Turbo, 3=Koelen',
      'Zone 1 (Bos): 0=Noord, 1=Oost, 2=Zuid, 3=West',
      'Zone 2 (Puzzel): ACT & 0x0F = Bit-voorspelling',
      'Zone 3 (Toren): ACT & 0x0F = Bus-voorspelling',
    ],
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
  // Ecosystem-specific fields
  ecoZone: number; // 0=house, 1=forest, 2=puzzle, 3=tower
  ecoHouseX: number;
  ecoHouseY: number;
  ecoEnergyNodes: Array<{ x: number; y: number }>;
  ecoHazards: Array<{ x: number; y: number }>;
  ecoBitCurr: number;
  ecoBitPrev: number;
  ecoHwStreamA: number;
  ecoHwStreamB: number;
  ecoTemp: number;
  ecoQueue: number;
  ecoZoneScores: number[]; // [homeostasis, arena, bitstream, hardware] cumulative
  ecoZoneWeights: number[]; // [0.8, 1.0, 1.5, 1.5]
  ecoTrail: Array<{ x: number; y: number }>;
  ecoNodesCollected: number;
  ecoHazardHits: number;
  ecoBitExactHits: number;
  ecoHwExactHits: number;
};

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
    // MMX
    case Opcode.PADDSB: return `PADDSB ${xd}, ${xs}`;
    case Opcode.PADDSW: return `PADDSW ${xd}, ${xs}`;
    case Opcode.PADDUSB: return `PADDUSB ${xd}, ${xs}`;
    case Opcode.PADDUSW: return `PADDUSW ${xd}, ${xs}`;
    case Opcode.PADDD: return `PADDD ${xd}, ${xs}`;
    case Opcode.PADDQ: return `PADDQ ${xd}, ${xs}`;
    case Opcode.PSUBB: return `PSUBB ${xd}, ${xs}`;
    case Opcode.PSUBW: return `PSUBW ${xd}, ${xs}`;
    case Opcode.PSUBSB: return `PSUBSB ${xd}, ${xs}`;
    case Opcode.PSUBSW: return `PSUBSW ${xd}, ${xs}`;
    case Opcode.PSUBUSB: return `PSUBUSB ${xd}, ${xs}`;
    case Opcode.PSUBUSW: return `PSUBUSW ${xd}, ${xs}`;
    case Opcode.PSUBD: return `PSUBD ${xd}, ${xs}`;
    case Opcode.PSUBQ: return `PSUBQ ${xd}, ${xs}`;
    case Opcode.PMULLW: return `PMULLW ${xd}, ${xs}`;
    case Opcode.PMULHW: return `PMULHW ${xd}, ${xs}`;
    case Opcode.PMULHWS: return `PMULHWS ${xd}, ${xs}`;
    case Opcode.PMULUDQ: return `PMULUDQ ${xd}, ${xs}`;
    case Opcode.PSLLW: return `PSLLW ${xd}, ${xs}`;
    case Opcode.PSLLD: return `PSLLD ${xd}, ${xs}`;
    case Opcode.PSLLQ: return `PSLLQ ${xd}, ${xs}`;
    case Opcode.PSRLW: return `PSRLW ${xd}, ${xs}`;
    case Opcode.PSRLD: return `PSRLD ${xd}, ${xs}`;
    case Opcode.PSRLQ: return `PSRLQ ${xd}, ${xs}`;
    case Opcode.PSRAW: return `PSRAW ${xd}, ${xs}`;
    case Opcode.PSRAD: return `PSRAD ${xd}, ${xs}`;
    case Opcode.PCMPEQB: return `PCMPEQB ${xd}, ${xs}`;
    case Opcode.PCMPEQW: return `PCMPEQW ${xd}, ${xs}`;
    case Opcode.PCMPEQD: return `PCMPEQD ${xd}, ${xs}`;
    case Opcode.PACKSSWB: return `PACKSSWB ${xd}, ${xs}`;
    case Opcode.PACKUSWB: return `PACKUSWB ${xd}, ${xs}`;
    case Opcode.PACKSSDW: return `PACKSSDW ${xd}, ${xs}`;
    case Opcode.PUNPCKHBW: return `PUNPCKHBW ${xd}, ${xs}`;
    case Opcode.PUNPCKHWD: return `PUNPCKHWD ${xd}, ${xs}`;
    case Opcode.PUNPCKHDQ: return `PUNPCKHDQ ${xd}, ${xs}`;
    case Opcode.PUNPCKLHBW: return `PUNPCKLHBW ${xd}, ${xs}`;
    case Opcode.PUNPCKLWD: return `PUNPCKLWD ${xd}, ${xs}`;
    case Opcode.PUNPCKLDQ: return `PUNPCKLDQ ${xd}, ${xs}`;
    case Opcode.PAND: return `PAND ${xd}, ${xs}`;
    case Opcode.PANDN: return `PANDN ${xd}, ${xs}`;
    case Opcode.POR: return `POR ${xd}, ${xs}`;
    case Opcode.PXOR: return `PXOR ${xd}, ${xs}`;
    case Opcode.MOVQ: return `MOVQ ${xd}, ${xs}`;
    case Opcode.EMMS: return 'EMMS';
    // SSE
    case Opcode.ADDSS: return `ADDSS ${xd}, ${xs}`;
    case Opcode.ADDPS: return `ADDPS ${xd}, ${xs}`;
    case Opcode.MULSS: return `MULSS ${xd}, ${xs}`;
    case Opcode.MULPS: return `MULPS ${xd}, ${xs}`;
    case Opcode.SUBSS: return `SUBSS ${xd}, ${xs}`;
    case Opcode.SUBPS: return `SUBPS ${xd}, ${xs}`;
    case Opcode.DIVSS: return `DIVSS ${xd}, ${xs}`;
    case Opcode.DIVPS: return `DIVPS ${xd}, ${xs}`;
    case Opcode.MINSS: return `MINSS ${xd}, ${xs}`;
    case Opcode.MINPS: return `MINPS ${xd}, ${xs}`;
    case Opcode.MAXSS: return `MAXSS ${xd}, ${xs}`;
    case Opcode.MAXPS: return `MAXPS ${xd}, ${xs}`;
    case Opcode.SQRTSS: return `SQRTSS ${xd}, ${xs}`;
    case Opcode.SQRTPS: return `SQRTPS ${xd}, ${xs}`;
    case Opcode.CMPSS: return `CMPSS ${xd}, ${xs}`;
    case Opcode.CMPPS: return `CMPPS ${xd}, ${xs}`;
    case Opcode.MOVSS: return `MOVSS ${xd}, ${xs}`;
    case Opcode.MOVPS: return `MOVPS ${xd}, ${xs}`;
    case Opcode.MOVAPS: return `MOVAPS ${xd}, ${xs}`;
    case Opcode.MOVUPS: return `MOVUPS ${xd}, ${xs}`;
    case Opcode.MOVHLPS: return `MOVHLPS ${xd}, ${xs}`;
    case Opcode.MOVLHPS: return `MOVLHPS ${xd}, ${xs}`;
    case Opcode.MOVMSKPS: return `MOVMSKPS ${rd}, ${xs}`;
    case Opcode.SHUFPS: return `SHUFPS ${xd}, ${xs}`;
    case Opcode.UNPCKLPS: return `UNPCKLPS ${xd}, ${xs}`;
    case Opcode.UNPCKHPS: return `UNPCKHPS ${xd}, ${xs}`;
    case Opcode.CVTSS2SI: return `CVTSS2SI ${rd}, ${xs}`;
    case Opcode.CVTSI2SS: return `CVTSI2SS ${xd}, ${rs}`;
    case Opcode.CVTSS2SD: return `CVTSS2SD ${xd}, ${xs}`;
    case Opcode.CVTSD2SS: return `CVTSD2SS ${xd}, ${xs}`;
    // SSE2
    case Opcode.MOVDQA: return `MOVDQA ${xd}, ${xs}`;
    case Opcode.MOVDQU: return `MOVDQU ${xd}, ${xs}`;
    case Opcode.MOVDDUP: return `MOVDDUP ${xd}, ${xs}`;
    case Opcode.MOVSHDUP: return `MOVSHDUP ${xd}, ${xs}`;
    case Opcode.MOVSLDUP: return `MOVSLDUP ${xd}, ${xs}`;
    case Opcode.PAVGB: return `PAVGB ${xd}, ${xs}`;
    case Opcode.PAVGW: return `PAVGW ${xd}, ${xs}`;
    case Opcode.PMINSW: return `PMINSW ${xd}, ${xs}`;
    case Opcode.PMAXSW: return `PMAXSW ${xd}, ${xs}`;
    case Opcode.PMINUB: return `PMINUB ${xd}, ${xs}`;
    case Opcode.PMAXUB: return `PMAXUB ${xd}, ${xs}`;
    case Opcode.MOVMSKDQ: return `MOVMSKDQ ${rd}, ${xs}`;
    case Opcode.CVTDQ2PS: return `CVTDQ2PS ${xd}, ${xs}`;
    case Opcode.CVTPS2DQ: return `CVTPS2DQ ${xd}, ${xs}`;
    case Opcode.ADDPD: return `ADDPD ${xd}, ${xs}`;
    case Opcode.MULPD: return `MULPD ${xd}, ${xs}`;
    case Opcode.SUBPD: return `SUBPD ${xd}, ${xs}`;
    case Opcode.DIVPD: return `DIVPD ${xd}, ${xs}`;
    case Opcode.SQRTPD: return `SQRTPD ${xd}, ${xs}`;
    case Opcode.CMPPD: return `CMPPD ${xd}, ${xs}`;
    case Opcode.MOVAPD: return `MOVAPD ${xd}, ${xs}`;
    case Opcode.MOVUPD: return `MOVUPD ${xd}, ${xs}`;
    case Opcode.CVTSI2SD: return `CVTSI2SD ${xd}, ${rs}`;
    case Opcode.CVTSD2SI: return `CVTSD2SI ${rd}, ${xs}`;
    // SSE3
    case Opcode.ADDSUBPS: return `ADDSUBPS ${xd}, ${xs}`;
    case Opcode.ADDSUBPD: return `ADDSUBPD ${xd}, ${xs}`;
    case Opcode.HADDPS: return `HADDPS ${xd}, ${xs}`;
    case Opcode.HSUBPS: return `HSUBPS ${xd}, ${xs}`;
    case Opcode.HADDPD: return `HADDPD ${xd}, ${xs}`;
    case Opcode.HSUBPD: return `HSUBPD ${xd}, ${xs}`;
    case Opcode.LDDQU: return `LDDQU ${xd}, [${rs}]`;
    case Opcode.MOVNTDQ: return `MOVNTDQ [${rd}], ${xs}`;
    case Opcode.FADDSS: return `FADDSS ${xd}, ${xs}`;
    case Opcode.FMULSS: return `FMULSS ${xd}, ${xs}`;
    case Opcode.MONITOR: return 'MONITOR';
    case Opcode.MWAIT: return 'MWAIT';
    // Extra SIMD
    case Opcode.VSUB: return `VSUB ${xd}, ${xs}`;
    case Opcode.VMUL: return `VMUL ${xd}, ${xs}`;
    case Opcode.VDIV: return `VDIV ${xd}, ${xs}`;
    case Opcode.VMIN: return `VMIN ${xd}, ${xs}`;
    case Opcode.VMAX: return `VMAX ${xd}, ${xs}`;
    case Opcode.VAND: return `VAND ${xd}, ${xs}`;
    case Opcode.VOR: return `VOR ${xd}, ${xs}`;
    case Opcode.VSHUFFLE: return `VSHUFFLE ${xd}, ${xs}`;
    case Opcode.VUNPCKH: return `VUNPCKH ${xd}, ${xs}`;
    case Opcode.VUNPCKL: return `VUNPCKL ${xd}, ${xs}`;
    case Opcode.VMOVMSK: return `VMOVMSK ${rd}, ${xs}`;
    case Opcode.VMOV: return `VMOV ${xd}, ${xs}`;
    case Opcode.VMOVHL: return `VMOVHL ${xd}, ${xs}`;
    case Opcode.VMOVLH: return `VMOVLH ${xd}, ${xs}`;
    case Opcode.VCMPEQ: return `VCMPEQ ${xd}, ${xs}`;
    case Opcode.VCMPLT: return `VCMPLT ${xd}, ${xs}`;
    case Opcode.VCMPLE: return `VCMPLE ${xd}, ${xs}`;
    case Opcode.VABS: return `VABS ${xd}`;
    case Opcode.VNEG: return `VNEG ${xd}`;
    case Opcode.VSQRT: return `VSQRT ${xd}`;
    case Opcode.VRSQRT: return `VRSQRT ${xd}`;
    case Opcode.VRCPPS: return `VRCPPS ${xd}`;
    case Opcode.VEXTRACT: return `VEXTRACT ${rd}, ${xs}`;
    case Opcode.VINSERT: return `VINSERT ${xd}, ${rs}`;
    case Opcode.VBLEND: return `VBLEND ${xd}, ${xs}`;
    case Opcode.VPERM: return `VPERM ${xd}, ${xs}`;
    case Opcode.VSHL: return `VSHL ${xd}, ${xs}`;
    case Opcode.VSHR: return `VSHR ${xd}, ${xs}`;
    case Opcode.VROL: return `VROL ${xd}, ${xs}`;
    case Opcode.VROR: return `VROR ${xd}, ${xs}`;
    case Opcode.VPOPCNT: return `VPOPCNT ${xd}`;
    case Opcode.VBSWAP: return `VBSWAP ${xd}`;
    // Extra flow & memory
    case Opcode.JGE: return `JGE ${addrHex}`;
    case Opcode.JLE: return `JLE ${addrHex}`;
    case Opcode.JG: return `JG ${addrHex}`;
    case Opcode.CALL: return `CALL ${addrHex}`;
    case Opcode.RET: return 'RET';
    case Opcode.PUSH: return `PUSH ${rs}`;
    case Opcode.POP: return `POP ${rd}`;
    case Opcode.CMOVE: return `CMOVE ${rd}, ${rs}`;
    case Opcode.CMOVNE: return `CMOVNE ${rd}, ${rs}`;
    case Opcode.CMOVGE: return `CMOVGE ${rd}, ${rs}`;
    case Opcode.CMOVLE: return `CMOVLE ${rd}, ${rs}`;
    case Opcode.CMOVG: return `CMOVG ${rd}, ${rs}`;
    // Extra ALU
    case Opcode.IMUL: return `IMUL ${rd}, ${rs}`;
    case Opcode.SAL: return `SAL ${rd}, #${inst.imm & 7}`;
    case Opcode.SAR: return `SAR ${rd}, #${inst.imm & 7}`;
    case Opcode.SETC: return `SETC ${rd}`;
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
    // === MMX SIMD Integer Operations ===
    case Opcode.PADDSB: { // Parallel add signed bytes with saturation
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane], b = vm.xmm[xs + lane];
        // Simulate byte-level saturation: add and clamp to 16-bit
        let r = a + b;
        if (r > 32767) r = 32767; else if (r < -32768) r = -32768;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PADDSW: { // Parallel add signed words with saturation
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane], b = vm.xmm[xs + lane];
        let r = a + b;
        if (r > 32767) r = 32767; else if (r < -32768) r = -32768;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PADDUSB: { // Parallel add unsigned bytes with saturation
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = Math.max(0, vm.xmm[xd + lane]), b = Math.max(0, vm.xmm[xs + lane]);
        let r = a + b;
        if (r > 255) r = 255;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PADDUSW: { // Parallel add unsigned words with saturation
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = Math.max(0, vm.xmm[xd + lane]), b = Math.max(0, vm.xmm[xs + lane]);
        let r = a + b;
        if (r > 65535) r = 65535;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PADDD: { // Parallel add dwords
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] + vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.PADDQ: { // Parallel add qwords (2 lanes of 64-bit)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 2; lane++) {
        vm.xmm[xd + lane * 2] = (vm.xmm[xd + lane * 2] + vm.xmm[xs + lane * 2]) | 0;
        vm.xmm[xd + lane * 2 + 1] = (vm.xmm[xd + lane * 2 + 1] + vm.xmm[xs + lane * 2 + 1]) | 0;
      }
      break;
    }
    case Opcode.PSUBB:
    case Opcode.PSUBW: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] - vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.PSUBSB:
    case Opcode.PSUBSW: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let r = vm.xmm[xd + lane] - vm.xmm[xs + lane];
        if (r > 32767) r = 32767; else if (r < -32768) r = -32768;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PSUBUSB:
    case Opcode.PSUBUSW: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = Math.max(0, vm.xmm[xd + lane]), b = Math.max(0, vm.xmm[xs + lane]);
        let r = a - b;
        if (r < 0) r = 0;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PSUBD:
    case Opcode.PSUBQ: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] - vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.PMULLW: { // Parallel multiply low words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] & 0xFFFF;
        let b = vm.xmm[xs + lane] & 0xFFFF;
        if (a > 32767) a -= 65536; if (b > 32767) b -= 65536;
        let r = a * b;
        r = ((r % 65536) + 65536) % 65536;
        if (r > 32767) r -= 65536;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PMULHW: { // Parallel multiply high words (signed)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] & 0xFFFF; if (a > 32767) a -= 65536;
        let b = vm.xmm[xs + lane] & 0xFFFF; if (b > 32767) b -= 65536;
        let r = (a * b) / 65536 | 0;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PMULHWS: { // Parallel multiply high words with rounding
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] & 0xFFFF; if (a > 32767) a -= 65536;
        let b = vm.xmm[xs + lane] & 0xFFFF; if (b > 32767) b -= 65536;
        let r = Math.round(a * b / 65536);
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PMULUDQ: { // Unsigned doubleword multiply (high 32-bit)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] >>> 0;
        let b = vm.xmm[xs + lane] >>> 0;
        let r = Math.floor((a * b) / 4294967296) >>> 0;
        vm.xmm[xd + lane] = r;
      }
      break;
    }
    case Opcode.PSLLW: { // Parallel shift left word
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 15;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] & 0xFFFF;
        vm.xmm[xd + lane] = (a << sh) & 0xFFFF;
      }
      break;
    }
    case Opcode.PSLLD: { // Parallel shift left dword
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] << sh) | 0;
      }
      break;
    }
    case Opcode.PSLLQ: { // Parallel shift left qword
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 63;
      for (let lane = 0; lane < 2; lane++) {
        let lo = BigInt(vm.xmm[xd + lane * 2]);
        let hi = BigInt(vm.xmm[xd + lane * 2 + 1]);
        let q = (hi << 32n) | (lo & 0xFFFFFFFFn);
        q = (q << BigInt(sh)) & 0xFFFFFFFFFFFFFFFFn;
        vm.xmm[xd + lane * 2] = Number(q & 0xFFFFFFFFn);
        vm.xmm[xd + lane * 2 + 1] = Number(q >> 32n);
      }
      break;
    }
    case Opcode.PSRLW: { // Parallel shift right word
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 15;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] >>> sh) & 0xFFFF;
      }
      break;
    }
    case Opcode.PSRLD: { // Parallel shift right dword
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] >>> sh;
      }
      break;
    }
    case Opcode.PSRLQ: { // Parallel shift right qword
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 63;
      for (let lane = 0; lane < 2; lane++) {
        let lo = BigInt(vm.xmm[xd + lane * 2] >>> 0);
        let hi = BigInt(vm.xmm[xd + lane * 2 + 1] >>> 0);
        let q = (hi << 32n) | lo;
        q = q >> BigInt(sh);
        vm.xmm[xd + lane * 2] = Number(q & 0xFFFFFFFFn);
        vm.xmm[xd + lane * 2 + 1] = Number(q >> 32n);
      }
      break;
    }
    case Opcode.PSRAW: { // Parallel arithmetic shift right word
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 15;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane] & 0xFFFF;
        if (a & 0x8000) a = -((~a + 1) & 0xFFFF);
        a = (a >> sh) & 0xFFFF;
        if (a < 0) a |= 0xFFFF;
        vm.xmm[xd + lane] = a;
      }
      break;
    }
    case Opcode.PSRAD: { // Parallel arithmetic shift right dword
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] >> sh;
      }
      break;
    }
    case Opcode.PCMPEQB:
    case Opcode.PCMPEQW:
    case Opcode.PCMPEQD: { // Parallel compare equal
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] === vm.xmm[xs + lane] ? -1 : 0;
      }
      break;
    }
    case Opcode.PACKSSWB: { // Pack words to signed bytes
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane], b = vm.xmm[xs + lane];
        let ab = Math.max(-128, Math.min(127, a));
        let bb = Math.max(-128, Math.min(127, b));
        vm.xmm[xd + lane] = (bb << 8) | ab;
      }
      break;
    }
    case Opcode.PACKUSWB: { // Pack words to unsigned bytes
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = Math.max(0, Math.min(255, vm.xmm[xd + lane]));
        let b = Math.max(0, Math.min(255, vm.xmm[xs + lane]));
        vm.xmm[xd + lane] = (b << 8) | a;
      }
      break;
    }
    case Opcode.PACKSSDW: { // Pack dwords to signed words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let a = Math.max(-32768, Math.min(32767, vm.xmm[xd + lane]));
        let b = Math.max(-32768, Math.min(32767, vm.xmm[xs + lane]));
        vm.xmm[xd + lane] = (b << 16) | (a & 0xFFFF);
      }
      break;
    }
    case Opcode.PUNPCKHBW:
    case Opcode.PUNPCKLHBW: { // Unpack bytes to words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const high = inst.opcode === Opcode.PUNPCKHBW;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane], b = vm.xmm[xs + lane];
        let aLo = a & 0xFF, aHi = (a >> 8) & 0xFF;
        let bLo = b & 0xFF, bHi = (b >> 8) & 0xFF;
        vm.xmm[xd + lane] = high ? (bHi << 8 | aHi) : (bLo << 8 | aLo);
      }
      break;
    }
    case Opcode.PUNPCKHWD:
    case Opcode.PUNPCKLWD: { // Unpack words to dwords
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const high = inst.opcode === Opcode.PUNPCKHWD;
      for (let lane = 0; lane < 4; lane++) {
        let a = vm.xmm[xd + lane], b = vm.xmm[xs + lane];
        let aLo = a & 0xFFFF, aHi = (a >> 16) & 0xFFFF;
        let bLo = b & 0xFFFF, bHi = (b >> 16) & 0xFFFF;
        vm.xmm[xd + lane] = high ? (bHi << 16 | aHi) : (bLo << 16 | aLo);
      }
      break;
    }
    case Opcode.PUNPCKHDQ:
    case Opcode.PUNPCKLDQ: { // Unpack dwords to qwords
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const high = inst.opcode === Opcode.PUNPCKHDQ;
      for (let lane = 0; lane < 2; lane++) {
        let a = vm.xmm[xd + lane * 2], b = vm.xmm[xs + lane * 2];
        vm.xmm[xd + lane * 2] = high ? b : a;
        vm.xmm[xd + lane * 2 + 1] = high ? a : b;
      }
      break;
    }
    case Opcode.PAND: { // Parallel AND
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] & vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.PANDN: { // Parallel AND NOT
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (~vm.xmm[xd + lane]) & vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.POR: { // Parallel OR
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] | vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.PXOR: { // Parallel XOR
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] ^ vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.MOVQ: { // Move 64-bit between vectors
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs];
      vm.xmm[xd + 1] = vm.xmm[xs + 1];
      break;
    }
    case Opcode.EMMS: { // Empty MMX state
      for (let i = 0; i < vm.xmm.length; i++) vm.xmm[i] = 0;
      break;
    }
    // === SSE Floating Point Operations ===
    case Opcode.ADDSS: { // Add scalar single-precision (lane 0)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] + vm.xmm[xs]) | 0;
      break;
    }
    case Opcode.ADDPS: { // Add packed single-precision
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] + vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.MULSS: { // Multiply scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] * vm.xmm[xs]) | 0;
      break;
    }
    case Opcode.MULPS: { // Multiply packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] * vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.SUBSS: { // Subtract scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] - vm.xmm[xs]) | 0;
      break;
    }
    case Opcode.SUBPS: { // Subtract packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = (vm.xmm[xd + lane] - vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.DIVSS: { // Divide scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      if (vm.xmm[xs] !== 0) vm.xmm[xd] = (vm.xmm[xd] / vm.xmm[xs]) | 0;
      break;
    }
    case Opcode.DIVPS: { // Divide packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        if (vm.xmm[xs + lane] !== 0) vm.xmm[xd + lane] = (vm.xmm[xd + lane] / vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.MINSS: { // Minimum scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = Math.min(vm.xmm[xd], vm.xmm[xs]);
      break;
    }
    case Opcode.MINPS: { // Minimum packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.min(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      }
      break;
    }
    case Opcode.MAXSS: { // Maximum scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = Math.max(vm.xmm[xd], vm.xmm[xs]);
      break;
    }
    case Opcode.MAXPS: { // Maximum packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.max(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      }
      break;
    }
    case Opcode.SQRTSS: { // Square root scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = Math.sqrt(Math.abs(vm.xmm[xs])) | 0;
      break;
    }
    case Opcode.SQRTPS: { // Square root packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.sqrt(Math.abs(vm.xmm[xs + lane])) | 0;
      }
      break;
    }
    case Opcode.CMPSS: { // Compare scalar
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xd] === vm.xmm[xs] ? -1 : 0;
      break;
    }
    case Opcode.CMPPS: { // Compare packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] === vm.xmm[xs + lane] ? -1 : 0;
      }
      break;
    }
    case Opcode.MOVSS:
    case Opcode.MOVPS:
    case Opcode.MOVAPS:
    case Opcode.MOVUPS: { // Move packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.MOVHLPS: { // Move high to low
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs + 2];
      vm.xmm[xd + 1] = vm.xmm[xs + 3];
      break;
    }
    case Opcode.MOVLHPS: { // Move low to high
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd + 2] = vm.xmm[xs];
      vm.xmm[xd + 3] = vm.xmm[xs + 1];
      break;
    }
    case Opcode.MOVMSKPS: { // Extract sign mask
      const xs = (inst.src & 3) * 4;
      let mask = 0;
      for (let lane = 0; lane < 4; lane++) {
        if (vm.xmm[xs + lane] < 0) mask |= (1 << lane);
      }
      vm.regs[inst.dst] = maskSigned(BigInt(mask), bitWidth);
      break;
    }
    case Opcode.SHUFPS: { // Shuffle packed
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const imm = inst.imm & 0xF;
      vm.xmm[xd] = vm.xmm[xs + (imm & 3)];
      vm.xmm[xd + 1] = vm.xmm[xs + ((imm >> 2) & 3)];
      vm.xmm[xd + 2] = vm.xmm[xs + ((imm >> 4) & 3) + 2];
      vm.xmm[xd + 3] = vm.xmm[xs + ((imm >> 6) & 3) + 2];
      break;
    }
    case Opcode.UNPCKLPS: { // Unpack low
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd + 3] = vm.xmm[xs + 1];
      vm.xmm[xd + 2] = vm.xmm[xs];
      break;
    }
    case Opcode.UNPCKHPS: { // Unpack high
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs + 2];
      vm.xmm[xd + 1] = vm.xmm[xs + 3];
      break;
    }
    case Opcode.CVTSS2SI: { // Convert scalar FP to integer
      const xs = (inst.src & 3) * 4;
      vm.regs[inst.dst] = maskSigned(BigInt(vm.xmm[xs]), bitWidth);
      break;
    }
    case Opcode.CVTSI2SS: { // Convert integer to scalar FP
      const xd = (inst.dst & 3) * 4;
      vm.xmm[xd] = Number(BigInt.asIntN(32, rsVal));
      break;
    }
    case Opcode.CVTSS2SD:
    case Opcode.CVTSD2SS: { // Convert precision (no-op in integer VM)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs];
      break;
    }
    // === SSE2 Operations ===
    case Opcode.MOVDQA:
    case Opcode.MOVDQU: { // Move aligned/unaligned 128-bit
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xs + lane];
      break;
    }
    case Opcode.MOVDDUP: { // Move and duplicate
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs]; vm.xmm[xd + 1] = vm.xmm[xs + 1];
      vm.xmm[xd + 2] = vm.xmm[xs]; vm.xmm[xd + 3] = vm.xmm[xs + 1];
      break;
    }
    case Opcode.MOVSHDUP: { // Move high duplicate
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs + 1]; vm.xmm[xd + 1] = vm.xmm[xs + 1];
      vm.xmm[xd + 2] = vm.xmm[xs + 3]; vm.xmm[xd + 3] = vm.xmm[xs + 3];
      break;
    }
    case Opcode.MOVSLDUP: { // Move low duplicate
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs]; vm.xmm[xd + 1] = vm.xmm[xs];
      vm.xmm[xd + 2] = vm.xmm[xs + 2]; vm.xmm[xd + 3] = vm.xmm[xs + 2];
      break;
    }
    case Opcode.PAVGB: { // Average bytes
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = ((vm.xmm[xd + lane] + vm.xmm[xs + lane]) / 2) | 0;
      }
      break;
    }
    case Opcode.PAVGW: { // Average words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = ((vm.xmm[xd + lane] + vm.xmm[xs + lane] + 1) / 2) | 0;
      }
      break;
    }
    case Opcode.PMINSW: { // Minimum signed words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.min(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      }
      break;
    }
    case Opcode.PMAXSW: { // Maximum signed words
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.max(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      }
      break;
    }
    case Opcode.PMINUB: { // Minimum unsigned bytes
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.min(vm.xmm[xd + lane] & 0xFF, vm.xmm[xs + lane] & 0xFF);
      }
      break;
    }
    case Opcode.PMAXUB: { // Maximum unsigned bytes
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Math.max(vm.xmm[xd + lane] & 0xFF, vm.xmm[xs + lane] & 0xFF);
      }
      break;
    }
    case Opcode.MOVMSKDQ: { // Extract quadword sign mask
      const xs = (inst.src & 3) * 4;
      let mask = 0;
      for (let lane = 0; lane < 4; lane++) {
        if (vm.xmm[xs + lane] < 0) mask |= (1 << lane);
      }
      vm.regs[inst.dst] = maskSigned(BigInt(mask), bitWidth);
      break;
    }
    case Opcode.CVTDQ2PS: { // Convert dwords to FP (identity in integer VM)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xs + lane];
      break;
    }
    case Opcode.CVTPS2DQ: { // Convert FP to dwords (identity in integer VM)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xs + lane];
      break;
    }
    case Opcode.ADDPD:
    case Opcode.MULPD:
    case Opcode.SUBPD:
    case Opcode.DIVPD:
    case Opcode.SQRTPD:
    case Opcode.CMPPD:
    case Opcode.MOVAPD:
    case Opcode.MOVUPD: { // Double precision ops (same as single in integer VM)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        switch (inst.opcode) {
          case Opcode.ADDPD: vm.xmm[xd + lane] = (vm.xmm[xd + lane] + vm.xmm[xs + lane]) | 0; break;
          case Opcode.MULPD: vm.xmm[xd + lane] = (vm.xmm[xd + lane] * vm.xmm[xs + lane]) | 0; break;
          case Opcode.SUBPD: vm.xmm[xd + lane] = (vm.xmm[xd + lane] - vm.xmm[xs + lane]) | 0; break;
          case Opcode.DIVPD: if (vm.xmm[xs + lane] !== 0) vm.xmm[xd + lane] = (vm.xmm[xd + lane] / vm.xmm[xs + lane]) | 0; break;
          case Opcode.SQRTPD: vm.xmm[xd + lane] = Math.sqrt(Math.abs(vm.xmm[xs + lane])) | 0; break;
          case Opcode.CMPPD: vm.xmm[xd + lane] = vm.xmm[xd + lane] === vm.xmm[xs + lane] ? -1 : 0; break;
          default: vm.xmm[xd + lane] = vm.xmm[xs + lane]; break;
        }
      }
      break;
    }
    case Opcode.CVTSI2SD: { // Convert integer to scalar double
      const xd = (inst.dst & 3) * 4;
      vm.xmm[xd] = Number(BigInt.asIntN(32, rsVal));
      break;
    }
    case Opcode.CVTSD2SI: { // Convert scalar double to integer
      const xs = (inst.src & 3) * 4;
      vm.regs[inst.dst] = maskSigned(BigInt(vm.xmm[xs]), bitWidth);
      break;
    }
    // === SSE3 Operations ===
    case Opcode.ADDSUBPS: { // Add/subtract alternating
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] + vm.xmm[xs]) | 0;
      vm.xmm[xd + 1] = (vm.xmm[xd + 1] - vm.xmm[xs + 1]) | 0;
      vm.xmm[xd + 2] = (vm.xmm[xd + 2] + vm.xmm[xs + 2]) | 0;
      vm.xmm[xd + 3] = (vm.xmm[xd + 3] - vm.xmm[xs + 3]) | 0;
      break;
    }
    case Opcode.ADDSUBPD: { // Add/subtract alternating (double)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] + vm.xmm[xs]) | 0;
      vm.xmm[xd + 1] = (vm.xmm[xd + 1] - vm.xmm[xs + 1]) | 0;
      break;
    }
    case Opcode.HADDPS: { // Horizontal add
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xs] + vm.xmm[xs + 1]) | 0;
      vm.xmm[xd + 1] = (vm.xmm[xs + 2] + vm.xmm[xs + 3]) | 0;
      vm.xmm[xd + 2] = (vm.xmm[xd + 2] + vm.xmm[xd + 3]) | 0;
      vm.xmm[xd + 3] = vm.xmm[xd + 2];
      break;
    }
    case Opcode.HSUBPS: { // Horizontal subtract
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xs] - vm.xmm[xs + 1]) | 0;
      vm.xmm[xd + 1] = (vm.xmm[xs + 2] - vm.xmm[xs + 3]) | 0;
      vm.xmm[xd + 2] = (vm.xmm[xd + 2] - vm.xmm[xd + 3]) | 0;
      vm.xmm[xd + 3] = vm.xmm[xd + 2];
      break;
    }
    case Opcode.HADDPD:
    case Opcode.HSUBPD: { // Horizontal add/sub double
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      if (inst.opcode === Opcode.HADDPD) {
        vm.xmm[xd] = (vm.xmm[xs] + vm.xmm[xs + 1]) | 0;
        vm.xmm[xd + 1] = (vm.xmm[xd + 1] + vm.xmm[xd + 2]) | 0;
      } else {
        vm.xmm[xd] = (vm.xmm[xs] - vm.xmm[xs + 1]) | 0;
        vm.xmm[xd + 1] = (vm.xmm[xd + 1] - vm.xmm[xd + 2]) | 0;
      }
      break;
    }
    case Opcode.LDDQU: { // Load unaligned (same as VLOAD)
      const xd = (inst.dst & 3) * 4;
      const base = Number(rsVal & BigInt(RAM_WORDS - 1));
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = Number(BigInt.asIntN(32, vm.ram[(base + lane) & (RAM_WORDS - 1)]));
      }
      break;
    }
    case Opcode.MOVNTDQ: { // Non-temporal store (same as VSTORE)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const base = Number(rdVal & BigInt(RAM_WORDS - 1));
      for (let lane = 0; lane < 4; lane++) {
        vm.ram[(base + lane) & (RAM_WORDS - 1)] = BigInt(vm.xmm[xs + lane]);
      }
      break;
    }
    case Opcode.FADDSS: { // Fused add (FMA-like: Rd + Rs * imm)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] + vm.xmm[xs] * (inst.imm || 1)) | 0;
      break;
    }
    case Opcode.FMULSS: { // Fused multiply (FMA-like: Rd * Rs + imm)
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = (vm.xmm[xd] * vm.xmm[xs] + inst.imm) | 0;
      break;
    }
    case Opcode.MONITOR: { // Set monitor (no-op in VM)
      break;
    }
    case Opcode.MWAIT: { // Monitor wait (no-op in VM)
      break;
    }
    // === Extra SIMD Operations ===
    case Opcode.VSUB: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = (vm.xmm[xd + lane] - vm.xmm[xs + lane]) | 0;
      break;
    }
    case Opcode.VMUL: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = (vm.xmm[xd + lane] * vm.xmm[xs + lane]) | 0;
      break;
    }
    case Opcode.VDIV: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        if (vm.xmm[xs + lane] !== 0) vm.xmm[xd + lane] = (vm.xmm[xd + lane] / vm.xmm[xs + lane]) | 0;
      }
      break;
    }
    case Opcode.VMIN: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = Math.min(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      break;
    }
    case Opcode.VMAX: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = Math.max(vm.xmm[xd + lane], vm.xmm[xs + lane]);
      break;
    }
    case Opcode.VAND: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] & vm.xmm[xs + lane];
      break;
    }
    case Opcode.VOR: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] | vm.xmm[xs + lane];
      break;
    }
    case Opcode.VSHUFFLE: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const imm = inst.imm & 0xF;
      vm.xmm[xd] = vm.xmm[xs + (imm & 3)];
      vm.xmm[xd + 1] = vm.xmm[xs + ((imm >> 2) & 3)];
      vm.xmm[xd + 2] = vm.xmm[xs + ((imm >> 4) & 3)];
      vm.xmm[xd + 3] = vm.xmm[xs + ((imm >> 6) & 3)];
      break;
    }
    case Opcode.VUNPCKH: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs + 2]; vm.xmm[xd + 1] = vm.xmm[xs + 3];
      break;
    }
    case Opcode.VUNPCKL: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd + 2] = vm.xmm[xs]; vm.xmm[xd + 3] = vm.xmm[xs + 1];
      break;
    }
    case Opcode.VMOVMSK: {
      const xs = (inst.src & 3) * 4;
      let mask = 0;
      for (let lane = 0; lane < 4; lane++) if (vm.xmm[xs + lane] < 0) mask |= (1 << lane);
      vm.regs[inst.dst] = maskSigned(BigInt(mask), bitWidth);
      break;
    }
    case Opcode.VMOV: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xs + lane];
      break;
    }
    case Opcode.VMOVHL: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd] = vm.xmm[xs + 2]; vm.xmm[xd + 1] = vm.xmm[xs + 3];
      break;
    }
    case Opcode.VMOVLH: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      vm.xmm[xd + 2] = vm.xmm[xs]; vm.xmm[xd + 3] = vm.xmm[xs + 1];
      break;
    }
    case Opcode.VCMPEQ: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] === vm.xmm[xs + lane] ? -1 : 0;
      break;
    }
    case Opcode.VCMPLT: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] < vm.xmm[xs + lane] ? -1 : 0;
      break;
    }
    case Opcode.VCMPLE: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] <= vm.xmm[xs + lane] ? -1 : 0;
      break;
    }
    case Opcode.VABS: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = Math.abs(vm.xmm[xd + lane]);
      break;
    }
    case Opcode.VNEG: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = -vm.xmm[xd + lane];
      break;
    }
    case Opcode.VSQRT: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = Math.sqrt(Math.abs(vm.xmm[xd + lane])) | 0;
      break;
    }
    case Opcode.VRSQRT: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] !== 0 ? (1 / Math.sqrt(Math.abs(vm.xmm[xd + lane]))) | 0 : 0;
      }
      break;
    }
    case Opcode.VRCPPS: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        vm.xmm[xd + lane] = vm.xmm[xd + lane] !== 0 ? (1 / vm.xmm[xd + lane]) | 0 : 0;
      }
      break;
    }
    case Opcode.VEXTRACT: {
      const xs = (inst.src & 3) * 4;
      const lane = inst.imm & 3;
      vm.regs[inst.dst] = maskSigned(BigInt(vm.xmm[xs + lane]), bitWidth);
      break;
    }
    case Opcode.VINSERT: {
      const xd = (inst.dst & 3) * 4;
      const lane = inst.imm & 3;
      vm.xmm[xd + lane] = Number(BigInt.asIntN(32, rsVal));
      break;
    }
    case Opcode.VBLEND: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const mask = inst.imm & 0xF;
      for (let lane = 0; lane < 4; lane++) {
        if (mask & (1 << lane)) vm.xmm[xd + lane] = vm.xmm[xs + lane];
      }
      break;
    }
    case Opcode.VPERM: {
      const xd = (inst.dst & 3) * 4;
      const xs = (inst.src & 3) * 4;
      const imm = inst.imm & 0xF;
      vm.xmm[xd] = vm.xmm[xs + (imm & 3)];
      vm.xmm[xd + 1] = vm.xmm[xs + ((imm >> 2) & 3)];
      vm.xmm[xd + 2] = vm.xmm[xs + ((imm >> 4) & 3)];
      vm.xmm[xd + 3] = vm.xmm[xs + ((imm >> 6) & 3)];
      break;
    }
    case Opcode.VSHL: {
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = (vm.xmm[xd + lane] << sh) | 0;
      break;
    }
    case Opcode.VSHR: {
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) vm.xmm[xd + lane] = vm.xmm[xd + lane] >>> sh;
      break;
    }
    case Opcode.VROL: {
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) {
        let v = vm.xmm[xd + lane] >>> 0;
        vm.xmm[xd + lane] = ((v << sh) | (v >> (32 - sh))) | 0;
      }
      break;
    }
    case Opcode.VROR: {
      const xd = (inst.dst & 3) * 4;
      const sh = inst.imm & 31;
      for (let lane = 0; lane < 4; lane++) {
        let v = vm.xmm[xd + lane] >>> 0;
        vm.xmm[xd + lane] = ((v >> sh) | (v << (32 - sh))) | 0;
      }
      break;
    }
    case Opcode.VPOPCNT: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let v = vm.xmm[xd + lane] >>> 0;
        let c = 0;
        while (v) { c += v & 1; v >>= 1; }
        vm.xmm[xd + lane] = c;
      }
      break;
    }
    case Opcode.VBSWAP: {
      const xd = (inst.dst & 3) * 4;
      for (let lane = 0; lane < 4; lane++) {
        let v = vm.xmm[xd + lane] >>> 0;
        vm.xmm[xd + lane] = ((v >> 24) | ((v >> 8) & 0xFF00) | ((v << 8) & 0xFF0000) | (v << 24)) | 0;
      }
      break;
    }
    // === Extra Flow & Memory ===
    case Opcode.JGE: {
      if (!vm.cf || vm.sf || vm.zf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    }
    case Opcode.JLE: {
      if (vm.cf !== vm.sf || vm.zf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    }
    case Opcode.JG: {
      if (!vm.zf && vm.cf === vm.sf) {
        vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
        jumped = true;
      }
      break;
    }
    case Opcode.CALL: {
      // Push current IP onto stack (RAM)
      const sp = Number(vm.regs[7] & BigInt(RAM_WORDS - 1));
      vm.ram[sp] = BigInt(idx);
      vm.regs[7] = maskSigned(BigInt((sp + 1) % RAM_WORDS), bitWidth);
      vm.ip = ((inst.imm % PROG_LEN) + PROG_LEN) % PROG_LEN;
      jumped = true;
      break;
    }
    case Opcode.RET: {
      // Pop IP from stack
      const sp = Number((vm.regs[7] - 1n) & BigInt(RAM_WORDS - 1));
      vm.regs[7] = maskSigned(BigInt(sp), bitWidth);
      vm.ip = Number(BigInt.asUintN(32, vm.ram[sp])) % PROG_LEN;
      jumped = true;
      break;
    }
    case Opcode.PUSH: {
      const sp = Number(vm.regs[7] & BigInt(RAM_WORDS - 1));
      vm.ram[sp] = rsVal;
      vm.regs[7] = maskSigned(BigInt((sp + 1) % RAM_WORDS), bitWidth);
      break;
    }
    case Opcode.POP: {
      const sp = Number((vm.regs[7] - 1n) & BigInt(RAM_WORDS - 1));
      vm.regs[7] = maskSigned(BigInt(sp), bitWidth);
      vm.regs[inst.dst] = maskSigned(vm.ram[sp], bitWidth);
      break;
    }
    case Opcode.CMOVE:
    case Opcode.CMOVNE:
    case Opcode.CMOVGE:
    case Opcode.CMOVLE:
    case Opcode.CMOVG: {
      let cond = false;
      switch (inst.opcode) {
        case Opcode.CMOVE: cond = vm.zf; break;
        case Opcode.CMOVNE: cond = !vm.zf; break;
        case Opcode.CMOVGE: cond = !vm.cf || vm.sf || vm.zf; break;
        case Opcode.CMOVLE: cond = vm.cf !== vm.sf || vm.zf; break;
        case Opcode.CMOVG: cond = !vm.zf && vm.cf === vm.sf; break;
      }
      if (cond) vm.regs[inst.dst] = maskSigned(rsVal, bitWidth);
      break;
    }
    // === Extra ALU ===
    case Opcode.IMUL: {
      vm.regs[inst.dst] = maskSigned(rdVal * rsVal, bitWidth);
      break;
    }
    case Opcode.SAL: {
      vm.regs[inst.dst] = maskSigned(rdVal << BigInt(inst.imm & 7), bitWidth);
      break;
    }
    case Opcode.SAR: {
      vm.regs[inst.dst] = maskSigned(rdVal >> BigInt(inst.imm & 7), bitWidth);
      break;
    }
    case Opcode.SETC: {
      vm.regs[inst.dst] = maskSigned(vm.cf ? 1n : 0n, bitWidth);
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
  _options: { dualCore?: boolean; isCoCore?: boolean; forceSense?: boolean } = {}
): Uint8Array {
  const g = new Uint8Array(PROG_LEN * 4);
  for (let i = 0; i < PROG_LEN; i++) {
    let op: Opcode;
    // Force SENSE op eerste instructies als forceSense is gezet (voor arena)
    if (_options.forceSense && (i === 0 || i === 1)) {
      op = Opcode.SENSE;
    } else {
      op = sampleNeutralCpuOpcode(rng);
    }
    const dst = Math.floor(rng() * 8);
    const src = _options.forceSense && (i === 0 || i === 1) ? Math.floor(rng() * 4) : Math.floor(rng() * 8);
    const imm = Math.floor(rng() * 48) - 16;
    encodeInstruction(g, i, op, dst, src, imm);
  }
  return g;
}

export function createStarterGenome(taskId: TaskId): Uint8Array {
  const g = new Uint8Array(PROG_LEN * 4);
  if (taskId === 'homeostasis') {
    // Thermisch evenwicht-strategie: temp dicht bij 52°C, queue laag, energy > 25
    // P0=temp, P1=queue, P2=energy, P3=temp-55, P4=queue-40
    // Actie: 0=Rust (temp↓, energy↑, queue↑), 1=Normaal (temp↑, queue↓),
    //        2=Turbo (temp↑↑, queue↓↓), 3=Koelen (temp↓↓, energy↓)
    // Strategie: P3 (temp-55) gebruiken als hoofdsensor.
    // Als P3 > 0 (temp > 55) -> koelen (actie 3).
    // Als P3 < -10 (temp < 45) -> normaal (actie 1) om op te warmen.
    // Als energy < 30 -> rust (actie 0) om energie op te laden.
    // Als queue > 50 -> turbo (actie 2) om queue te verwerken.
    // Anders -> rust (actie 0) als veilige default.
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);   // R0 = temp
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);   // R1 = queue
    encodeInstruction(g, 2, Opcode.SENSE, 2, 2, 0);   // R2 = energy
    encodeInstruction(g, 3, Opcode.SENSE, 3, 3, 0);   // R3 = temp-55 (relatief)
    encodeInstruction(g, 4, Opcode.MOVI, 4, 0, 0);    // R4 = 0 (nulpunt)
    encodeInstruction(g, 5, Opcode.CMP, 3, 4, 0);     // CMP temp-55 0
    encodeInstruction(g, 6, Opcode.JLT, 0, 0, 16);    // als temp <= 55 -> check koud (@16)
    // Temp > 55: koelen!
    encodeInstruction(g, 7, Opcode.MOVI, 5, 0, 3);    // R5 = 3 (koelen)
    encodeInstruction(g, 8, Opcode.ACT, 0, 5, 0);     // ACT 3
    encodeInstruction(g, 9, Opcode.JMP, 0, 0, 24);    // einde (@24)
    encodeInstruction(g, 10, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 11, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 12, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 13, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 14, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 15, Opcode.NOP, 0, 0, 0);    // padding
    // Temp <= 55: check of te koud
    encodeInstruction(g, 16, Opcode.MOVI, 6, 0, 10);  // R6 = 10 (drempel)
    encodeInstruction(g, 17, Opcode.NEG, 7, 3, 0);    // R7 = -(temp-55) = 55-temp
    encodeInstruction(g, 18, Opcode.CMP, 7, 6, 0);    // CMP 55-temp 10
    encodeInstruction(g, 19, Opcode.JLT, 0, 0, 20);   // als 55-temp > 10 (temp < 45) -> opwarmen
    // Normale temp: check energy
    encodeInstruction(g, 20, Opcode.MOVI, 6, 0, 30);  // R6 = 30 (energy drempel)
    encodeInstruction(g, 21, Opcode.CMP, 2, 6, 0);    // CMP energy 30
    encodeInstruction(g, 22, Opcode.JLT, 0, 0, 23);   // als energy < 30 -> rust
    encodeInstruction(g, 23, Opcode.MOVI, 5, 0, 0);   // R5 = 0 (rust - default)
    encodeInstruction(g, 24, Opcode.ACT, 0, 5, 0);    // ACT R5
    encodeInstruction(g, 25, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 26, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 27, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 28, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 29, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 30, Opcode.NOP, 0, 0, 0);    // padding
    encodeInstruction(g, 31, Opcode.NOP, 0, 0, 0);    // padding
  } else if (taskId === 'arena') {
    // Arena-navigator: navigeert naar energiebronnen via DeltaX/DeltaY sensoren.
    // P0 = DX energiebron (bx-ax), P1 = DY energiebron (by-ay)
    // Actie: 0=Noord(Y-1), 1=Oost(X+1), 2=Zuid(Y+1), 3=West(X-1)
    // Strategie: |DX| vs |DY| vergelijken; grootste delta eerst aanpakken, teken bepaalt richting.
    // R0=DX_energie, R1=DY_energie, R4=|DX|, R5=actie, R6=|DY|, R7=0 (nul constant)
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);   // R0 = DX (bx - ax)
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);   // R1 = DY (by - ay)
    encodeInstruction(g, 2, Opcode.ABS, 4, 0, 0);     // R4 = |DX|
    encodeInstruction(g, 3, Opcode.ABS, 6, 1, 0);     // R6 = |DY|
    encodeInstruction(g, 4, Opcode.CMP, 4, 6, 0);     // CMP |DX| |DY| -> CF als |DX| < |DY|
    encodeInstruction(g, 5, Opcode.JLT, 0, 0, 10);    // als |DX| < |DY| -> Y eerst (@10)
    // X eerst (|DX| >= |DY|)
    encodeInstruction(g, 6, Opcode.MOVI, 7, 0, 0);    // R7 = 0 (constant voor vergelijking)
    encodeInstruction(g, 7, Opcode.CMP, 0, 7, 0);     // CMP DX 0 -> CF als DX < 0
    encodeInstruction(g, 8, Opcode.JLT, 0, 0, 12);    // als DX < 0 -> West (@12)
    encodeInstruction(g, 9, Opcode.MOVI, 5, 0, 1);    // R5 = 1 (Oost)
    encodeInstruction(g, 10, Opcode.JMP, 0, 0, 18);   // naar ACT (@18)
    encodeInstruction(g, 11, Opcode.NOP, 0, 0, 0);     // padding
    encodeInstruction(g, 12, Opcode.MOVI, 5, 0, 3);   // R5 = 3 (West)
    encodeInstruction(g, 13, Opcode.JMP, 0, 0, 18);   // naar ACT (@18)
    // Y eerst (|DX| < |DY|)
    encodeInstruction(g, 14, Opcode.CMP, 1, 7, 0);    // CMP DY 0 -> CF als DY < 0
    encodeInstruction(g, 15, Opcode.JLT, 0, 0, 17);   // als DY < 0 -> Noord (@17)
    encodeInstruction(g, 16, Opcode.MOVI, 5, 0, 2);   // R5 = 2 (Zuid)
    encodeInstruction(g, 17, Opcode.JMP, 0, 0, 18);   // naar ACT (@18)
    encodeInstruction(g, 18, Opcode.MOVI, 5, 0, 0);   // R5 = 0 (Noord - fallback)
    encodeInstruction(g, 19, Opcode.ACT, 0, 5, 0);    // ACT R5
    // Rest NOP
    for (let i = 20; i < PROG_LEN; i++) {
      encodeInstruction(g, i, Opcode.NOP, 0, 0, 0);
    }
  } else if (taskId === 'ecosystem') {
    // Ecosysteem: navigeer naar het huisje (links-boven zone 0-7, 0-7) als fallback.
    // P4=energy, P5=tick, P6=zone-ID, P7=huisje-richting (4-bit encoding)
    // P7 encoding: bit3=DX<0 (8), bit2=DX>0 (4), bit1=DY<0 (2), bit0=DY>0 (1)
    // Decode P7 naar actie: 0=Noord, 1=Oost, 2=Zuid, 3=West
    // Strategie: lees P7, check DX eerst (bit 2/3), dan DY (bit 0/1)
    // Als DX != 0: beweeg X-richting (Oost=1 als DX>0, West=3 als DX<0)
    // Als DX == 0: beweeg Y-richting (Noord=0 als DY<0, Zuid=2 als DY>0)
    encodeInstruction(g, 0, Opcode.SENSE, 0, 7, 0);   // R0 = P7 (houseDir encoding)
    encodeInstruction(g, 1, Opcode.MOVI, 1, 0, 4);     // R1 = 4 (mask voor DX>0 bit)
    encodeInstruction(g, 2, Opcode.AND, 1, 0, 1);      // R1 = R0 & 4 (DX>0?)
    encodeInstruction(g, 3, Opcode.MOVI, 2, 0, 8);     // R2 = 8 (mask voor DX<0 bit)
    encodeInstruction(g, 4, Opcode.AND, 2, 0, 2);      // R2 = R0 & 8 (DX<0?)
    encodeInstruction(g, 5, Opcode.CMP, 1, 2, 0);      // CMP R1, R2 (DX>0 vs DX<0)
    encodeInstruction(g, 6, Opcode.JLT, 0, 0, 10);     // als DX>0 < DX<0 → DX<0, ga West (@10)
    encodeInstruction(g, 7, Opcode.JNZ, 0, 0, 8);      // als R1 != 0 → DX>0, ga Oost (@8)
    encodeInstruction(g, 8, Opcode.JMP, 0, 0, 12);     // DX==0, check Y (@12)
    encodeInstruction(g, 9, Opcode.MOVI, 3, 0, 1);     // R3 = 1 (Oost)
    encodeInstruction(g, 10, Opcode.JMP, 0, 0, 14);    // naar ACT (@14)
    encodeInstruction(g, 11, Opcode.MOVI, 3, 0, 3);    // R3 = 3 (West)
    encodeInstruction(g, 12, Opcode.MOVI, 1, 0, 1);    // R1 = 1 (mask voor DY>0 bit)
    encodeInstruction(g, 13, Opcode.AND, 1, 0, 1);     // R1 = R0 & 1 (DY>0?)
    encodeInstruction(g, 14, Opcode.JNZ, 0, 0, 16);    // als DY>0 → Zuid (@16)
    encodeInstruction(g, 15, Opcode.MOVI, 3, 0, 0);    // R3 = 0 (Noord - fallback)
    encodeInstruction(g, 16, Opcode.JMP, 0, 0, 17);    // naar ACT (@17)
    encodeInstruction(g, 17, Opcode.MOVI, 3, 0, 2);    // R3 = 2 (Zuid)
    encodeInstruction(g, 18, Opcode.ACT, 0, 3, 0);     // ACT R3 (beweeg naar huisje)
    // Rest NOP — evolutie vult de zone-specifieke logica in
    for (let i = 19; i < PROG_LEN; i++) {
      encodeInstruction(g, i, Opcode.NOP, 0, 0, 0);
    }
  } else if (taskId === 'bitstream') {
    // Bitpatroon-cortex: voorspel (bitCurr ^ (bitPrev >> 1)) & 0x0F
    // P0=bitCurr, P1=bitPrev, P2=tick&1, P3=popcount(bitCurr),
    // P4=bitLastErr, P5=bitPred, P6=bitCurr^bitPrev
    // Directe implementatie van de target-formule.
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);   // R0 = bitCurr
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);   // R1 = bitPrev
    encodeInstruction(g, 2, Opcode.SHR, 1, 1, 1);     // R1 = bitPrev >> 1
    encodeInstruction(g, 3, Opcode.XOR, 0, 1, 0);     // R0 = bitCurr ^ (bitPrev >> 1)
    encodeInstruction(g, 4, Opcode.MOVI, 2, 0, 15);   // R2 = 0x0F (mask)
    encodeInstruction(g, 5, Opcode.AND, 0, 2, 0);     // R0 = R0 & 0x0F (4-bit resultaat)
    encodeInstruction(g, 6, Opcode.ACT, 0, 0, 0);     // ACT R0 (voorspelling)
    // Rest NOP
    for (let i = 7; i < PROG_LEN; i++) {
      encodeInstruction(g, i, Opcode.NOP, 0, 0, 0);
    }
  } else {
    // Open Hardware-Bus: voorspel ((hwStreamA ^ hwStreamB) + (dP0 >> 1)) & 0x0F
    // P0=hwStreamA, P1=hwStreamB, P2=hwInputWord, P3=hwMask,
    // P4=dP0 (streamA - prevA), P5=lastAction
    // Directe implementatie van de target-formule.
    encodeInstruction(g, 0, Opcode.SENSE, 0, 0, 0);   // R0 = hwStreamA
    encodeInstruction(g, 1, Opcode.SENSE, 1, 1, 0);   // R1 = hwStreamB
    encodeInstruction(g, 2, Opcode.SENSE, 2, 4, 0);   // R2 = dP0 (streamA - prevA)
    encodeInstruction(g, 3, Opcode.XOR, 0, 1, 0);     // R0 = hwStreamA ^ hwStreamB
    encodeInstruction(g, 4, Opcode.SHR, 2, 2, 1);     // R2 = dP0 >> 1
    encodeInstruction(g, 5, Opcode.ADD, 0, 2, 0);     // R0 = (A ^ B) + (dP0 >> 1)
    encodeInstruction(g, 6, Opcode.MOVI, 3, 0, 15);   // R3 = 0x0F (4-bit mask)
    encodeInstruction(g, 7, Opcode.AND, 0, 3, 0);     // R0 = R0 & 0x0F
    encodeInstruction(g, 8, Opcode.ACT, 0, 0, 0);     // ACT R0 (voorspelling)
    // Rest NOP
    for (let i = 9; i < PROG_LEN; i++) {
      encodeInstruction(g, i, Opcode.NOP, 0, 0, 0);
    }
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
    // Ecosystem defaults (overwritten when taskId === 'ecosystem')
    ecoZone: -1,
    ecoHouseX: 4,
    ecoHouseY: 4,
    ecoEnergyNodes: [],
    ecoHazards: [],
    ecoBitCurr: 0,
    ecoBitPrev: 0,
    ecoHwStreamA: 0,
    ecoHwStreamB: 0,
    ecoTemp: regime.temp,
    ecoQueue: regime.queue,
    ecoZoneScores: [0, 0, 0, 0],
    ecoZoneWeights: [0.8, 1.0, 1.5, 1.5],
    ecoTrail: [],
    ecoNodesCollected: 0,
    ecoHazardHits: 0,
    ecoBitExactHits: 0,
    ecoHwExactHits: 0,
  };

  // Ecosystem-specific initialization
  if (taskId === 'ecosystem') {
    env.ecoHouseX = 4;
    env.ecoHouseY = 4;
    env.ecoEnergyNodes = [];
    env.ecoHazards = [];
    for (let i = 0; i < 6; i++) {
      // Place energy nodes in forest zone (16-23, 0-7)
      env.ecoEnergyNodes.push({ x: 16 + Math.floor(rng() * 8), y: Math.floor(rng() * 8) });
    }
    for (let i = 0; i < 4; i++) {
      // Place hazards in forest zone
      const hx = 16 + Math.floor(rng() * 8);
      const hy = Math.floor(rng() * 8);
      if (hx !== env.agentX || hy !== env.agentY) env.ecoHazards.push({ x: hx, y: hy });
    }
    env.ecoBitCurr = Math.floor(rng() * 16);
    env.ecoBitPrev = Math.floor(rng() * 16);
    env.ecoHwStreamA = Math.floor(rng() * 64);
    env.ecoHwStreamB = Math.floor(rng() * 32);
    env.ecoTemp = regime.temp;
    env.ecoQueue = regime.queue;
    env.ecoZoneScores = [0, 0, 0, 0];
    env.ecoZoneWeights = [0.8, 1.0, 1.5, 1.5];
    env.ecoTrail = [{ x: 8, y: 8 }];
    env.ecoNodesCollected = 0;
    env.ecoHazardHits = 0;
    env.ecoBitExactHits = 0;
    env.ecoHwExactHits = 0;
    // Detect initial zone
    env.ecoZone = getEcosystemZone(env.agentX, env.agentY);
  }

  updateEnvPorts(env);
  return env;
}

function getEcosystemZone(x: number, y: number): number {
  if (x < 8 && y < 8) return 0; // House (top-left)
  if (x >= 16 && y < 8) return 1; // Forest (top-right)
  if (x < 8 && y >= 16) return 2; // Puzzle stones (bottom-left)
  if (x >= 16 && y >= 16) return 3; // Sensor tower (bottom-right)
  return -1; // Transition zone (between zones)
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
  } else if (env.taskId === 'ecosystem') {
    // Ecosystem: zone-specific P0-P3 + general P4-P7
    const zone = env.ecoZone;
    const p0p3: number[] = [0, 0, 0, 0];
    
    if (zone === 0) {
      // House zone - homeostasis sensors
      p0p3[0] = Math.round(env.ecoTemp);
      p0p3[1] = Math.round(env.ecoQueue);
      p0p3[2] = Math.round(env.ecoTemp - 55);
      p0p3[3] = env.lastAction;
    } else if (zone === 1) {
      // Forest zone - arena sensors (energy nodes)
      let bestNode = env.ecoEnergyNodes[0] || { x: 20, y: 4 };
      let bestNodeDist = 999;
      for (const n of env.ecoEnergyNodes) {
        const d = Math.abs(n.x - env.agentX) + Math.abs(n.y - env.agentY);
        if (d < bestNodeDist) { bestNodeDist = d; bestNode = n; }
      }
      let bestHaz = env.ecoHazards[0] || { x: 20, y: 4 };
      let bestHazDist = 999;
      for (const h of env.ecoHazards) {
        const d = Math.abs(h.x - env.agentX) + Math.abs(h.y - env.agentY);
        if (d < bestHazDist) { bestHazDist = d; bestHaz = h; }
      }
      p0p3[0] = bestNode.x - env.agentX;
      p0p3[1] = bestNode.y - env.agentY;
      p0p3[2] = bestHaz.x - env.agentX;
      p0p3[3] = bestHaz.y - env.agentY;
    } else if (zone === 2) {
      // Puzzle stones - bitstream sensors
      p0p3[0] = env.ecoBitCurr;
      p0p3[1] = env.ecoBitPrev;
      p0p3[2] = env.tick & 1;
      p0p3[3] = popcount4(env.ecoBitCurr);
    } else if (zone === 3) {
      // Sensor tower - hardware bus sensors
      p0p3[0] = env.ecoHwStreamA;
      p0p3[1] = env.ecoHwStreamB;
      p0p3[2] = (env.ecoHwStreamA ^ env.ecoHwStreamB) & 0xff;
      p0p3[3] = env.hwMask;
    }
    // General sensors P4-P7
    const houseDX = env.ecoHouseX - env.agentX;
    const houseDY = env.ecoHouseY - env.agentY;
    // Encode house direction in P7: pack DX sign (bit 3) and DY sign (bit 2)
    const houseDir = ((houseDX < 0 ? 8 : 0) | (houseDX > 0 ? 4 : 0) | (houseDY < 0 ? 2 : 0) | (houseDY > 0 ? 1 : 0));
    env.ports = [
      p0p3[0],
      p0p3[1],
      p0p3[2],
      p0p3[3],
      Math.round(env.energy),
      env.tick & 0xff,
      Math.max(0, zone),
      houseDir,
    ];
  } else {
    // hardware
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
  } else if (env.taskId === 'ecosystem') {
    // Ecosystem: zone-based sub-task with weighted rewards
    // Detect current zone based on avatar position
    const prevZone = env.ecoZone;
    const newZone = getEcosystemZone(env.agentX, env.agentY);
    env.ecoZone = newZone;

    // Energy decreases per tick
    env.energy = Math.max(0, env.energy - 0.8);

    // Navigation: interpret action based on zone
    const act = rawAction;
    env.lastAction = act;

    let zoneReward = 0;
    let zoneIdx = -1;

    if (newZone === 0) {
      // === HOUSE ZONE: Homeostasis (weight ×0.8) ===
      zoneIdx = 0;
      const hAct = ((act % 4) + 4) % 4;
      const incomingLoad = 4 + Math.floor(rng() * 6) + (env.tick % 9 === 0 ? 15 : 0);

      if (disturbance.tempSpike) env.ecoTemp += disturbance.tempSpike;
      if (disturbance.energyDip) env.energy -= disturbance.energyDip;

      if (hAct === 0) {
        env.ecoTemp -= 5;
        env.energy += 8;
        env.ecoQueue += incomingLoad;
      } else if (hAct === 1) {
        env.ecoTemp += 2.0;
        env.energy -= 3.0;
        env.ecoQueue += incomingLoad - 7;
      } else if (hAct === 2) {
        env.ecoTemp += 7.0;
        env.energy -= 7.5;
        env.ecoQueue += incomingLoad - 16;
      } else {
        env.ecoTemp -= 10;
        env.energy -= 4.5;
        env.ecoQueue += incomingLoad - 2;
      }

      env.ecoTemp += (32 - env.ecoTemp) * 0.04;
      env.ecoTemp = Math.max(15, Math.min(105, env.ecoTemp));
      env.ecoQueue = Math.max(0, Math.min(100, env.ecoQueue));
      env.energy = Math.max(0, Math.min(100, env.energy));

      if (env.ecoTemp >= 96 || env.energy <= 3) {
        zoneReward = -50;
      } else {
        const tempScore = Math.max(0, 12 - Math.abs(env.ecoTemp - 52) * 0.45);
        const queueScore = Math.max(0, 10 - env.ecoQueue * 0.22);
        const energyScore = env.energy > 25 ? 6 : -8;
        zoneReward = tempScore + queueScore + energyScore;
      }
    } else if (newZone === 1) {
      // === FOREST ZONE: Arena navigation (weight ×1.0) ===
      zoneIdx = 1;
      const aAct = ((act % 4) + 4) % 4;

      let prevMinDist = 999;
      for (const n of env.ecoEnergyNodes) {
        const d = Math.abs(n.x - env.agentX) + Math.abs(n.y - env.agentY);
        if (d < prevMinDist) prevMinDist = d;
      }

      let nx = env.agentX;
      let ny = env.agentY;
      if (aAct === 0) ny -= 1;
      else if (aAct === 1) nx += 1;
      else if (aAct === 2) ny += 1;
      else nx -= 1;

      // Clamp to 24x24 grid
      let hitWall = false;
      if (nx < 0 || nx > 23 || ny < 0 || ny > 23) {
        hitWall = true;
        nx = Math.max(0, Math.min(23, nx));
        ny = Math.max(0, Math.min(23, ny));
      }

      env.agentX = nx;
      env.agentY = ny;
      env.ecoTrail.push({ x: nx, y: ny });
      if (env.ecoTrail.length > 36) env.ecoTrail.shift();

      if (hitWall) zoneReward -= 3.5;

      let newMinDist = 999;
      for (let i = 0; i < env.ecoEnergyNodes.length; i++) {
        const n = env.ecoEnergyNodes[i];
        if (n.x === nx && n.y === ny) {
          env.ecoNodesCollected += 1;
          env.energy = Math.min(100, env.energy + 25);
          zoneReward += 30;
          // Respawn energy node in forest zone
          env.ecoEnergyNodes[i] = { x: 16 + Math.floor(rng() * 8), y: Math.floor(rng() * 8) };
        }
        const d = Math.abs(env.ecoEnergyNodes[i].x - nx) + Math.abs(env.ecoEnergyNodes[i].y - ny);
        if (d < newMinDist) newMinDist = d;
      }

      zoneReward += (prevMinDist - newMinDist) * 2.5 + Math.max(0, 14 - newMinDist) * 0.45;

      for (const h of env.ecoHazards) {
        if (h.x === nx && h.y === ny) {
          env.ecoHazardHits += 1;
          env.energy = Math.max(0, env.energy - 22);
          zoneReward -= 18;
        }
      }
    } else if (newZone === 2) {
      // === PUZZLE STONES: Bitstream prediction (weight ×1.5) ===
      zoneIdx = 2;
      const pred = act & 0x0f;
      const target = (env.ecoBitCurr ^ (env.ecoBitPrev >> 1)) & 0x0f;
      const bitErr = popcount4(pred ^ target);
      const exact = pred === target;
      if (exact) env.ecoBitExactHits += 1;
      zoneReward = (4 - bitErr) * 4 + (exact ? 10 : 0);

      // Advance bitstream
      const nextByte = (Math.floor(rng() * 16) + (disturbance.loadSpike ? 7 : 0)) & 0x0f;
      env.ecoBitPrev = env.ecoBitCurr;
      env.ecoBitCurr = nextByte;
    } else if (newZone === 3) {
      // === SENSOR TOWER: Hardware bus prediction (weight ×1.5) ===
      zoneIdx = 3;
      const pred = act & 0x0f;
      const dP0 = env.ecoHwStreamA - (env.ecoHwStreamA - Math.floor(rng() * 10)); // approximate delta
      const target = ((env.ecoHwStreamA ^ env.ecoHwStreamB) + (dP0 >> 1)) & 0x0f;
      const bitErr = popcount4(pred ^ target);
      const exact = pred === target;
      if (exact) env.ecoHwExactHits += 1;
      zoneReward = (4 - bitErr) * 4 + (exact ? 10 : 0);

      // Advance hardware signals
      const stepOsc = Math.round(32 + 24 * Math.sin(env.tick * 0.45 + (rng() - 0.5) * 0.6));
      env.ecoHwStreamA = (stepOsc + (disturbance.loadSpike ?? 0)) & 0xff;
      env.ecoHwStreamB = Math.floor(rng() * 32) ^ (env.ecoHwStreamA & 0x0f);
    } else {
      // === TRANSITION ZONE: between zones ===
      // Allow navigation (action 0-3 = direction)
      const aAct = ((act % 4) + 4) % 4;
      let nx = env.agentX;
      let ny = env.agentY;
      if (aAct === 0) ny -= 1;
      else if (aAct === 1) nx += 1;
      else if (aAct === 2) ny += 1;
      else nx -= 1;

      // Clamp to 24x24 grid
      if (nx < 0 || nx > 23 || ny < 0 || ny > 23) {
        nx = Math.max(0, Math.min(23, nx));
        ny = Math.max(0, Math.min(23, ny));
      }

      env.agentX = nx;
      env.agentY = ny;
      env.ecoTrail.push({ x: nx, y: ny });
      if (env.ecoTrail.length > 36) env.ecoTrail.shift();

      // Reward navigation toward a zone
      const distToHouse = Math.abs(env.ecoHouseX - nx) + Math.abs(env.ecoHouseY - ny);
      const distToForest = Math.abs(20 - nx) + Math.abs(4 - ny);
      const distToPuzzle = Math.abs(4 - nx) + Math.abs(20 - ny);
      const distToTower = Math.abs(20 - nx) + Math.abs(20 - ny);
      const minZoneDist = Math.min(distToHouse, distToForest, distToPuzzle, distToTower);
      zoneReward = Math.max(0, 8 - minZoneDist * 0.3);
    }

    // Apply zone weight
    if (zoneIdx >= 0) {
      const weight = env.ecoZoneWeights[zoneIdx];
      zoneReward *= weight;
      env.ecoZoneScores[zoneIdx] += zoneReward;
    }

    // Reward for returning to house zone
    if (newZone === 0 && prevZone !== 0) {
      zoneReward += 5; // Bonus for returning home
    }

    // Reward for zone change (exploration)
    if (newZone !== prevZone && newZone >= 0 && prevZone >= 0) {
      zoneReward += 2; // Small bonus for exploring new zones
    }

    reward += zoneReward;

    if (env.energy <= 0) {
      env.alive = false;
      reward -= 25;
    }

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
  allowSmc?: boolean; // Als true: PWRITE-injectie wordt ingeschakeld
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

  // Gerichte SENSE-injectie: 40% kans om een SENSE-instructie toe te voegen
  // Alleen op NOP-slots om de werkende code van starter genomes niet te vernietigen
  if (rng() < 0.40) {
    // Zoek een NOP-slot om te overschrijven
    const nopSlots: number[] = [];
    for (let i = 0; i < PROG_LEN; i++) {
      if (child[i * 4] === Opcode.NOP) nopSlots.push(i);
    }
    if (nopSlots.length > 0) {
      const senseSlot = nopSlots[Math.floor(rng() * nopSlots.length)];
      encodeInstruction(
        child,
        senseSlot,
        Opcode.SENSE,
        Math.floor(rng() * 8),
        Math.floor(rng() * 4),  // P0..P3 (sensor ports)
        0
      );
    }
  }

  // Gerichte PWRITE-injectie: 20% kans als SMC is ingeschakeld
  // Alleen op NOP-slots om de werkende code niet te vernietigen
  if (opts.allowSmc && rng() < 0.20) {
    const nopSlots: number[] = [];
    for (let i = 0; i < PROG_LEN; i++) {
      if (child[i * 4] === Opcode.NOP) nopSlots.push(i);
    }
    if (nopSlots.length > 0) {
      const pwriteSlot = nopSlots[Math.floor(rng() * nopSlots.length)];
      // PWRITE [Rd], Rs — schrijf Rs naar eigen code op adres Rd
      let targetSlot = Math.floor(rng() * PROG_LEN);
      if (targetSlot === pwriteSlot) targetSlot = (targetSlot + 1) % PROG_LEN;
      encodeInstruction(
        child,
        pwriteSlot,
        Opcode.PWRITE,
        targetSlot,  // Rd = doeladres in eigen code
        Math.floor(rng() * 8),  // Rs = waarde om te schrijven
        0
      );
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
    taskId === 'homeostasis' ? 0 : taskId === 'arena' ? 29 : taskId === 'bitstream' ? 53 : taskId === 'hardware' ? 71 : 95;
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

  const eliteCount = Math.max(2, Math.floor(popSize / 8));
  const parentSpan = Math.max(4, Math.floor(popSize * 0.33));
  const freshImmigrants = Math.max(2, Math.floor(popSize * 0.08));
  const nextPopulation: Agent[] = [];
  const seenElites = new Set<string>();
  const TOURNAMENT_SIZE = 5;

  // Toernooiselectie helper
  const tournamentSelect = () => {
    let best = Math.floor(rng() * popSize);
    for (let t = 1; t < TOURNAMENT_SIZE; t++) {
      const candidate = Math.floor(rng() * popSize);
      if (indexed[candidate].agent.fitness > indexed[best].agent.fitness) best = candidate;
    }
    return indexed[best];
  };

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

  // Versie met forceSense voor arena en ecosystem: 50% random genomes krijgen SENSE
  const forceSense = taskId === 'arena' || taskId === 'ecosystem';
  for (let i = 0; i < freshImmigrants && nextPopulation.length < popSize; i++) {
    // 50% SEED_GENOME + mutatie, 50% volledig random
    if (rng() < 0.50) {
      const seedGenome = new Uint8Array(createStarterGenome(taskId));
      for (let b = 0; b < PROG_LEN * 4; b++) {
        if (rng() < 0.15) seedGenome[b] = Math.floor(rng() * 256);
      }
      nextPopulation.push({
        id: nextPopulation.length,
        genome: seedGenome,
        fitness: 0,
        generationBorn: generation + 1,
      });
    } else {
      nextPopulation.push({
        id: nextPopulation.length,
        genome: createRandomGenome(rng, bitWidth, { dualCore: options.dualCore, isCoCore: false, forceSense }),
        fitness: 0,
        generationBorn: generation + 1,
      });
    }
  }

  // Hogere mutatie in vroege generaties voor meer exploratie
  const adaptiveMutationRate = mutationRate + (generation < 50 ? 0.04 : 0.0);

  while (nextPopulation.length < popSize) {
    const p1 = tournamentSelect();
    const p2 = tournamentSelect();
    const baseGenome =
      rng() < 0.70 ? crossoverGenomes(p1.agent.genome, p2.agent.genome, rng) : p1.agent.genome;
    const mutated = mutateGenome(baseGenome, adaptiveMutationRate, rng, {
      bitWidth,
      dualCore: options.dualCore,
      isCoCore: false,
      activeSlots: p1.activeSlots,
      surgical: rng() < 0.68,
      allowSmc: options.allowSmc,
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
        allowSmc: options.allowSmc,
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
          : taskId === 'ecosystem'
            ? `static double eval_task(const uint8_t *g, uint32_t seed) {
    rng_state = seed ? seed : 1;
    SiliciumVM vm = {0};
    memcpy(vm.active_code, g, PROG_LEN * 4);
    // 24x24 grid, 4 zones: 0=House(0-7,0-7), 1=Forest(16-23,0-7), 2=Puzzle(0-7,16-23), 3=Tower(16-23,16-23)
    int ax = 12, ay = 12; // start in transition zone
    double energy = 82.0, score = 0.0;
    double ecoTemp = 55.0, ecoQueue = 30.0;
    int ecoBitCurr = (int)(xorshift32() & 15), ecoBitPrev = (int)(xorshift32() & 15);
    int ecoHwA = (int)(xorshift32() & 63), ecoHwB = (int)(xorshift32() & 31);
    int ecoNodes[4][2]; // 4 energy nodes in forest
    for (int i = 0; i < 4; i++) { ecoNodes[i][0] = 16 + (int)(xorshift32() % 8); ecoNodes[i][1] = (int)(xorshift32() % 8); }
    int ecoHazards[3][2]; // 3 hazards in forest
    for (int i = 0; i < 3; i++) { ecoHazards[i][0] = 16 + (int)(xorshift32() % 8); ecoHazards[i][1] = (int)(xorshift32() % 8); }
    int prevZone = -1;

    for (int t = 0; t < TICKS; t++) {
        // Zone detection
        int zone = -1;
        if (ax >= 0 && ax <= 7 && ay >= 0 && ay <= 7) zone = 0;
        else if (ax >= 16 && ax <= 23 && ay >= 0 && ay <= 7) zone = 1;
        else if (ax >= 0 && ax <= 7 && ay >= 16 && ay <= 23) zone = 2;
        else if (ax >= 16 && ax <= 23 && ay >= 16 && ay <= 23) zone = 3;

        // Energy decreases per tick
        energy -= 0.8;
        if (energy <= 0.0) { score -= 25.0; break; }

        // Ports: zone-specific P0-P3 + general P4-P7
        int32_t ports[8];
        int hx = 4, hy = 4; // house position
        int dirX = hx - ax, dirY = hy - ay;
        int houseDir = 0;
        if (ax > hx) houseDir = 3; // West
        else if (ax < hx) houseDir = 1; // East
        else if (ay < hy) houseDir = 0; // North
        else if (ay > hy) houseDir = 2; // South

        if (zone == 0) {
            // House: homeostasis sensors
            ports[0] = (int32_t)ecoTemp; ports[1] = (int32_t)ecoQueue;
            ports[2] = (int32_t)energy; ports[3] = (int32_t)(ecoTemp - 55.0);
        } else if (zone == 1) {
            // Forest: arena sensors (nearest energy node)
            int bnd = 999, bx = ecoNodes[0][0], by = ecoNodes[0][1];
            for (int i = 0; i < 4; i++) { int d = (ax>ecoNodes[i][0]?ax-ecoNodes[i][0]:ecoNodes[i][0]-ax)+(ay>ecoNodes[i][1]?ay-ecoNodes[i][1]:ecoNodes[i][1]-ay); if (d<bnd){bnd=d;bx=ecoNodes[i][0];by=ecoNodes[i][1];} }
            ports[0] = bx - ax; ports[1] = by - ay;
            int bhd = 999, bhx = ecoHazards[0][0], bhy = ecoHazards[0][1];
            for (int i = 0; i < 3; i++) { int d = (ax>ecoHazards[i][0]?ax-ecoHazards[i][0]:ecoHazards[i][0]-ax)+(ay>ecoHazards[i][1]?ay-ecoHazards[i][1]:ecoHazards[i][1]-ay); if (d<bhd){bhd=d;bhx=ecoHazards[i][0];bhy=ecoHazards[i][1];} }
            ports[2] = bhx - ax; ports[3] = bhy - ay;
        } else if (zone == 2) {
            // Puzzle: bitstream sensors
            int hw = 0, c = ecoBitCurr; while (c) { hw += (c & 1); c >>= 1; }
            ports[0] = ecoBitCurr; ports[1] = ecoBitPrev; ports[2] = t & 1; ports[3] = hw;
        } else {
            // Tower or transition: hardware sensors
            ports[0] = ecoHwA; ports[1] = ecoHwB; ports[2] = (ecoHwA ^ ecoHwB) & 0xFF; ports[3] = 0;
        }
        ports[4] = (int32_t)energy; ports[5] = t & 0xFF;
        ports[6] = zone; ports[7] = houseDir;

        int acted = 0;
        int32_t raw = vm_tick(&vm, ports, &acted);
        int act = raw & 0x0f;
        double zoneReward = 0;

        if (zone == 0) {
            // === HOUSE: Homeostasis (weight x0.8) ===
            int hAct = ((act % 4) + 4) % 4;
            int load = 4 + (int)(xorshift32() % 6) + (t % 9 == 0 ? 15 : 0);
            if (hAct == 0) { ecoTemp -= 5.0; energy += 8.0; ecoQueue += load; }
            else if (hAct == 1) { ecoTemp += 2.0; energy -= 3.0; ecoQueue += load - 7; }
            else if (hAct == 2) { ecoTemp += 7.0; energy -= 7.5; ecoQueue += load - 16; }
            else { ecoTemp -= 10.0; energy -= 4.5; ecoQueue += load - 2; }
            ecoTemp += (32.0 - ecoTemp) * 0.04;
            if (ecoTemp < 15.0) ecoTemp = 15.0; if (ecoTemp > 105.0) ecoTemp = 105.0;
            if (ecoQueue < 0.0) ecoQueue = 0.0; if (ecoQueue > 100.0) ecoQueue = 100.0;
            if (energy < 0.0) energy = 0.0; if (energy > 100.0) energy = 100.0;
            if (ecoTemp >= 96.0) { zoneReward = -50.0; }
            else {
                double ts = 12.0 - ((ecoTemp > 52.0 ? ecoTemp - 52.0 : 52.0 - ecoTemp) * 0.45);
                double qs = 10.0 - ecoQueue * 0.22;
                zoneReward = (ts > 0 ? ts : 0) + (qs > 0 ? qs : 0) + (energy > 25.0 ? 6.0 : -8.0);
            }
            zoneReward *= 0.8;
        } else if (zone == 1) {
            // === FOREST: Arena navigation (weight x1.0) ===
            int aAct = ((act % 4) + 4) % 4;
            int prevMinDist = 999;
            for (int i = 0; i < 4; i++) { int d = (ax>ecoNodes[i][0]?ax-ecoNodes[i][0]:ecoNodes[i][0]-ax)+(ay>ecoNodes[i][1]?ay-ecoNodes[i][1]:ecoNodes[i][1]-ay); if (d<prevMinDist) prevMinDist=d; }
            int nx = ax, ny = ay;
            if (aAct == 0) ny--; else if (aAct == 1) nx++; else if (aAct == 2) ny++; else nx--;
            int hitWall = 0;
            if (nx < 0 || nx > 23 || ny < 0 || ny > 23) { hitWall = 1; nx = (nx<0?0:nx); nx = (nx>23?23:nx); ny = (ny<0?0:ny); ny = (ny>23?23:ny); }
            ax = nx; ay = ny;
            if (hitWall) zoneReward -= 3.5;
            int newMinDist = 999;
            for (int i = 0; i < 4; i++) {
                if (ecoNodes[i][0] == nx && ecoNodes[i][1] == ny) {
                    zoneReward += 30.0; energy = (energy + 25.0 > 100.0 ? 100.0 : energy + 25.0);
                    ecoNodes[i][0] = 16 + (int)(xorshift32() % 8); ecoNodes[i][1] = (int)(xorshift32() % 8);
                }
                int d = (nx>ecoNodes[i][0]?nx-ecoNodes[i][0]:ecoNodes[i][0]-nx)+(ny>ecoNodes[i][1]?ny-ecoNodes[i][1]:ecoNodes[i][1]-ny);
                if (d < newMinDist) newMinDist = d;
            }
            zoneReward += (prevMinDist - newMinDist) * 2.5 + (newMinDist < 14 ? (14 - newMinDist) * 0.45 : 0.0);
            for (int i = 0; i < 3; i++) if (ecoHazards[i][0] == nx && ecoHazards[i][1] == ny) { energy -= 22.0; zoneReward -= 18.0; }
            zoneReward *= 1.0;
        } else if (zone == 2) {
            // === PUZZLE: Bitstream prediction (weight x1.5) ===
            int pred = act & 0x0f;
            int target = (ecoBitCurr ^ (ecoBitPrev >> 1)) & 0x0f;
            int x = pred ^ target, err = 0; while (x) { err += (x & 1); x >>= 1; }
            zoneReward = (4 - err) * 4.0 + (pred == target ? 10.0 : 0.0);
            int nextByte = (int)(xorshift32() & 15);
            ecoBitPrev = ecoBitCurr; ecoBitCurr = nextByte;
            zoneReward *= 1.5;
        } else if (zone == 3) {
            // === TOWER: Hardware bus prediction (weight x1.5) ===
            int pred = act & 0x0f;
            int dP0 = (int)(xorshift32() % 10);
            int target = ((ecoHwA ^ ecoHwB) + (dP0 >> 1)) & 0x0f;
            int x = pred ^ target, err = 0; while (x) { err += (x & 1); x >>= 1; }
            zoneReward = (4 - err) * 4.0 + (pred == target ? 10.0 : 0.0);
            ecoHwA = (int)((ecoHwA + 7 + (xorshift32() & 15)) & 63);
            ecoHwB = (int)(xorshift32() & 31);
            zoneReward *= 1.5;
        } else {
            // === TRANSITION: navigation ===
            int aAct = ((act % 4) + 4) % 4;
            int nx = ax, ny = ay;
            if (aAct == 0) ny--; else if (aAct == 1) nx++; else if (aAct == 2) ny++; else nx--;
            if (nx < 0 || nx > 23 || ny < 0 || ny > 23) { nx = (nx<0?0:nx); nx = (nx>23?23:nx); ny = (ny<0?0:ny); ny = (ny>23?23:ny); }
            ax = nx; ay = ny;
            // Reward navigation toward nearest zone center
            int d0 = (nx>4?nx-4:4-nx)+(ny>4?ny-4:4-ny); // house
            int d1 = (nx>20?nx-20:20-nx)+(ny>4?ny-4:4-ny); // forest
            int d2 = (nx>4?nx-4:4-nx)+(ny>20?ny-20:20-ny); // puzzle
            int d3 = (nx>20?nx-20:20-nx)+(ny>20?ny-20:20-ny); // tower
            int minD = d0; if (d1<minD) minD=d1; if (d2<minD) minD=d2; if (d3<minD) minD=d3;
            zoneReward = (8.0 - minD * 0.3) > 0 ? (8.0 - minD * 0.3) : 0;
        }

        // Bonus for returning to house
        if (zone == 0 && prevZone != 0) zoneReward += 5.0;
        // Bonus for zone change (exploration)
        if (zone != prevZone && zone >= 0 && prevZone >= 0) zoneReward += 2.0;
        prevZone = zone;

        score += zoneReward;
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
#define POP_SIZE   ${Math.max(popSize, 256)}
#define TICKS      36
#define GENS       200
#define TOURNAMENT_SIZE 5
#define ELITE_RATIO    8
#define CROSSOVER_RATE 70
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

// Toernooiselectie: kiest de beste uit TOURNAMENT_SIZE willekeurige kandidaten
static int tournament_select(const Agent pop[POP_SIZE]) {
    int best = (int)(xorshift32() % POP_SIZE);
    for (int t = 1; t < TOURNAMENT_SIZE; t++) {
        int candidate = (int)(xorshift32() % POP_SIZE);
        if (pop[candidate].fitness > pop[best].fitness) best = candidate;
    }
    return best;
}

// Single-point crossover tussen twee genomes
static void crossover(const Agent *p1, const Agent *p2, Agent *child) {
    memcpy(child->genome, p1->genome, PROG_LEN * 4);
    if (rand_unit() * 100 < CROSSOVER_RATE) {
        int pt = (int)(xorshift32() % PROG_LEN);
        for (int i = pt; i < PROG_LEN; i++) {
            child->genome[i * 4 + 0] = p2->genome[i * 4 + 0];
            child->genome[i * 4 + 1] = p2->genome[i * 4 + 1];
            child->genome[i * 4 + 2] = p2->genome[i * 4 + 2];
            child->genome[i * 4 + 3] = p2->genome[i * 4 + 3];
        }
    }
}

// Gerichte mutatie: stimuleert SENSE (0x26) en behoudt goede instructies
static void directed_mutate(Agent *child, double rate) {
    for (int inst = 0; inst < PROG_LEN; inst++) {
        double r = rand_unit();
        if (r < rate) {
            int byte = (int)(xorshift32() & 3);
            if (byte == 0) {
                // Opcode mutatie: 30% kans op SENSE om sensor-gebruik te stimuleren
                if (rand_unit() < 0.30) {
                    child->genome[inst * 4] = 0x26; // SENSE
                } else {
                    child->genome[inst * 4] = (uint8_t)(xorshift32() % 44);
                }
            } else {
                child->genome[inst * 4 + byte] = (uint8_t)(xorshift32() & 0xFF);
            }
        }
    }
    // Injectie: voeg 1-2 SENSE-instructies toe aan willekeurige NOP-plekken
    if (rand_unit() < 0.40) {
        int nop_slot = (int)(xorshift32() % PROG_LEN);
        child->genome[nop_slot * 4 + 0] = 0x26; // SENSE
        child->genome[nop_slot * 4 + 1] = (uint8_t)((xorshift32() % 8)); // Rd
        child->genome[nop_slot * 4 + 2] = (uint8_t)((xorshift32() % 4)); // Rs = P0..P3 (sensor ports)
        child->genome[nop_slot * 4 + 3] = 0;
    }
}

int main(void) {
    Agent pop[POP_SIZE];
    Agent next_pop[POP_SIZE];
    static const uint32_t ANCHORS[3] = {1013u, 2029u, 3049u};

    // Initialisatie: SEED_GENOME + variatie
    memcpy(pop[0].genome, SEED_GENOME, PROG_LEN * 4);
    for (int i = 1; i < POP_SIZE; i++) {
        // 50% van populatie krijgt SEED_GENOME met mutatie, 50% volledig random
        if (rand_unit() < 0.50) {
            memcpy(pop[i].genome, SEED_GENOME, PROG_LEN * 4);
            for (int b = 0; b < PROG_LEN * 4; b++) {
                if (rand_unit() < 0.15) pop[i].genome[b] = (uint8_t)(xorshift32() & 0xFF);
            }
        } else {
            for (int inst = 0; inst < PROG_LEN; inst++) {
                // Forceer minstens 1 SENSE per random genome
                uint8_t op;
                if (inst == 0 || inst == 1) {
                    op = 0x26; // SENSE op eerste instructies
                } else {
                    op = (uint8_t)(xorshift32() % 44);
                }
                pop[i].genome[inst * 4 + 0] = op;
                pop[i].genome[inst * 4 + 1] = (uint8_t)(xorshift32() & 7);
                pop[i].genome[inst * 4 + 2] = (uint8_t)(xorshift32() & 7);
                pop[i].genome[inst * 4 + 3] = (uint8_t)(xorshift32() & 0xFF);
            }
        }
    }

    for (int gen = 1; gen <= GENS; gen++) {
        uint32_t rot_seed = (uint32_t)(gen * 997 + 11);
        // Evaluatie met meerdere seeds
        for (int i = 0; i < POP_SIZE; i++) {
            double total = eval_task(pop[i].genome, rot_seed);
            for (int a = 0; a < 3; a++) total += eval_task(pop[i].genome, ANCHORS[a]);
            pop[i].fitness = total / 4.0;
        }
        // Sorteren
        for (int i = 0; i < POP_SIZE - 1; i++) {
            for (int j = i + 1; j < POP_SIZE; j++) {
                if (pop[j].fitness > pop[i].fitness) { Agent tmp = pop[i]; pop[i] = pop[j]; pop[j] = tmp; }
            }
        }
        if (gen == 1 || gen % 20 == 0 || gen == GENS) {
            printf("Gen %3d | Beste fitness (4-seed gem): %7.2f\\n", gen, pop[0].fitness);
        }
        // Elite: top POP_SIZE/ELITE_RATIO gaat direct door
        int elite = POP_SIZE / ELITE_RATIO;
        for (int i = 0; i < elite; i++) next_pop[i] = pop[i];
        // Rest: toernooiselectie + crossover + gerichte mutatie
        double mutRate = 0.08 + (gen < 50 ? 0.04 : 0.0); // hogere mutatie in vroege generaties
        for (int i = elite; i < POP_SIZE; i++) {
            int p1 = tournament_select(pop);
            int p2 = tournament_select(pop);
            crossover(&pop[p1], &pop[p2], &next_pop[i]);
            directed_mutate(&next_pop[i], mutRate);
        }
        memcpy(pop, next_pop, sizeof(pop));
    }
    printf("\\nGeëvolueerde 128-byte kernel (hex):\\n");
    for (int i = 0; i < PROG_LEN * 4; i++) printf("%02X%s", pop[0].genome[i], (i % 16 == 15) ? "\\n" : " ");
    return 0;
}
`;
}
