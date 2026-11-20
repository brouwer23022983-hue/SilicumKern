import { createStarterGenome, evaluateAgent as evalTask, evolveGeneration, TASKS, createRandomGenome } from './src/engine/machineVm.ts';

const tasks = ['homeostasis', 'arena', 'bitstream', 'hardware'];
const generations = 100;
const popSize = 64;
const mutationRate = 0.08;
const bitWidth = 32;

console.log('='.repeat(80));
console.log('SILICIUMKERN — Test alle 4 lab-tests (met echte evolveGeneration)');
console.log('='.repeat(80));
console.log(`Generaties: ${generations} | Populatie: ${popSize} | Mutatie: ${mutationRate}`);
console.log('');

for (const task of tasks) {
  const taskId = task;
  const taskInfo = TASKS[taskId];

  console.log('-'.repeat(80));
  console.log(`TAAK: ${taskInfo.name} (${taskId})`);
  console.log('-'.repeat(80));

  // Maak startpopulatie: mix van starter genome + random
  const population = [];
  for (let i = 0; i < popSize; i++) {
    let genome;
    if (i < popSize / 2) {
      genome = createStarterGenome(taskId);
      // Lichte mutatie
      for (let b = 0; b < genome.length; b++) {
        if (Math.random() < 0.05) {
          genome[b] = Math.floor(Math.random() * 256);
        }
      }
    } else {
      const rng = () => Math.random();
      genome = createRandomGenome(rng, bitWidth);
    }
    population.push({
      id: i,
      genome,
      fitness: 0,
      generationBorn: 0,
    });
  }

  let bestGenome = null;
  let bestFitness = -Infinity;
  const fitnessHistory = [];

  for (let gen = 0; gen < generations; gen++) {
    // Gebruik de echte evolveGeneration (met 6-seed evaluatie!)
    const result = evolveGeneration(population, taskId, gen, mutationRate, bitWidth, {
      allowSmc: false,
      inheritSmc: false,
      dualCore: false,
    });

    // Vind beste uit de nieuwe populatie
    let genBest = result.nextPopulation[0];
    for (let i = 1; i < result.nextPopulation.length; i++) {
      if (result.nextPopulation[i].fitness > genBest.fitness) {
        genBest = result.nextPopulation[i];
      }
    }

    if (result.bestFitness > bestFitness) {
      bestFitness = result.bestFitness;
      bestGenome = new Uint8Array(result.bestAgent.genome);
    }

    fitnessHistory.push({ gen, best: result.bestFitness, mean: result.meanFitness });

    if (gen % 20 === 0 || gen === generations - 1) {
      console.log(`  Gen ${gen.toString().padStart(3)} - Beste: ${result.bestFitness.toFixed(2)} | Gemiddeld: ${result.meanFitness.toFixed(2)}`);
    }

    population.length = 0;
    for (const ind of result.nextPopulation) {
      population.push(ind);
    }
  }

  // Validatie op 10 ongeziene seeds
  let validationSum = 0;
  const validationRuns = 10;
  for (let s = 0; s < validationRuns; s++) {
    validationSum += evalTask(bestGenome, taskId, s * 100 + 7, bitWidth, 36);
  }
  const validationMean = validationSum / validationRuns;

  console.log(`\n📊 Resultaten ${taskInfo.name}:`);
  console.log(`  Beste fitness (laatste gen): ${fitnessHistory[generations - 1].best.toFixed(2)}`);
  console.log(`  Beste genome fitness: ${bestFitness.toFixed(2)}`);
  console.log(`  Validatie (10 seeds): ${validationMean.toFixed(2)}`);

  // Check of er verbetering was
  const firstBest = fitnessHistory[0].best;
  const lastBest = fitnessHistory[generations - 1].best;
  const improvement = lastBest - firstBest;
  console.log(`  Verbetering: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(2)} (${((improvement / Math.max(1, Math.abs(firstBest))) * 100).toFixed(1)}%)`);

  if (improvement < 5) {
    console.log(`  ⚠️  WEINIG VERBETERING — mogelijk lokaal optimum`);
  } else if (improvement > 50) {
    console.log(`  ✅ GOEDE VERBETERING — evolutie werkt`);
  } else {
    console.log(`  📈 MATIGE VERBETERING — kan beter`);
  }

  // Print eerste 10 instructies van beste genome
  console.log(`\n  Beste genome (eerste 10 instructies):`);
  for (let i = 0; i < 10; i++) {
    const offset = i * 4;
    const opcode = bestGenome[offset];
    const rd = bestGenome[offset + 1];
    const rs = bestGenome[offset + 2];
    const imm = bestGenome[offset + 3];
    console.log(`    Slot ${i.toString().padStart(2)}: 0x${opcode.toString(16).padStart(2)} Rd=${rd} Rs=${rs} imm=${imm}`);
  }

  console.log('');
}

console.log('='.repeat(80));
console.log('TEST VOLTOOID');
console.log('='.repeat(80));
