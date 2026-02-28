const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'figma_data', 'figma_nodes.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const nodeMap = data.nodes["532:7420"].document;

function parseColor(color) {
    if (!color) return 'transparent';
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function extractNode(node, indent = "") {
    if (!node) return "";
    let type = node.type;
    let name = node.name;
    let result = `${indent}<${type} name="${name}"`;

    if (node.absoluteBoundingBox) {
        const { width, height } = node.absoluteBoundingBox;
        result += ` size="${Math.round(width)}x${Math.round(height)}"`;
    }

    // Fills (background color)
    if (node.fills && node.fills.length > 0) {
        const solidFills = node.fills.filter(f => f.type === 'SOLID' && f.visible !== false);
        if (solidFills.length > 0) {
            result += ` bg="${parseColor(solidFills[0].color)}"`;
        }
    }

    // Text details
    if (node.type === 'TEXT') {
        result += ` font="${node.style?.fontFamily} ${node.style?.fontWeight}" size="${node.style?.fontSize}px" color="${node.fills?.[0]?.color ? parseColor(node.fills[0].color) : ''}"`;
        result += `>\n${indent}  "${node.characters?.replace(/\n/g, '\\n')}"\n${indent}</TEXT>\n`;
        return result;
    }

    result += ">";
    if (node.children && node.children.length > 0) {
        result += "\n";
        for (const child of node.children) {
            result += extractNode(child, indent + "  ");
        }
        result += `${indent}</${type}>\n`;
    } else {
        result += `</${type}>\n`;
    }
    return result;
}

const simpleLayout = extractNode(nodeMap);
fs.writeFileSync(path.join(__dirname, 'figma_data', 'layout_simplified.txt'), simpleLayout);
console.log("Saved layout_simplified.txt");
