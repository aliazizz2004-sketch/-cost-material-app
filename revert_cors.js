const fs = require('fs');
const path = require('path');

const materialsFilePath = path.join(__dirname, 'data', 'materials.js');

let content = fs.readFileSync(materialsFilePath, 'utf8');

// The proxy URL pattern to match
const proxyRegex = /image:\s*"https:\/\/images1-focus-opensocial\.googleusercontent\.com\/gadgets\/proxy\?container=focus&refresh=2592000&url=([^"]+)"/g;

content = content.replace(proxyRegex, (match, urlParam) => {
    // Decode the URL
    const decodedUrl = decodeURIComponent(urlParam);
    return `image: "${decodedUrl}"`;
});

fs.writeFileSync(materialsFilePath, content);
console.log('Reverted Google CORS proxy to original Wikimedia URLs!');
