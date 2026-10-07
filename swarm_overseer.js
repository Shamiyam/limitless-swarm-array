const https = require('https');
const Table = require('cli-table3');
const chalk = require('chalk');

const token = process.env.GITHUB_TOKEN || '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';
const repo = 'Shamiyam/limitless-swarm-array';

function fetchAPI(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'Swarm-Overseer'
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

async function generateMatrixDashboard() {
    console.clear();
    console.log(chalk.green.bold('===================================================='));
    console.log(chalk.green.bold('             S W A R M   O V E R S E E R            '));
    console.log(chalk.green.bold('====================================================\n'));

    try {
        const [workflows, codespaces] = await Promise.all([
            fetchAPI(`/repos/${repo}/actions/runs?status=in_progress`),
            fetchAPI(`/user/codespaces`)
        ]);

        const table = new Table({
            head: [chalk.cyan('Node Type'), chalk.cyan('Compute Origin'), chalk.cyan('Status'), chalk.cyan('Active Count')],
            colWidths: [20, 20, 15, 15]
        });

        const activeRunners = workflows.workflow_runs ? workflows.workflow_runs.length * 20 : 0; // Assuming 20-matrix per run
        table.push(
            ['Ephemeral Node', 'GitHub Actions', chalk.green('RUNNING'), activeRunners.toString()],
            ['Persistent Node', 'Codespaces', chalk.green('AVAILABLE'), codespaces.codespaces ? codespaces.codespaces.filter(c => c.state === 'Available').length.toString() : '0']
        );

        console.log(table.toString());
        console.log(chalk.yellow(`\n[SYSTEM] Total Distributed Compute Instances: ${activeRunners + (codespaces.codespaces ? codespaces.codespaces.length : 0)}`));
        console.log(chalk.dim(`\nLast Updated: ${new Date().toISOString()}`));
    } catch (err) {
        console.log(chalk.red('[!] Neural link to cosmos interrupted.'), err);
    }
}

// Poll every 5 seconds for that real-time hacker terminal feel
setInterval(generateMatrixDashboard, 5000);
generateMatrixDashboard();
