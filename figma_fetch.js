const http = require('http');

function sseConnect() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3845,
            path: '/sse',
            method: 'GET'
        }, (res) => {
            let buf = '';
            res.on('data', (chunk) => {
                buf += chunk;
                // Look for endpoint event
                const match = buf.match(/data: (\/messages\?sessionId=[^\n]+)/);
                if (match) {
                    res.destroy();
                    resolve(match[1]);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function mcpRequest(sessionPath, method, params = {}, id = 1) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3845,
            path: sessionPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let d = '';
            res.on('data', (c) => d += c);
            res.on('end', () => resolve(d));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function sseWaitForResponse(id) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3845,
            path: '/sse',
            method: 'GET'
        }, (res) => {
            let buf = '';
            res.on('data', (chunk) => {
                buf += chunk;
                // Check for our response
                if (buf.includes(`"id":${id}`) || buf.includes(`"id": ${id}`)) {
                    // Extract JSON from SSE data
                    const lines = buf.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line.includes('"result"')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                res.destroy();
                                resolve(data);
                                return;
                            } catch (e) { }
                        }
                    }
                }
            });
            setTimeout(() => {
                res.destroy();
                resolve(buf);
            }, 10000);
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        // Step 1: Connect and get session
        console.log('Connecting to Figma MCP server...');

        // We need to keep the SSE connection open while sending requests
        // Use a single connection approach
        const sseReq = http.request({
            hostname: '127.0.0.1',
            port: 3845,
            path: '/sse',
            method: 'GET'
        }, (res) => {
            let buf = '';
            let sessionPath = null;
            let initialized = false;

            res.on('data', async (chunk) => {
                buf += chunk.toString();
                const lines = buf.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: /messages?sessionId=') && !sessionPath) {
                        sessionPath = line.substring(6).trim();
                        console.log('Session:', sessionPath);

                        // Initialize
                        const initResp = await mcpRequest(sessionPath, 'initialize', {
                            protocolVersion: '2024-11-05',
                            capabilities: {},
                            clientInfo: { name: 'figma-reader', version: '1.0.0' }
                        }, 1);
                        console.log('Init response:', initResp);
                    }

                    if (line.startsWith('data: {') && !line.includes('/messages?')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.id === 1 && data.result) {
                                console.log('Server capabilities:', JSON.stringify(data.result, null, 2));
                                initialized = true;

                                // Send initialized notification
                                await mcpRequest(sessionPath, 'notifications/initialized', {}, undefined);

                                // List tools
                                const toolsResp = await mcpRequest(sessionPath, 'tools/list', {}, 2);
                                console.log('Tools list sent');
                            }

                            if (data.id === 2 && data.result) {
                                console.log('Available tools:', JSON.stringify(data.result, null, 2));

                                // Now call get_file to get the design
                                const fileResp = await mcpRequest(sessionPath, 'tools/call', {
                                    name: 'get_file',
                                    arguments: {
                                        fileKey: 'k5ncA5H9RXfEToJSjf77yD',
                                        nodeId: '532-7420',
                                        depth: 5
                                    }
                                }, 3);
                                console.log('File request sent');
                            }

                            if (data.id === 3 && data.result) {
                                console.log('=== FIGMA FILE DATA ===');
                                console.log(JSON.stringify(data.result, null, 2));
                                process.exit(0);
                            }

                            if (data.error) {
                                console.log('Error:', JSON.stringify(data.error));
                            }
                        } catch (e) {
                            // not JSON
                        }
                    }
                }
            });
        });

        sseReq.on('error', (e) => console.error('SSE Error:', e));
        sseReq.end();

        // Timeout after 30 seconds
        setTimeout(() => {
            console.log('Timeout reached');
            process.exit(1);
        }, 30000);

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
