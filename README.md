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
  - **Sensor & Actuator I/O (`0x26..0x27`)**: `SENSE` (leest live poort `P0..P7`), `ACT` (stuurt stuuractie en sluit tick af)
  - **Self-Modifying Code & Multi-Core Bus (`0x28..0x2B`)**:
    - `PREAD` / `PWRITE`: Lees en herschrijf het eigen actieve 32-bit programmawoord tijdens runtime (**SMC**).
    - `BWRITE` / `BREAD`: Lees en schrijf over de gedeelde 8-kanaals hardware-bus (`BUS0..BUS7`) voor samenwerking tussen twee kernen.
- **Authentieke bitbreedtes**: Schakel direct tussen **16-bit**, **32-bit**, **64-bit** en **64-bit + 128-bit SIMD (`XMM0..XMM3`)** met echte integer overflow/wrap-around semantiek (`BigInt64Array`).

---

## De 4 Hardware-omgevingen

1. **Thermische & Bus-Balans (`homeostasis`)**  
   Houd CPU-temperatuur, werklast-wachtrij en energierail in balans onder wisselende stresstoestanden (`HOMEOSTASIS_REGIMES`) en piekbelasting.  
   - **Sensorpoorten (`P0..P7`)**: `P0` Temp, `P1` Wachtrij, `P2` Energie (%), `P3` Temp-afwijking, `P4` Wachtrij-druk, `P5` Vorige actie, `P6` Hardware-mask, `P7` Klok-tick.  
   - **Acties (`ACT`)**: `0` Rust/Laad, `1` Normaal werk, `2` Turbo-burst, `3` Actief koelen.

2. **2D Hardware-Signaalzoeker (`arena`)**  
   Navigeer autonoom over een 16×16-grid naar energiebronnen en ontwijk storingsvelden.  
   - **Sensorpoorten (`P0..P7`)**: `P0..P1` Delta X/Y naar dichtstbijzijnde bron, `P2..P3` Delta X/Y naar storing, `P4` Energie (%), `P5` Afstand tot bron, `P6` Hardware-mask, `P7` Klok-tick.  
   - **Acties (`ACT`)**: `0` Noord, `1` Oost, `2` Zuid, `3` West.

3. **Bit-Patroon Cortex (`bitstream`)**  
   Ontdek 4-bit shift-XOR-patronen (`P0 ^ (P1 >> 1)`) uit live buswoorden met L1-geheugen en bit-opcodes.  
   - **Sensorpoorten (`P0..P7`)**: `P0` Huidig buswoord, `P1` Vorig buswoord, `P2` Klok-pariteit, `P3` Bit-gewicht (`popcnt(P0)`), `P4` Vorige bitfout, `P5` Vorige voorspelling, `P6` `P0 XOR P1`, `P7` Klok-tick.  
   - **Acties (`ACT`)**: onderste 4 bits (`waarde & 0x0F`) vormen het voorspelde 4-bit woord.

4. **Open Hardware-Bus (`hardware` — Live I/O)**  
   Plug-and-play sensorbus die nieuw aangesloten randapparatuur en videokaarten automatisch blootstelt zonder code-aanpassing (met optioneel live `8×8` camera-oog).  
   - **Sensorpoorten (`P0..P7`)**: `P0` Kanaal A (Camera luma / Muis-dX / Gamepad as 0), `P1` Kanaal B (Camera-beweging / Muis-dY / Gamepad as 1), `P2` Invoerwoord (Toets/Muisknop/Lenscontrast), `P3` Hardware-capability-mask (`0x00..0xFF`), `P4` Signaal-delta (`dP0`), `P5` Vorige ACT-echo, `P6` Bus-entropie, `P7` Klok-tick.  
   - **Acties (`ACT`)**: onderste 4 bits (`waarde & 0x0F`) sturen de live bus-respons aan.

---

## Hoe gebruik je SiliciumKern?

### 1. Werkbank (linker zijpaneel + live dashboard)
0. **Automatische Hardware- & Randapparatuur-detectie (`AUTO` / `HANDMATIG`)**: bij opstarten én live via `devicechange` / `gamepadconnected` scant SiliciumKern direct je systeem:
   - **CPU & Geheugen**: architectuur & bitness, aantal logische threads, echte WebAssembly 128-bit `v128` SIMD-probe en systeemgeheugen.
   - **GPU / Videokaart**: WebGPU adapter-detectie plus WebGL2/WebGL `WEBGL_debug_renderer_info` fallback (GPU-model en max. texture size).
   - **Invoer & Optisch (`Koppel camera-oog`)**: toetsenbord/muis, aangesloten gamepads, microfoons en webcam/camera (`8×8` live helderheids- & bewegingsmatrix op `P0..P2`). Alle gedetecteerde hardware wordt als 8-bit `capabilityMask` rechtstreeks op de VM-bus (`P3` / `P6`) aangeboden.
   - **Adaptieve AI-ruimte**: schakelt automatisch `128b` SIMD, cyclusbudget (`24` / `36` / `48`), Dual-Core Co-Processor Bus en populatiegrootte (`32`..`256` kernen).
1. **Kies een hardware-omgeving** (*Thermische & Bus-Balans*, *2D Hardware-Signaalzoeker*, *Bit-Patroon Cortex* of *Open Hardware-Bus*).
2. **Kies je register-breedte (`16b` / `32b` / `64b` / `128b`)** & **Cyclusbudget (`24` / `36` / `48`)**: handmatig aanpassen schakelt het profiel naar `HANDMATIG`; klik op `AUTO` om weer opnieuw te scannen.
3. **Kies het startpunt van het genoom**:
   - **Vanaf 0 (Ruis)**: pure willekeurige bytes — laat ongebiaste, trace-geleide LGP-evolutie zelf gedrag uitvinden.
   - **Basis-reflex**: start met een minimale handgeschreven reflex-kernel.
4. **Stel populatie & mutatiekans in** (32 / 64 / 128 / 256 kernen en 2%–25% mutatiekans per byte).
5. **Optionele hardware-uitbreidingen**:
   - **Zelf-modificatie (`PWRITE`)**: staat de VM toe zijn eigen actieve instructies te herschrijven. In het paneel *Live Machinetaal-Genoom* krijgen aangepaste regels direct een amberkleurig **`SMC`**-label.
   - **Lamarckiaanse SMC-overerving**: schakelaar om runtime-`PWRITE`-aanpassingen terug te schrijven in het overerfbare genoom tussen generaties (uit = puur runtime *Baldwin-effect*).
   - **Dual-Core Co-Processor Bus**: draait een echte co-evoluerende co-processor-populatie (**Kern B**) vóór de primaire kern (**Kern A**) en verbindt beide via **`BUS0..BUS7`**.
6. **Trainen en inspecteren (non-blocking Web Worker)**:
   - Klik rechtsboven op **Start evolutie** om generaties achter elkaar in een aparte **Web Worker** te laten evolueren zonder dat de UI hapert (4 anker-regimes + 2 epoche-seeds per generatie, gededupliceerde elites en `hitCounts`-gestuurde chirurgische mutaties), of gebruik **1 Generatie** voor losse stappen.
   - Gebruik **Pauzeer live**, **Stap 1 Tick** en **Stap 1 Opcode** om elke register-, vlag-, RAM- en buswijziging per CPU-cyclus te volgen.
   - Klik in **Live Machinetaal-Genoom** op een willekeurige instructieregel om opcode, `Rd`/`Rs` of `#imm` direct handmatig te bewerken.
   - Test de veerkracht van een getrainde kern met **5. Hardware-storing injecteren** (*+24°C hittepiek*, *+35 werklastpiek*, *+7 bus-signaalpuls* of *-25% spanningsdip*).
7. **Automatische opslag**: je generatie, beste genoom, populatie en instellingen worden automatisch lokaal in je browser (`localStorage`) bewaard.

### 2. Instructieset
Open het tabblad **Instructieset** voor een doorzoekbaar en filterbaar overzicht van alle **44 opcodes** (`0x00`..`0x2B`) met syntaxis en hardware-uitleg.

### 3. Benchmark & Validatie (Web Worker)
Open het tabblad **Benchmark** voor twee gecontroleerde wetenschappelijke proeven die asynchroon op de achtergrond draaien:
- **100-Seed Generalisatie-Benchmark**: test je geëvolueerde kern op 100 ongeziene testomgevingen (zonder evolutie) tegenover 16 willekeurige beginkernen.
- **A/B-Test `PWRITE` AAN vs UIT**: start twee identieke beginpopulaties naast elkaar en vergelijkt beide op 50 ongeziene validatie-seeds.

### 4. Code-export (lokaal draaien zonder browser)
Open het tabblad **Code-export** om je geëvolueerde 128-byte kernel direct te kopiëren of downloaden in 4 formaten:
- **C99 Kern**: losse C-functie + `main()` inclusief `active_code[]` (SMC) en `bus[8]` (`gcc -O3 -march=native ... -o micro_ai`).
- **C99 Volledige Trainer**: zelfstandige 4-seed evolutie-trainer inclusief 44-opcode VM voor alle 4 taken (`homeostasis`, `arena`, `bitstream`, `hardware`) in pure C99 (`gcc -O3 -march=native ... -o trainer`).
- **x86-64 + SSE2 NASM**: directe 64-bit x86 assembly met echte `r8..r15` en `xmm0..xmm3` instructies, `MAX_CYCLES` lus-beveiliging en echte `BWRITE`/`BREAD` bus-opcodes (`nasm -f elf64 ... -o micro_ai.o`).
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
