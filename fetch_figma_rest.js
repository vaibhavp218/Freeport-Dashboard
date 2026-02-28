const https = require('https');
const fs = require('fs');
const path = require('path');

const FIGMA_API_KEY = 'YOUR_FIGMA_API_KEY';
const FILE_KEY = 'k5ncA5H9RXfEToJSjf77yD';
const NODE_IDS = '532:7420'; // Based on the user's script: "532-7420"
const OUTPUT_DIR = path.join(__dirname, "figma_data");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetchFigma(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.figma.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'X-Figma-Token': FIGMA_API_KEY
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`API Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    console.log("Fetching Figma data...");
    try {
        // 1. Get file data for the node
        const fileUrl = `/v1/files/${FILE_KEY}/nodes?ids=${NODE_IDS}`;
        const fileData = await fetchFigma(fileUrl);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'figma_nodes.json'),
            JSON.stringify(fileData, null, 2)
        );
        console.log("Saved figma_nodes.json successfully.");

    } catch (error) {
        console.error("Failed:", error.message);
    }
}

main();
