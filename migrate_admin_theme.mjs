import fs from 'fs';
import path from 'path';

const searchPath = 'C:\\Users\\DELL\\Desktop\\admin\\src\\pages';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const colorsToReplace = [
    { regex: /bg-\[#0b1326\]/g, replacement: 'bg-[#FAFBFF]' },
    { regex: /bg-\[#131b2e\]/g, replacement: 'bg-white' },
    { regex: /bg-\[#171f3366\]/g, replacement: 'bg-white shadow-sm' },
    { regex: /text-\[#dae2fd\]/g, replacement: 'text-gray-900' },
    { regex: /text-\[#e7bdb8\]/g, replacement: 'text-gray-500' },
    { regex: /text-\[#94A3B8\]/g, replacement: 'text-gray-500' },
    { regex: /border-\[#ae88831a\]/g, replacement: 'border-gray-200' },
    { regex: /divide-\[#ae88830d\]/g, replacement: 'divide-gray-100' },
    { regex: /border-\[#ae88830d\]/g, replacement: 'border-gray-100' },
    { regex: /from-\[#0b1326\] to-\[#060e20\]/g, replacement: 'from-[#FAFBFF] to-gray-50' },
    { regex: /bg-white\/5/g, replacement: 'bg-gray-100' },
    { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-gray-50' },
    { regex: /border-white\/10/g, replacement: 'border-gray-200' },
    { regex: /text-white\/40/g, replacement: 'text-gray-400' },
    { regex: /text-white\/50/g, replacement: 'text-gray-500' },
    { regex: /text-white\/60/g, replacement: 'text-gray-500' },
    { regex: /text-white\/70/g, replacement: 'text-gray-600' },
    { regex: /text-white\/80/g, replacement: 'text-gray-700' },
    { regex: /text-white\/90/g, replacement: 'text-gray-800' },
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    // Skip LoginPage as it's already redesigned cleanly
    if (filePath.includes('LoginPage.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply strict string mapping
    colorsToReplace.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
    });

    // Safely replace text-white with text-gray-900 unless preceded by a red background or a gradient explicitly
    // This regex looks for text-white, but ignores if it's in a line containing bg-[#E31E24] or from-[#E31E24]
    let lines = content.split('\n');
    lines = lines.map(line => {
        if (line.includes('text-white') && !line.includes('bg-[#E31E24]') && !line.includes('from-[#E31E24]') && !line.includes('bg-red') && !line.includes('text-white/')) {
            // Also exclude cases inside Shields or icons explicitly known to hold white in red boxes
            if (!line.includes('color="white"')) {
                 line = line.replace(/text-white/g, 'text-gray-900');
            }
        }
        return line;
    });
    
    content = lines.join('\n');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

walkDir(searchPath, processFile);
console.log("Migration Complete");
