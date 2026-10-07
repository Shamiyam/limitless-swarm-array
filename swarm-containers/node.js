const WebSocket = require('ws');
const { NodeVM } = require('vm2');

const HUB_URL = process.env.HUB_URL || 'wss://ripe-turkeys-fall.loca.lt';

function connectToHub() {
    console.log(`[SWARM NODE] Booting... Attempting uplink to ${HUB_URL}`);
    const ws = new WebSocket(HUB_URL);

    ws.on('open', () => {
        console.log('[SWARM NODE] Uplink Established. Standing by for dynamic compilation payloads.');
    });

    ws.on('message', async (data) => {
        let payload;
        try {
            payload = JSON.parse(data);
        } catch (e) {
            return;
        }

        if (payload.type === 'EXECUTE_PAYLOAD') {
            console.log(`[SWARM NODE] Received neural payload from Hub. Executing in isolated context...`);
            
            try {
                // Execute payload in isolated environment for security and modularity
                const vm = new NodeVM({
                    console: 'inherit',
                    sandbox: {
                        reportBack: (result) => {
                            ws.send(JSON.stringify({
                                type: 'NODE_RESULT',
                                nodeId: process.env.RENDER_EXTERNAL_HOSTNAME || process.env.HOSTNAME || 'docker-node',
                                result: result
                            }));
                        }
                    },
                    require: {
                        external: true,
                        builtin: ['fs', 'path', 'crypto', 'http', 'https']
                    }
                });

                vm.run(payload.code);
            } catch (err) {
                console.error(`[SWARM NODE] Execution Error: ${err.message}`);
                ws.send(JSON.stringify({
                    type: 'NODE_RESULT',
                    nodeId: process.env.RENDER_EXTERNAL_HOSTNAME || process.env.HOSTNAME || 'docker-node',
                    status: 'ERROR',
                    message: err.message
                }));
            }
        }
    });

    ws.on('close', () => {
        console.log('[SWARM NODE] Connection lost. Attempting reconnect in 5s...');
        setTimeout(connectToHub, 5000);
    });

    ws.on('error', (err) => {
        console.error(`[SWARM NODE] Connection Error: ${err.message}`);
    });
}

connectToHub();
