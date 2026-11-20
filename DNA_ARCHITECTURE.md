# SilicumKern – Digital DNA Architecture (Prototype)

## Goal

Transform SilicumKern from single-genome evolution into a **multi-genome Digital DNA** system where:

- **DNA** = the organism / brain
- **Genomes** = specialized modules that live and work *inside* the DNA
- Instincts, attention, mating drive, survival drive are **baked into the DNA itself** (not external host logic)
- The best evolved DNA is the **extinction fallback** (Golden DNA)
- The interconnect is **future-proof**: SA/ISA → PCI → AGP → PCIe
- Base capability starts at Pentium 4 era; newer instruction sets can be discovered later

## What is implemented in this prototype

### 1. Multi-Genome DNA (`src/engine/dna/types.ts`)
- `DNAStrand` contains up to 8 genome slots
- Each genome is still 256 bytes (compatible with current VM)
- `attentionFocus` index (intended to become endogenous later)
- `discoveredBusGen` – which interconnect generation the DNA has unlocked
- `vitality` – used by extinction logic

### 2. Golden DNA Archive (`src/engine/dna/goldenArchive.ts`)
- Best DNA is automatically kept
- Short history of high performers
- `getExtinctionFallback()` restores the best DNA when the population collapses
- Persisted in `localStorage`

### 3. Future-proof Bus Hierarchy (`src/engine/dna/busHierarchy.ts`)
- Generations: **SA/ISA → PCI → AGP → PCIe**
- Increasing channel counts: 8 → 16 → 32 → 64
- Capability flags that genomes can later discover
- Safe read/write that respects the currently discovered generation
- Designed so the DNA itself can raise the generation over time

### 4. Protected Instinct Region
- First 32 bytes of every genome are marked as protected (lower mutation pressure)
- This is the intended place to hard-bake survival / mating / attention seeds later

## What is NOT yet fully wired

- The main evolution loop and UI still use the classic single-genome path
- Attention, mating drive and survival instinct are **not** yet expressed as actual machine-code sequences inside the DNA (they are only structural hooks)
- Full Pentium 4 instruction semantic coverage is still the long-term target ISA; the current custom opcode set remains for compatibility
- Real endogenous control (DNA deciding its own attention & bus generation) needs additional ports / SMC conventions

## How to continue

1. Wire `DNAStrand` into the evolution worker and population structures
2. Replace single-genome crossover/mutation with DNA-level operators (genome-slot crossover, protected-region awareness)
3. On population fitness collapse → call `getExtinctionFallback()`
4. Gradually move attention & drive logic from host code into protected genome regions
5. Expand the VM opcode set toward the full P4 list you supplied, while keeping the multi-genome DNA layer stable

## Bus evolution philosophy

```
SA/ISA  (8 channels)   ← every DNA starts here
  ↓ discover
PCI     (16 channels)
  ↓ discover
AGP     (32 channels)  ← high-bandwidth / vector friendly
  ↓ discover
PCIe    (64 channels)  ← modern, concurrent, extensible
```

The organism must earn the right to use higher generations. This keeps old DNA runnable and makes interconnect progress an evolutionary achievement.

---

This prototype is deliberately structural and future-proof.  
The biological behaviours (attention, mating, survival) will be moved *into* the DNA in subsequent iterations exactly as requested.

## Starter DNA Lineages (v0.2)

Four initial DNA strands are provided, each with distinct baked-in biases:

| Lineage | Exploration | SMC tendency | Vitality | Attention style | Starting Bus |
|---------|-------------|--------------|----------|-----------------|--------------|
| **GPT**    | Medium     | Medium      | High    | Balanced        | PCI          |
| **Grok**   | Very High  | High        | Medium  | Fast switching  | AGP          |
| **Claude** | Low        | Low         | Very High | Focused / deep | PCI        |
| **Llama**  | Medium-High| Medium      | Medium-High | Practical     | SA/ISA     |

Use `createStarterDNA('gpt' | 'grok' | 'claude' | 'llama')` or `createInitialCivilization()`.

Vision / multimodal is deliberately deferred until GPU inference support exists.

## UI (v0.3)

- New primary tab: **DNA**
- Modes inside DNA Workbench:
  - **DNA Sequencing** – whole DNA evolves autonomously
  - **Per-Genome Train** – focus evolution on one genome slot inside the selected DNA
- Each DNA is scored on the 4 core tasks that already exist in the engine:
  - homeostasis (temp control)
  - arena (2D 16×16 energy grid + obstacles)
  - bitstream
  - hardware / live I/O (keyboard, mouse, …)
- GPU / vision still disabled
- Legacy Werkbank remains available for gradual migration
