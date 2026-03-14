const fs = require('fs');
const fn = './frontend/app/dashboard/layout.tsx';
let content = fs.readFileSync(fn, 'utf8');

content = content.replace('bg-background', '');
content = content.replace("backgroundColor: '#F9FAFB'", "backgroundColor: 'var(--surface)'");
content = content.replace('backgroundColor: "var(--background)"', '');

fs.writeFileSync(fn, content);
console.log('Fixed dashboard layout.');
