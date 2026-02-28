const fs = require('fs');
const data = JSON.parse(fs.readFileSync('figma_data/figma_node_v2.json'));

function walk(n, depth) {
    if (!n) return;
    let indent = '  '.repeat(depth);
    let info = indent + '<' + n.type + ' name="' + n.name + '"';
    if (n.absoluteBoundingBox) {
        info += ' size="' + Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) + '"';
    }
    if (n.fills && n.fills[0] && n.fills[0].color) {
        let c = n.fills[0].color;
        info += ' bg="rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + (c.a || 1).toFixed(2) + ')"';
    }
    if (n.type === 'TEXT') {
        let s = n.style || {};
        info += ' font="' + (s.fontFamily || '') + ' ' + (s.fontWeight || '') + '" fsize="' + (s.fontSize || '') + 'px"';
        info += '>';
        console.log(info);
        console.log(indent + '  "' + n.characters + '"');
        console.log(indent + '</' + n.type + '>');
        return;
    }
    info += '>';
    console.log(info);
    if (n.children) n.children.forEach(c => walk(c, depth + 1));
    console.log(indent + '</' + n.type + '>');
}

const doc = data.nodes['532:8266'].document;
walk(doc, 0);
