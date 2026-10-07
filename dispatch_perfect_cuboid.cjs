const WebSocket = require('ws');

// Connect to the local edge server acting as the C2 Hub
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('[C2 COMMANDER] Uplink to Swarm Hub established.');
  
  // The Payload: Perfect Cuboid Search
  // An open mathematical problem: does there exist a box with integer sides, face diagonals, and space diagonal?
  const payloadCode = `
    self.onmessage = function(e) {
      if (e.data.type === 'START') {
        
        // Randomly select a search block to distribute the load across the swarm
        const a_start = Math.floor(Math.random() * 5000) + 1;
        const b_start = Math.floor(Math.random() * 5000) + 1;
        
        const searchSize = 250; // a and b search range per node
        const max_c = 5000;
        
        let found = false;
        let solution = null;
        let iterations = 0;
        
        // Fast integer square root check
        function isPerfectSquare(n) {
          if (n < 0) return false;
          let root = Math.round(Math.sqrt(n));
          return root * root === n;
        }

        searchLoop:
        for (let a = a_start; a < a_start + searchSize; a++) {
          let a2 = a * a;
          for (let b = b_start; b < b_start + searchSize; b++) {
            let b2 = b * b;
            
            // Check face 1 diagonal
            if (!isPerfectSquare(a2 + b2)) continue;
            
            for (let c = 1; c < max_c; c++) {
              iterations++;
              let c2 = c * c;
              
              // Check face 2 diagonal
              if (!isPerfectSquare(a2 + c2)) continue;
              
              // Check face 3 diagonal
              if (!isPerfectSquare(b2 + c2)) continue;
              
              // Check space diagonal
              if (isPerfectSquare(a2 + b2 + c2)) {
                found = true;
                solution = { a, b, c };
                break searchLoop;
              }
            }
          }
        }

        self.postMessage({
          status: found ? 'SUCCESS' : 'EXHAUSTED',
          message: found ? 'Perfect Cuboid Found!' : 'Search block exhausted.',
          solution: solution,
          iterations: iterations,
          range: { a_start, a_end: a_start + searchSize, b_start, b_end: b_start + searchSize }
        });
      }
    };
  `;

  console.log('[C2 COMMANDER] Dispatching Perfect Cuboid Search Payload to global swarm...');
  
  ws.send(JSON.stringify({
    type: 'DISPATCH_SWARM_TASK',
    taskId: 'MATH-PERFECT-CUBOID-1',
    code: payloadCode
  }));

  setTimeout(() => {
    console.log('[C2 COMMANDER] Payload transmission complete. Disconnecting from Hub.');
    ws.close();
  }, 3000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'SYSTEM_LOG') {
    console.log(msg.message);
  }
});
