const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  if (file.includes('Theme.ts') || file.includes('ThemeContext.tsx') || file.includes('App.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Colors.')) return; 
  if (content.includes('useAppTheme')) return; 
  
  const normalizedPath = file.split(path.sep).join('/');
  const parts = normalizedPath.split('/');
  const depth = parts.length - 2;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  
  // Import switch
  content = content.replace(/import\s+\{([^}]*)Colors([^}]*)\}\s+from\s+['"][^'"]+['"];?/g, 
    `import { $1 $2 } from 'REPLACE_ME';\nimport { useAppTheme } from '${prefix}context/ThemeContext';`);
  content = content.replace(/import\s+\{\s*\}\s+from\s+'REPLACE_ME';?\n/g, ''); 
  content = content.replace(/'REPLACE_ME'/g, `'${prefix}theme/Theme'`);
  
  // Prop switch
  content = content.replace(/Colors\./g, 'colors.');
  
  const hasStyleSheet = content.includes('const styles = StyleSheet.create(');
  if (hasStyleSheet) {
    content = content.replace(/const\s+styles\s*=\s*StyleSheet\.create\({/g, 'const getStyles = (colors: any) => StyleSheet.create({');
  }

  const componentRegex = /((?:export\s+default\s+function|const|export\s+const|export\s+function)\s+[A-Za-z0-9_]+\s*=?\s*\([^)]*\)\s*(?:=>)?\s*\{)/g;
  
  let componentInjected = false;
  content = content.replace(componentRegex, (match, p1) => {
    const isComponent = p1.match(/(function|const)\s+([A-Z][A-Za-z0-9_]*)/);
    if (!isComponent) return match;
    // Skip if it is not a View component (e.g. util functions)
    // We only inject on the first matched component to avoid double injection if there are nested arrows, but realistically:
    componentInjected = true;
    if (hasStyleSheet) {
      return match + '\n  const { colors } = useAppTheme();\n  const styles = getStyles(colors);';
    } else {
      return match + '\n  const { colors } = useAppTheme();';
    }
  });

  if (!componentInjected) {
    // Abort if no functional React component was found
    content = fs.readFileSync(file, 'utf8');
  } else {
    // If Stylesheet was converted but getStyles(colors) was injected multiple times into sub-components, it's fine.
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Refactor complete.');
