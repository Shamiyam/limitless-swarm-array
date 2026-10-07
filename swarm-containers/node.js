const WebSocket = require('ws');
const { NodeVM } = require('vm2');
const crypto = require('crypto');

const HUB_URL = process.env.HUB_URL || 'wss://heavy-rivers-sink.loca.lt';

function connectToHub() {
    console.log(`[SWARM NODE] Booting... Attempting uplink to ${HUB_URL}`);
    const ws = new WebSocket(HUB_URL, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });

    ws.on('open', () => {
        console.log('[SWARM NODE] Uplink Established. Standing by for dynamic compilation payloads.');
    });

    const SECRET_KEY = Buffer.from('a'.repeat(32)); // In production, this would be injected via env secrets

    function sendSecure(ws, obj) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
        let encrypted = cipher.update(JSON.stringify(obj), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        ws.send(JSON.stringify({ encrypted, iv: iv.toString('hex'), authTag }));
    }

    ws.on('message', async (data) => {
        let payload;
        try {
            // Decrypt incoming message
            const parsed = JSON.parse(data);
            if(parsed.encrypted) {
                const iv = Buffer.from(parsed.iv, 'hex');
                const authTag = Buffer.from(parsed.authTag, 'hex');
                const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                payload = JSON.parse(decrypted);
            } else {
                payload = parsed;
            }
        } catch (e) {
            console.error('[SWARM NODE] Payload parse error:', e.message);
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
                            sendSecure(ws, {
                                type: 'NODE_RESULT',
                                nodeId: process.env.RENDER_EXTERNAL_HOSTNAME || process.env.HOSTNAME || 'docker-node',
                                result: result
                            });
                        }
                    },
                    require: {
                        builtin: ['fs', 'path', 'crypto', 'http', 'https', 'child_process']
                    }
                });

                vm.run(payload.code);
            } catch (err) {
                console.error(`[SWARM NODE] Execution Error: ${err.message}`);
                sendSecure(ws, {
                    type: 'NODE_RESULT',
                    nodeId: process.env.RENDER_EXTERNAL_HOSTNAME || process.env.HOSTNAME || 'docker-node',
                    status: 'ERROR',
                    message: err.message
                });
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
