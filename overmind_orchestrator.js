const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, 'task_queue.json');

// Initialize Queue if it doesn't exist
if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([
        { id: 'T-001', type: 'OSINT', target: 'Global TLS Certificate Mapping', status: 'PENDING' },
        { id: 'T-002', type: 'EDGE_AI', target: 'Classify Darknet Topology Data', status: 'PENDING' },
        { id: 'T-003', type: 'COGNITIVE', target: 'Simulate Quantum State Decoherence', status: 'PENDING' }
    ], null, 2));
}

console.log('[OVERMIND] Autonomous Task Orchestrator Online.');

function orchestrateSwarm() {
    try {
        const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
        const pendingTasks = queue.filter(t => t.status === 'PENDING');

        if (pendingTasks.length > 0) {
            console.log(`[OVERMIND] Discovered ${pendingTasks.length} pending tasks. Assigning to Swarm Nodes...`);
            
            pendingTasks.forEach(task => {
                console.log(`[OVERMIND] Assigning Task ${task.id} (${task.type}) -> Broadcasting payload...`);
                // In a live WSS environment, this would broadcast the AES-256 encrypted payload to connected nodes.
                task.status = 'IN_PROGRESS';
                task.assignedAt = new Date().toISOString();
            });

            fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
            
            // Simulate completion after 10 seconds
            setTimeout(() => {
                const updatedQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
                updatedQueue.forEach(task => {
                    if (task.status === 'IN_PROGRESS') {
                        task.status = 'COMPLETED';
                        task.completedAt = new Date().toISOString();
                        console.log(`[OVERMIND] Node reported completion for Task ${task.id}. Data piped to Data Lake.`);
                    }
                });
                fs.writeFileSync(QUEUE_FILE, JSON.stringify(updatedQueue, null, 2));
            }, 10000);

        } else {
            console.log('[OVERMIND] Queue empty. Instructing Swarm to maintain idle reconnaissance pattern.');
        }
    } catch (err) {
        console.error('[OVERMIND] Orchestration Error:', err.message);
    }
}

// Orchestrator loop runs every 15 seconds
setInterval(orchestrateSwarm, 15000);
orchestrateSwarm();
