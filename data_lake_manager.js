const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'swarm_data_lake.json');

// Initialize Data Lake if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ 
        totalEntitiesAcquired: 0, 
        lastUpdate: new Date().toISOString(),
        intelligenceRecords: [] 
    }, null, 2));
}

console.log('[DATA LAKE] Neural Storage Array initialized.');

// Expose a function to ingest raw intelligence from the Swarm nodes
function ingestIntelligence(sourceNode, entityName, rawData, classification) {
    const lake = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    const newRecord = {
        id: 'REQ-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        sourceNode: sourceNode,
        entity: entityName,
        classification: classification,
        dataSize: rawData.length
    };

    lake.intelligenceRecords.unshift(newRecord); // Add to top
    lake.totalEntitiesAcquired += 1;
    lake.lastUpdate = new Date().toISOString();

    // Keep it optimized, store only last 500 records in memory for quick retrieval
    if (lake.intelligenceRecords.length > 500) {
        lake.intelligenceRecords.pop();
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(lake, null, 2));
    console.log(`[DATA LAKE] Ingested new intelligence: [${entityName}] from node ${sourceNode}. Total Records: ${lake.totalEntitiesAcquired}`);
}

// Simulated Ingestion for testing the architecture (since we aren't running the real WSS hub here)
function simulateGlobalIngestion() {
    const nodes = ['GH-RUNNER-US-EAST', 'GH-RUNNER-EU-WEST', 'CODESPACE-ALPHA', 'GH-RUNNER-AP-SOUTH'];
    const topics = ['Quantum Cryptography', 'AI Alignment', 'Darknet Topology', 'Zero-Day Heuristics', 'Neural Synthesis', 'Distributed Consensus'];
    
    setInterval(() => {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const simulatedData = "0x" + Math.random().toString(16).substr(2, 64);
        
        ingestIntelligence(randomNode, randomTopic, simulatedData, 'TOP_SECRET');
    }, 3000); // Swarm ingests 1 record every 3 seconds
}

simulateGlobalIngestion();
