import { runSmcAbExperiment, TASKS } from './dist/machineVm.js';

const tasks = ['homeostasis', 'arena', 'bitstream', 'hardware'];
const generations = 40;
const popSize = 48;
const mutationRate = 0.08;

console.log('='.repeat(80));
console.log('SILICIUMKERN — A/B-Test: PWRITE (SMC) AAN vs UIT');
console.log('='.repeat(80));
console.log(`Generaties: ${generations} | Populatie: ${popSize} | Mutatie: ${mutationRate}`);
console.log('');

for (const task of tasks) {
  const taskId = task;
  console.log('-'.repeat(80));
  console.log(`TAAK: ${TASKS[taskId].name} (${taskId})`);
  console.log('-'.repeat(80));

  const result = runSmcAbExperiment(
    taskId,
    32, // bitWidth
    popSize,
    generations,
    mutationRate,
    false, // inheritSmc
    24 // maxCycles
  );

  console.log(`\n📊 Evolutie Resultaten:`);
  console.log(`  PWRITE AAN  - Beste fitness (laatste gen): ${result.smcSeries[generations - 1]?.best.toFixed(2)}`);
  console.log(`  PWRITE UIT  - Beste fitness (laatste gen): ${result.noSmcSeries[generations - 1]?.best.toFixed(2)}`);
  
  const diff = result.smcSeries[generations - 1]?.best - result.noSmcSeries[generations - 1]?.best;
  console.log(`  Verschil    - ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`);

  console.log(`\n🔬 Validatie op 50 ongeziene seeds:`);
  console.log(`  PWRITE AAN  - Gemiddelde score: ${result.smcValidationMean.toFixed(2)}`);
  console.log(`  PWRITE UIT  - Gemiddelde score: ${result.noSmcValidationMean.toFixed(2)}`);
  
  const valDiff = result.smcValidationMean - result.noSmcValidationMean;
  console.log(`  Verschil    - ${valDiff >= 0 ? '+' : ''}${valDiff.toFixed(2)}`);

  console.log(`\n🔧 SMC Gebruik:`);
  console.log(`  Gemiddeld aangepaste opcodes per run: ${result.smcModifiedOpcodes}`);
  
  if (result.smcModifiedOpcodes > 0) {
    console.log(`  ✅ PWRITE WORDT GEBRUIKT — kernen schrijven hun eigen code aan tijdens runtime`);
  } else {
    console.log(`  ⚠️  PWRITE NIET GEBRUIKT — kernen evolueren maar gebruiken geen self-modifying code`);
  }

  console.log(`\n📈 Fitness-ontwikkeling (eerste 10 vs laatste 10 generaties):`);
  console.log(`  Gen 1  - SMC: ${result.smcSeries[0]?.best.toFixed(2)} | No-SMC: ${result.noSmcSeries[0]?.best.toFixed(2)}`);
  console.log(`  Gen 10 - SMC: ${result.smcSeries[9]?.best.toFixed(2)} | No-SMC: ${result.noSmcSeries[9]?.best.toFixed(2)}`);
  console.log(`  Gen ${generations - 9} - SMC: ${result.smcSeries[generations - 10]?.best.toFixed(2)} | No-SMC: ${result.noSmcSeries[generations - 10]?.best.toFixed(2)}`);
  console.log(`  Gen ${generations} - SMC: ${result.smcSeries[generations - 1]?.best.toFixed(2)} | No-SMC: ${result.noSmcSeries[generations - 1]?.best.toFixed(2)}`);

  console.log('');
}

console.log('='.repeat(80));
console.log('TEST VOLTOOID');
console.log('='.repeat(80));
