const fs = require('fs');
const filePath = 'C:\\Users\\Lenovo\\Desktop\\cost material\\cost-material-app\\data\\materials.js';

// Read raw bytes
let buf = fs.readFileSync(filePath);

// Strip UTF-8 BOM if present (EF BB BF)
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  console.log('BOM found, stripping...');
  buf = buf.slice(3);
}

// Verify Kurdish chars are correct now
const text = buf.toString('utf8');
const match = text.match(/nameKU:\s*"([^"]+)"/);
if (match) {
  const sample = match[1];
  console.log('nameKU sample:', sample);
  console.log('First char code:', sample.charCodeAt(0), '(hex:', sample.charCodeAt(0).toString(16) + ')');
}

// Write back without BOM
fs.writeFileSync(filePath, buf);
console.log('File written without BOM. Size:', buf.length);
