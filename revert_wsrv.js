const fs = require('fs');
const path = require('path');

const materialsFilePath = path.join(__dirname, 'data', 'materials.js');

let content = fs.readFileSync(materialsFilePath, 'utf8');

// The proxy URL pattern to match
content = content.replace(/https:\/\/wsrv\.nl\/\?url=upload\.wikimedia\.org/g, 'https://upload.wikimedia.org');

// also fix the test picsum
content = content.replace(/https:\/\/picsum\.photos\/200/g, 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Portland_cement_clinker.jpg/640px-Portland_cement_clinker.jpg');

fs.writeFileSync(materialsFilePath, content);
console.log('Reverted to direct Wikimedia URLs!');
