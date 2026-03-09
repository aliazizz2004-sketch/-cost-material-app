const fs = require('fs');
const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

// Use an image proxy (weserv.nl) to bypass Wikimedia CORS/ORB restrictions 
// so the realistic thumbnails actually load in the browser.
let count = 0;

content = content.replace(/image:\s*"https:\/\/upload\.wikimedia\.org\/([^"]+)"/g, function (match, path) {
    // path is like "wikipedia/commons/thumb/..."
    count++;
    return 'image: "https://images.weserv.nl/?url=upload.wikimedia.org/' + path + '&w=320"';
});

fs.writeFileSync(file, content, 'utf8');
console.log('Wrapped ' + count + ' image URLs with images.weserv.nl proxy to fix ORB/CORS.');
