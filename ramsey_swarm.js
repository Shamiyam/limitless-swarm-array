const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const fs = require('fs');

const N = 43;
const K = 5;

// Combinatorics helper
function combinations(arr, k) {
  const result = [];
  function run(level, start) {
    if (level.length === k) {
      result.push([level[0], level[1], level[2], level[3], level[4]]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      level.push(arr[i]);
      run(level, i + 1);
      level.pop();
    }
  }
  run([], 0);
  return result;
}

if (isMainThread) {
  console.log(`[SWARM COMPUTE] Initializing Real Compute Expansion...`);
  const numCores = os.cpus().length;
  console.log(`[SWARM COMPUTE] Precomputing Graph Substructures (O(N^5) -> O(1) mappings)...`);
  
  // PRECOMPUTE ONCE IN MAIN THREAD
  const numVertices = N;
  const vertices = Array.from({length: numVertices}, (_, i) => i);
  const allCliques = combinations(vertices, K); 
  const numCliques = allCliques.length;
  
  const edgeToCliques = new Array(numVertices * numVertices);
  for(let i=0; i<edgeToCliques.length; i++) edgeToCliques[i] = [];
  
  for (let c = 0; c < numCliques; c++) {
    const clique = allCliques[c];
    for (let i = 0; i < clique.length; i++) {
      for (let j = i + 1; j < clique.length; j++) {
        const u = clique[i];
        const v = clique[j];
        edgeToCliques[u * numVertices + v].push(c);
        edgeToCliques[v * numVertices + u].push(c);
      }
    }
  }

  const edgeToCliquesFlat = new Int32Array(numCliques * 10);
  const edgeToCliquesStart = new Int32Array(numVertices * numVertices);
  const edgeToCliquesCount = new Int32Array(numVertices * numVertices);
  
  let flatIdx = 0;
  for (let u = 0; u < numVertices; u++) {
    for (let v = u + 1; v < numVertices; v++) {
      const cliques = edgeToCliques[u * numVertices + v];
      edgeToCliquesStart[u * numVertices + v] = flatIdx;
      edgeToCliquesCount[u * numVertices + v] = cliques.length;
      for (let i = 0; i < cliques.length; i++) {
        edgeToCliquesFlat[flatIdx++] = cliques[i];
      }
    }
  }

  console.log(`[SWARM COMPUTE] Detected ${numCores} CPU Cores. Deploying swarm workers for Ramsey R(5,5) breakthrough.`);
  
  let bestCost = Infinity;
  let totalIters = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < numCores; i++) {
    const worker = new Worker(__filename, { 
      workerData: { 
        workerId: i,
        numCliques,
        edgeToCliquesFlat,
        edgeToCliquesStart,
        edgeToCliquesCount
      } 
    });
    
    worker.on('message', (msg) => {
      if (msg.type === 'ITER_COUNT') {
        totalIters += msg.count;
      }
      if (msg.type === 'NEW_BEST') {
        if (msg.cost < bestCost) {
          bestCost = msg.cost;
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`[SWARM WORKER ${msg.workerId}] NEW GLOBAL BEST: ${bestCost} Monochromatic K5s. (Time: ${elapsed}s, Total Iters: ${totalIters})`);
          
          if (bestCost === 0) {
            console.log(`\n\n*** BREAKTHROUGH DISCOVERY! ***\nZero monochromatic K5s found on ${N} vertices!\nThis proves R(5,5) >= ${N+1}.\n`);
            process.exit(0);
          }
        }
      }
    });
    
    worker.on('error', (err) => console.error(err));
  }
  
  setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const itersPerSec = Math.floor(totalIters / elapsed);
    console.log(`[TELEMETRY] Elapsed: ${elapsed}s | Swarm Iterations: ${totalIters} | Speed: ${itersPerSec} iters/sec | Best Cost: ${bestCost}`);
  }, 2000);
  
} else {
  // WORKER THREAD LOGIC
  const numVertices = N;
  const { numCliques, edgeToCliquesFlat, edgeToCliquesStart, edgeToCliquesCount } = workerData;
  
  // Initialize random graph (upper triangular matrix)
  const graph = new Uint8Array(numVertices * numVertices);
  for (let u = 0; u < numVertices; u++) {
    for (let v = u + 1; v < numVertices; v++) {
      graph[u * numVertices + v] = Math.random() < 0.5 ? 1 : 0;
    }
  }
  
  // To avoid passing allCliques which is massive, we can just randomly evaluate edges 
  // and maintain a full O(N^5) true evaluation ONLY ONCE at the start, or we can reconstruct clique sums.
  // Wait, we need to know the initial clique sums!
  // It's much faster to just let the worker initialize it naively.
  
  const cliqueSums = new Uint8Array(numCliques);
  // Reconstruct cliquesums by simulating adding edges one by one!
  // This avoids O(N^5) array!
  let totalCost = numCliques; // initially graph is all 0, so all cliques are mono (sum=0)
  
  // Add 1 edges
  for (let u = 0; u < numVertices; u++) {
    for (let v = u + 1; v < numVertices; v++) {
      if (graph[u * numVertices + v] === 1) {
        const edgeIdx = u * numVertices + v;
        const start = edgeToCliquesStart[edgeIdx];
        const count = edgeToCliquesCount[edgeIdx];
        for (let i = 0; i < count; i++) {
          const c = edgeToCliquesFlat[start + i];
          const oldSum = cliqueSums[c];
          cliqueSums[c]++;
          if (oldSum === 0) totalCost--;
          if (cliqueSums[c] === 10) totalCost++;
        }
      }
    }
  }
  
  let bestCost = totalCost;
  parentPort.postMessage({ type: 'NEW_BEST', cost: bestCost, workerId: workerData.workerId });
  
  let temp = 1000.0;
  const coolingRate = 0.999999;
  let iters = 0;
  
  while (totalCost > 0) {
    iters++;
    if (iters % 20000 === 0) {
      parentPort.postMessage({ type: 'ITER_COUNT', count: 20000 });
      temp *= 0.99;
      if (temp < 0.001) temp = 1000.0;
    }
    
    let u = Math.floor(Math.random() * numVertices);
    let v = Math.floor(Math.random() * numVertices);
    while (u === v) v = Math.floor(Math.random() * numVertices);
    if (u > v) { const tmp = u; u = v; v = tmp; }
    
    const edgeIdx = u * numVertices + v;
    const oldColor = graph[edgeIdx];
    const newColor = 1 - oldColor;
    const diff = newColor === 1 ? 1 : -1;
    
    const start = edgeToCliquesStart[edgeIdx];
    const count = edgeToCliquesCount[edgeIdx];
    
    let newTotalCost = totalCost;
    
    for (let i = 0; i < count; i++) {
      const c = edgeToCliquesFlat[start + i];
      const oldSum = cliqueSums[c];
      const newSum = oldSum + diff;
      
      if (oldSum === 0 || oldSum === 10) newTotalCost--;
      if (newSum === 0 || newSum === 10) newTotalCost++;
    }
    
    if (newTotalCost < totalCost) {
      totalCost = newTotalCost;
      graph[edgeIdx] = newColor;
      for (let i = 0; i < count; i++) {
        cliqueSums[edgeToCliquesFlat[start + i]] += diff;
      }
      if (totalCost < bestCost) {
        bestCost = totalCost;
        parentPort.postMessage({ type: 'NEW_BEST', cost: bestCost, workerId: workerData.workerId });
      }
    } else {
      const delta = newTotalCost - totalCost;
      if (Math.random() < Math.exp(-delta / temp)) {
        totalCost = newTotalCost;
        graph[edgeIdx] = newColor;
        for (let i = 0; i < count; i++) {
          cliqueSums[edgeToCliquesFlat[start + i]] += diff;
        }
      }
    }
  }
}
