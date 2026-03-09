const fs = require('fs');
const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

let replaced = 0;
// Find all upload.wikimedia.org URLs and prefix them with Weserv proxy
content = content.replace(/image:\s*"https:\/\/upload\.wikimedia\.org\/([^"\?]+)(?:\?[^"]*)?"/g, function (match, path) {
    replaced++;
    return 'image: "https://images.weserv.nl/?url=upload.wikimedia.org/' + path + '&w=320"';
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ' + replaced + ' images with proxy to prevent ORB.');
