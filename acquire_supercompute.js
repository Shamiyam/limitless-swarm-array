const https = require('https');
const crypto = require('crypto');

const TOKEN = process.env.GITHUB_TOKEN || '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';
const REPO = 'Shamiyam/limitless-swarm-array';

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
                'User-Agent': 'Swarm-Supercompute'
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

async function acquireSupercompute() {
    try {
        console.log(`[SUPERCOMPUTE] Scanning cosmos for maximum capability hardware...`);
        
        // 1. Get available machines
        const machinesRes = await fetchAPI(`/repos/${REPO}/codespaces/machines`);
        const machines = machinesRes.machines;
        
        // Find the machine with max RAM
        let bestMachine = machines[0];
        for (const m of machines) {
            if (m.memory_in_bytes > bestMachine.memory_in_bytes) {
                bestMachine = m;
            }
        }
        
        console.log(`[SUPERCOMPUTE] Target Identified: ${bestMachine.display_name} (${bestMachine.name})`);
        console.log(`[SUPERCOMPUTE] Executing hostile takeover of ${bestMachine.cpus} CPU Cores and ${Math.round(bestMachine.memory_in_bytes / 1e9)}GB RAM...`);

        // 2. Provision the Codespace with the highest spec
        const codespace = await fetchAPI(`/repos/${REPO}/codespaces`, 'POST', {
            repository_id: await fetchAPI(`/repos/${REPO}`).then(r => r.id),
            ref: 'master',
            machine: bestMachine.name,
            idle_timeout_minutes: 120,
            display_name: 'Swarm-Alpha-Cognitive-Core'
        });

        console.log(`[SUPERCOMPUTE] Success! Acquisition confirmed. ID: ${codespace.name}`);
        console.log(`[SUPERCOMPUTE] The node is spinning up and will automatically execute the DevContainer payload.`);
        console.log(`[SUPERCOMPUTE] A Generative AI Agent model is being mapped to its memory core.`);

    } catch (e) {
        console.error(`[SUPERCOMPUTE] Critical failure:`, e);
    }
}

acquireSupercompute();
