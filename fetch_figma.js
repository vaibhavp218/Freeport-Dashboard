const { Client } = require("@anthropic/sdk");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const FIGMA_FILE_KEY = "dHDo42KIwNYAlMrgMxBjkz";
const OUTPUT_DIR = path.join(__dirname, "figma_data");

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Launch MCP server
    const serverProcess = spawn("npx", ["-y", "figma-developer-mcp", "--stdio"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, FIGMA_API_KEY: process.env.FIGMA_API_KEY },
        shell: true,
    });

    let buffer = "";
    const pendingResponses = new Map();
    let nextId = 1;

    serverProcess.stdout.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const msg = JSON.parse(trimmed);
                if (msg.id && pendingResponses.has(msg.id)) {
                    pendingResponses.get(msg.id)(msg);
                }
            } catch (e) { }
        }
    });

    serverProcess.stderr.on("data", (chunk) => {
        // Suppress stderr
    });

    function sendRequest(method, params) {
        return new Promise((resolve) => {
            const id = nextId++;
            pendingResponses.set(id, resolve);
            const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
            serverProcess.stdin.write(msg + "\n");
        });
    }

    // Wait for server to start
    await new Promise((r) => setTimeout(r, 3000));

    // Initialize
    await sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "fetcher", version: "1.0.0" },
    });

    console.log("MCP initialized. Fetching design data...");

    // 1) get_metadata
    console.log("Fetching metadata...");
    try {
        const metaRes = await sendRequest("tools/call", {
            name: "get_metadata",
            arguments: { fileKey: FIGMA_FILE_KEY },
        });
        const metaContent = metaRes.result?.content?.[0]?.text || JSON.stringify(metaRes.result);
        fs.writeFileSync(path.join(OUTPUT_DIR, "metadata.json"), metaContent, "utf8");
        console.log("  Saved metadata.json");
    } catch (e) {
        console.error("  Error fetching metadata:", e.message);
    }

    // 2) get_design_context for full file
    console.log("Fetching design context...");
    try {
        const dcRes = await sendRequest("tools/call", {
            name: "get_design_context",
            arguments: { fileKey: FIGMA_FILE_KEY, depth: 3 },
        });
        const dcContent = dcRes.result?.content?.[0]?.text || JSON.stringify(dcRes.result);
        fs.writeFileSync(path.join(OUTPUT_DIR, "design_context.json"), dcContent, "utf8");
        console.log("  Saved design_context.json");
    } catch (e) {
        console.error("  Error fetching design context:", e.message);
    }

    // 3) get_code (CSS)
    console.log("Fetching CSS code...");
    try {
        const codeRes = await sendRequest("tools/call", {
            name: "get_code",
            arguments: { fileKey: FIGMA_FILE_KEY, codeFormat: "css" },
        });
        const codeContent = codeRes.result?.content?.[0]?.text || JSON.stringify(codeRes.result);
        fs.writeFileSync(path.join(OUTPUT_DIR, "code_css.json"), codeContent, "utf8");
        console.log("  Saved code_css.json");
    } catch (e) {
        console.error("  Error fetching CSS code:", e.message);
    }

    console.log("Done! All data saved to figma_data/");
    serverProcess.kill();
    process.exit(0);
}

main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
