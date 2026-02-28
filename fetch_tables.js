const https = require('https');
const fs = require('fs');

const nodes = ['532-8267', '532-8268'];
const key = 'YOUR_FIGMA_API_KEY';

function fetch(nodeId) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'api.figma.com',
            path: `/v1/files/k5ncA5H9RXfEToJSjf77yD/nodes?ids=${nodeId}`,
            headers: { 'X-Figma-Token': key }
        };
        https.get(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
    });
}

function walk(n, depth) {
    if (!n) return;
    let indent = '  '.repeat(depth);
    let info = indent + '<' + n.type + ' name="' + n.name + '"';
    if (n.absoluteBoundingBox) {
        let b = n.absoluteBoundingBox;
        info += ' size="' + Math.round(b.width) + 'x' + Math.round(b.height) + '"';
    }
    if (n.type === 'TEXT') {
        let s = n.style || {};
        info += ' font="' + (s.fontFamily || '') + ' ' + (s.fontWeight || '') + '" fsize="' + (s.fontSize || '') + 'px"';
        info += '> "' + n.characters + '"';
        console.log(info);
        return;
    }
    if (n.fills && n.fills[0] && n.fills[0].color) {
        let c = n.fills[0].color;
        info += ' bg="rgb(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ')"';
    }
    info += '>';
    console.log(info);
    if (n.children) n.children.forEach(c => walk(c, depth + 1));
}

(async () => {
    for (const id of nodes) {
        console.log('\n=== NODE ' + id + ' ===');
        const data = await fetch(id);
        const doc = data.nodes[id.replace('-', ':')].document;
        walk(doc, 0);
    }
})();
