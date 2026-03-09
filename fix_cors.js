const fs = require('fs');

const materialsFilePath = 'c:\\Users\\Lenovo\\Desktop\\cost material\\cost-material-app\\data\\materials.js';

let content = fs.readFileSync(materialsFilePath, 'utf8');

// Replace all instances of `image: "https://upload.wikimedia.org/` with `image: "https://wsrv.nl/?url=upload.wikimedia.org/`
content = content.replace(/image: "https:\/\/upload\.wikimedia\.org\//g, 'image: "https://wsrv.nl/?url=upload.wikimedia.org/');

fs.writeFileSync(materialsFilePath, content);
console.log('Fixed Wikimedia CORS by using wsrv proxy!');
