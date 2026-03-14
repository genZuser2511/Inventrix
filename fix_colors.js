const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
};

const map = {
  "#FFFFFF": "var(--card)",
  "#F9FAFB": "var(--surface)",
  "#E5E7EB": "var(--border)",
  "#111827": "var(--foreground)",
  "#6B7280": "var(--muted)",
  "#374151": "var(--foreground)",
  "#fff": "var(--card)",
  "#F3F4F6": "var(--border)",
};

const files = walk('./frontend/app');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  for (const ObjectEntry of Object.entries(map)) {
    const hex = ObjectEntry[0];
    const cssVar = ObjectEntry[1];
    if (content.includes(hex)) {
      content = content.split(hex).join(cssVar);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(f, content);
});
console.log('Fixed inline hex colors to CSS variables for dark mode.');
