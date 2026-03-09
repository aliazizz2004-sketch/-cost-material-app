const fs = require('fs');
const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/require\("\.\.\/\.\.\/assets\//g, 'require("../assets/');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed relative paths in ' + file);
