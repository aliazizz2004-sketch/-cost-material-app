const fs = require('fs');

const materialsFilePath = 'c:\\Users\\Lenovo\\Desktop\\cost material\\cost-material-app\\data\\materials.js';

let content = fs.readFileSync(materialsFilePath, 'utf8');

// Replace wsrv.nl or upload.wikimedia.org URLs with Google's CORS proxy
content = content.replace(/image:\s*"https:\/\/(wsrv\.nl\/\?url=(https:\/\/)?upload\.wikimedia\.org\/|upload\.wikimedia\.org\/)([^"]+)"/g, (match, prefix, proto, path) => {
    // The path contains everything after upload.wikimedia.org/
    const targetUrl = `https://upload.wikimedia.org/${path}`;
    const encodedUrl = encodeURIComponent(targetUrl);
    return `image: "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodedUrl}"`;
});

fs.writeFileSync(materialsFilePath, content);
console.log('Fixed Wikipedia images to use Google CORS proxy!');
