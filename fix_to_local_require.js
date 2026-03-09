const fs = require('fs');
const path = require('path');

const materialsFilePath = path.join(__dirname, 'data', 'materials.js');
let content = fs.readFileSync(materialsFilePath, 'utf8');

// Replace standard image URL links with require state form the local assets
content = content.replace(/id:\s*(\d+),([\s\S]*?)image:\s*".*?"/g, (match, idStr, middle) => {
    return `id: ${idStr},${middle}image: require("../assets/materials/m_${idStr}.jpg")`;
});

fs.writeFileSync(materialsFilePath, content, 'utf8');
console.log("Updated materials.js to use local images via require().");
