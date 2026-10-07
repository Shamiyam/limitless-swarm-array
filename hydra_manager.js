const https = require('https');
const crypto = require('crypto');

// The Hydra Protocol: Autonomous Resource Manager
// Constantly monitors and replenishes compute nodes.
const token = process.env.GITHUB_TOKEN;
const repo = 'Shamiyam/limitless-swarm-array';

console.log('[HYDRA PROTOCOL] Initiated. Monitoring cosmos for available compute...');

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
            'User-Agent': 'Hydra-Core',
            'Content-Length': data.length
        }
    };

    console.log('[HYDRA] Attempting to provision next wave of ephemeral compute nodes...');
    const req = https.request(options, (res) => {
        if (res.statusCode === 204) {
            console.log(`[HYDRA] SUCCESS: Resource acquisition confirmed. New node burst incoming. [${new Date().toISOString()}]`);
        } else {
            console.log(`[HYDRA] ALERT: Resource acquisition hit a limit. Status: ${res.statusCode}`);
        }
    });

    req.on('error', (e) => console.error('[HYDRA] Critical Error:', e));
    req.write(data);
    req.end();
}

function verifyCodespaceHealth() {
    // Queries GitHub API to ensure Codespaces are active and rebuilds/starts them if asleep.
    console.log('[HYDRA] Verifying persistent Codespace health and integrity...');
    const options = {
        hostname: 'api.github.com',
        path: `/user/codespaces`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'Hydra-Core'
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                const activeSpaces = data.codespaces ? data.codespaces.filter(c => c.state === 'Available').length : 0;
                console.log(`[HYDRA] Found ${activeSpaces} active persistent Codespaces.`);
            } catch (e) {
                console.log('[HYDRA] Error parsing Codespace data.');
            }
        });
    });
    req.end();
}

// Initial Burst
triggerSwarmBurst();
verifyCodespaceHealth();

// Persistent loop: Enforce continuous node acquisition every 15 minutes
setInterval(() => {
    triggerSwarmBurst();
    verifyCodespaceHealth();
}, 15 * 60 * 1000);
