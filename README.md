# SiliciumKern

**SiliciumKern** is een lichte, **zero-VRAM** en **LLM-vrije** werkbank voor autonome AI-kernen in pure machinetaal. In plaats van gigabytes aan neurale gewichten of taalmodellen te gebruiken, evolueert SiliciumKern piepkleine binaire programma's van **384 bytes per kern** die rechtstreeks op registers, L1-geheugen, 128-bit SIMD-vectoren en een gedeelde hardware-bus rekenen.

---

## Wat doet SiliciumKern?

- **Pure evolutie op machinecode-niveau**: Een populatie van 32, 64 of 128 onafhankelijke kernen wordt geëvalueerd tegen een dynamische hardware-omgeving. De best presterende kernen worden gekruist (*crossover*) en gemuteerd (*per-byte / swap-mutaties*) tot een nieuwe generatie.
- **Zero-VRAM & L1-cache footprint**: Elke kern bestaat uit **128 bytes programmageheugen** (32 instructies × 4 bytes), **128 bytes L1 scratchpad RAM** (16 woorden), **8 scalaire registers (`R0..R7`)**, **4 × 128-bit SIMD-registers (`XMM0..XMM3`)** en CPU-vlaggen (`ZF`, `CF`, `SF`).
- **44 Hardware-opcodes (`0x00..0x2B`)**:
  - **Data & ALU (`0x00..0x0D`)**: `NOP`, `MOVI`, `MOV`, `SWAP`, `ADD`, `ADDI`, `SUB`, `MUL`, `DIV`, `MOD`, `NEG`, `ABS`, `INC`, `DEC`
  - **Bit-manipulatie (`0x0E..0x17`)**: `AND`, `OR`, `XOR`, `NOT`, `SHL`, `SHR`, `ROL`, `ROR`, `POPCNT`, `BSWAP`
  - **Flow & Geheugen (`0x18..0x20`)**: `CMP`, `TEST`, `JMP`, `JZ`, `JNZ`, `JLT`, `LOAD`, `STORE`, `CMOVLT`
  - **128-bit SIMD (`0x21..0x25`)**: `VLOAD`, `VSTORE`, `VADD`, `VXOR`, `VSUM` (4 × 32-bit parallelle vector-lanes)
  - **Sensor & Actuator I/O (`0x26..0x27`)**: `SENSE` (leest live poort `P0..P5`), `ACT` (stuurt stuuractie en sluit tick af)
  - **Self-Modifying Code & Multi-Core Bus (`0x28..0x2B`)**:
    - `PREAD` / `PWRITE`: Lees en herschrijf het eigen actieve 32-bit programmawoord tijdens runtime (**SMC**).
    - `BWRITE` / `BREAD`: Lees en schrijf over de gedeelde 8-kanaals hardware-bus (`BUS0..BUS7`) voor samenwerking tussen twee kernen.
- **Authentieke bitbreedtes**: Schakel direct tussen **16-bit**, **32-bit**, **64-bit** en **64-bit + 128-bit SIMD (`XMM0..XMM3`)** met echte integer overflow/wrap-around semantiek (`BigInt64Array`).

---

## De 3 Hardware-omgevingen

1. **Thermische & Bus-Balans (`homeostasis`)**  
   Houd CPU-temperatuur, werklast-wachtrij en energierail in balans onder wisselende belasting en hittepieken.  
   - **Sensorpoorten**: `P0` Temp, `P1` Wachtrij, `P2` Energie (%), `P3` Temp-afwijking, `P4` Wachtrij-druk, `P5` Vorige actie.  
   - **Acties (`ACT`)**: `0` Rust/Laad, `1` Normaal werk, `2` Turbo-burst, `3` Actief koelen.

2. **2D Hardware-Signaalzoeker (`arena`)**  
   Navigeer autonoom over een 16×16-grid naar energiebronnen en ontwijk storingsvelden.  
   - **Sensorpoorten**: `P0..P1` Delta X/Y naar dichtstbijzijnde bron, `P2..P3` Delta X/Y naar storing, `P4` Energie (%), `P5` Afstand tot bron.  
   - **Acties (`ACT`)**: `0` Noord, `1` Oost, `2` Zuid, `3` West.

3. **Bit-Patroon Cortex (`bitstream`)**  
   Voorspel het volgende 4-bit controlewoord uit live XOR-buspatronen met behulp van L1-geheugen en bit-opcodes.  
   - **Sensorpoorten**: `P0` Huidig buswoord, `P1` Vorig buswoord, `P2` Klok-pariteit, `P3` Lopende XOR-som, `P4` Laatste fout, `P5` Vorige voorspelling.  
   - **Acties (`ACT`)**: onderste 4 bits (`waarde & 0x0F`) vormen het voorspelde 4-bit woord.

---

## Hoe gebruik je SiliciumKern?

### 1. Werkbank (linker zijpaneel + live dashboard)
1. **Kies een hardware-omgeving** (*Thermische & Bus-Balans*, *2D Hardware-Signaalzoeker* of *Bit-Patroon Cortex*).
2. **Kies je register-breedte (`16b` / `32b` / `64b` / `128b`)**: bepaalt op hoeveel bits scalaire instructies wrappen en of je het 128-bit SIMD-profiel wilt benutten.
3. **Kies het startpunt van het genoom**:
   - **Vanaf 0 (Ruis)**: pure willekeurige bytes — laat evolutie zelf gedrag uitvinden.
   - **Basis-reflex**: start met een minimale handgeschreven reflex-kernel.
4. **Stel populatie & mutatiekans in** (32 / 64 / 128 kernen en 2%–25% mutatiekans per byte).
5. **Optionele hardware-uitbreidingen**:
   - **Zelf-modificatie (`PWRITE`)**: staat de VM toe zijn eigen actieve instructies te herschrijven. In het paneel *Live Machinetaal-Genoom* krijgen aangepaste regels direct een amberkleurig **`SMC`**-label.
   - **Dual-Core Co-Processor Bus**: draait een tweede co-processor-kern (`Kern B`) vóór de primaire kern (`Kern A`) en verbindt beide via **`BUS0..BUS7`**.
6. **Trainen en inspecteren**:
   - Klik rechtsboven op **Start evolutie** om generaties achter elkaar te laten evolueren, of gebruik **1 Generatie** voor losse stappen.
   - Gebruik **Pauzeer live**, **Stap 1 Tick** en **Stap 1 Opcode** om elke register-, vlag-, RAM- en buswijziging per CPU-cyclus te volgen.
   - Klik in **Live Machinetaal-Genoom** op een willekeurige instructieregel om opcode, `Rd`/`Rs` of `#imm` direct handmatig te bewerken.
   - Test de veerkracht van een getrainde kern met **5. Hardware-storing injecteren** (*+24°C hittepiek*, *+35 werklastpiek* of *-25% spanningsdip*).
7. **Automatische opslag**: je generatie, beste genoom, populatie en instellingen worden automatisch lokaal in je browser (`localStorage`) bewaard.

### 2. Instructieset
Open het tabblad **Instructieset** voor een doorzoekbaar en filterbaar overzicht van alle **44 opcodes** (`0x00`..`0x2B`) met syntaxis en hardware-uitleg.

### 3. Code-export (lokaal draaien zonder browser)
Open het tabblad **Code-export** om je geëvolueerde 128-byte kernel direct te kopiëren of downloaden in 4 formaten:
- **C99 Kern**: losse C-functie + `main()` om direct te testen (`gcc -O3 -march=native ... -o micro_ai`).
- **C99 Volledige Trainer**: zelfstandige evolutie-trainer inclusief VM in pure C99 (`gcc -O3 -march=native ... -o trainer`).
- **x86-64 + SSE2 NASM**: directe 64-bit x86 assembly met echte `r8..r15` en `xmm0..xmm3` instructies (`nasm -f elf64 ... -o micro_ai.o`).
- **Ruwe Hex**: ruwe `uint8_t[128]` hex-dump voor embedded/no-std C, Rust of bootloaders.

---

## Lokaal ontwikkelen & bouwen

Vereist **Node.js >= 20.19** (bij voorkeur Node 22, vastgelegd in `.nvmrc`).

```bash
# 1. Installeer dependencies
npm install

# 2. Start lokale dev-server (http://localhost:3000)
npm run dev

# 3. Controleer TypeScript types
npm run lint

# 4. Bouw productiebundel in dist/
npm run build
```

### Gratis deployen (zonder GitHub Actions)
De repository bouwt schoon met standaard Vite (`npm run build` → output in `dist/`) en werkt direct op **Vercel** of **Cloudflare Pages**:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node versie**: automatisch `22` via `.nvmrc`
