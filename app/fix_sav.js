const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else { 
            if (fullPath.endsWith('.tsx')) results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src/screens');
let numFixed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("SafeAreaView") && !content.includes("react-native-safe-area-context")) {
        content = content.replace(/import\s+{(.*?)}\s+from\s+'react-native';/, (match, p1) => {
            const parts = p1.split(',').map(s => s.trim()).filter(s => s !== 'SafeAreaView');
            return `import { ${parts.join(', ')} } from 'react-native';\nimport { SafeAreaView } from 'react-native-safe-area-context';`;
        });
        fs.writeFileSync(file, content);
        console.log("Fixed " + file);
        numFixed++;
    }
});
console.log("Total fixed: " + numFixed);
