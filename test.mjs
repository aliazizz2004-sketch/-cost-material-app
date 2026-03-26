import fs from 'fs';
const txt = fs.readFileSync('data/materials.js', 'utf8');
const ms = txt.match(/\{[\s\S]*?\}/g);
let out = '';
if(ms) {
    ms.forEach(m => {
        const nameMatch = m.match(/nameEN:\s*`([^`]+)`|nameEN:\s*'([^']+)'|nameEN:\s*"([^"]+)"/);
        const imgMatch = m.match(/image:\s*(.*)/);
        if (nameMatch) {
            const name = nameMatch[1]||nameMatch[2]||nameMatch[3];
            if (!imgMatch || imgMatch[1].includes('http')) {
                out += name + ' -> ' + (imgMatch ? imgMatch[1] : 'NONE') + '\n';
            }
        }
    });
}
fs.writeFileSync('missing.txt', out, 'utf8');
