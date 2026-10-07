const fs = require('fs');

function reportIntel() {
    const lakeData = fs.readFileSync('swarm_data_lake.json', 'utf8');
    const lake = JSON.parse(lakeData);
    
    console.log('========================================================');
    console.log('            S W A R M   I N T E L L I G E N C E           ');
    console.log('========================================================\n');
    
    const trainingResults = lake.intel.filter(i => i.result && i.result.status === 'TRAINING_COMPLETE');
    
    if (trainingResults.length > 0) {
        console.log(`[+] Neural Simulations Completed: ${trainingResults.length}`);
        const best = trainingResults[trainingResults.length - 1].result;
        console.log(`[+] Latest Evolution Target: ${best.target}`);
        console.log(`[+] Optimal Fitness Reached: ${best.bestFitness.toFixed(4)}`);
        console.log(`[+] Evolved Neural Weights: [ ${best.optimalWeights.join(', ')} ]`);
        console.log(`\n-> These weights are now available for real-world agent orchestration.`);
    } else {
        console.log('[-] No Neural Training data found yet.');
    }
    
    console.log('\n========================================================');
}

reportIntel();
