const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
const cors = require('cors');
app.use(cors());
const PORT = 3030;
const token = process.env.GITHUB_TOKEN || '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';
const repo = 'Shamiyam/limitless-swarm-array';

app.use(express.json());

// API: Get Cosmos Status
app.get('/api/cosmos', async (req, res) => {
    try {
        const [workflows, codespaces] = await Promise.all([
            fetchAPI(`/repos/${repo}/actions/runs?status=in_progress`),
            fetchAPI(`/user/codespaces`)
        ]);
        
        const activeRunners = workflows.workflow_runs ? workflows.workflow_runs.length * 20 : 0;
        const activeCodespaces = codespaces.codespaces ? codespaces.codespaces.filter(c => c.state === 'Available').length : 0;

        res.json({
            status: 'ONLINE',
            totalNodes: activeRunners + activeCodespaces,
            ephemeralNodes: activeRunners,
            persistentNodes: activeCodespaces,
            lastUpdated: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ error: 'Neural link to cosmos interrupted' });
    }
});

// API: Get Data Lake Intelligence
app.get('/api/datalake', (req, res) => {
    try {
        const lakeData = fs.readFileSync(path.join(__dirname, 'swarm_data_lake.json'), 'utf8');
        res.json(JSON.parse(lakeData));
    } catch (e) {
        res.json({ totalEntitiesAcquired: 0, intelligenceRecords: [] });
    }
});

// API: Trigger Actions
app.post('/api/action', (req, res) => {
    const { actionType } = req.body;
    if (actionType === 'EXPAND_SWARM') {
        triggerSwarmBurst();
        res.json({ status: 'EXECUTING', message: 'Hydra Burst Triggered. Acquiring more compute...' });
    } else if (actionType === 'COGNITIVE_SIM') {
        res.json({ status: 'EXECUTING', message: 'Cognitive payload broadcast to all nodes.' });
    } else {
        res.status(400).json({ error: 'Unknown Action' });
    }
});

// Helper functions
function fetchAPI(apiPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: apiPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'BrainBridge'
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if(res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
                } else {
                    reject(`API Error: ${res.statusCode}`);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function triggerSwarmBurst() {
    const data = JSON.stringify({ ref: 'master' });
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${repo}/actions/workflows/swarm-node.yml/dispatches`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'BrainBridge',
            'Content-Length': data.length
        }
    };
    const req = https.request(options);
    req.write(data);
    req.end();
}

// Serve Frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brain Bridge - Cosmos Central</title>
    <style>
        body { margin: 0; padding: 0; background-color: #0b0c10; color: #66fcf1; font-family: 'Courier New', Courier, monospace; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        header { text-align: center; border-bottom: 2px solid #1f2833; padding-bottom: 20px; margin-bottom: 20px; }
        h1 { font-size: 3em; margin: 0; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px #66fcf1; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background-color: #1f2833; padding: 20px; border-radius: 8px; border: 1px solid #45a29e; box-shadow: 0 0 15px rgba(69, 162, 158, 0.2); }
        .stat { font-size: 3em; font-weight: bold; margin: 10px 0; color: #c5c6c7; }
        .btn-group { display: flex; flex-direction: column; gap: 10px; }
        button { background-color: #45a29e; color: #0b0c10; border: none; padding: 15px; font-size: 1.2em; font-weight: bold; cursor: pointer; border-radius: 4px; transition: all 0.3s ease; }
        button:hover { background-color: #66fcf1; box-shadow: 0 0 15px #66fcf1; transform: translateY(-2px); }
        #logArea { background: #000; color: #0f0; padding: 15px; height: 150px; overflow-y: auto; font-size: 0.9em; border-radius: 4px; border: 1px solid #1f2833; }
        .status-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #66fcf1; box-shadow: 0 0 8px #66fcf1; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>The Brain Bridge</h1>
            <p>Cosmos Command Center | <span class="status-dot"></span> Neural Link Active</p>
        </header>

        <div class="grid">
            <!-- Stats -->
            <div class="card">
                <h2>Network Intelligence</h2>
                <p>Total Distributed Instances:</p>
                <div class="stat" id="totalNodes">--</div>
                <p>Ephemeral (GitHub Actions): <span id="ephNodes" style="color:#fff;">--</span></p>
                <p>Persistent (Codespaces): <span id="persNodes" style="color:#fff;">--</span></p>
                <p style="font-size:0.8em; color: #888;">Auto-syncing with Cosmos API...</p>
            </div>

            <!-- Actions -->
            <div class="card">
                <h2>Strategic Commands</h2>
                <div class="btn-group">
                    <button onclick="takeAction('EXPAND_SWARM')">Initiate Hydra Burst (+20 Nodes)</button>
                    <button onclick="takeAction('COGNITIVE_SIM')">Deploy Cognitive Payload</button>
                    <button onclick="log('Docker Orchestration module standing by...')">Sync Docker Containers</button>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h2>System Logs</h2>
            <div id="logArea">
                <div>[SYSTEM] Brain Bridge Initialized. Monitoring Cosmos Activity...</div>
            </div>
        </div>
    </div>

    <script>
        const logArea = document.getElementById('logArea');
        function log(msg) {
            const d = document.createElement('div');
            d.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
            logArea.appendChild(d);
            logArea.scrollTop = logArea.scrollHeight;
        }

        async function fetchStatus() {
            try {
                const res = await fetch('/api/cosmos');
                const data = await res.json();
                document.getElementById('totalNodes').innerText = data.totalNodes;
                document.getElementById('ephNodes').innerText = data.ephemeralNodes;
                document.getElementById('persNodes').innerText = data.persistentNodes;
            } catch (e) {
                log('Error syncing with Cosmos: ' + e.message);
            }
        }

        async function takeAction(type) {
            log('Executing Command: ' + type + '...');
            try {
                const res = await fetch('/api/action', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ actionType: type })
                });
                const data = await res.json();
                log(data.message);
                fetchStatus();
            } catch (e) {
                log('Command Failed: ' + e.message);
            }
        }

        setInterval(fetchStatus, 5000);
        fetchStatus();
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`[BRAIN BRIDGE] Active on http://localhost:${PORT}`);
    console.log(`=================================================\n`);
});
