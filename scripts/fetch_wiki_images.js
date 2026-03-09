const https = require('https');
const fs = require('fs');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

// Match all names
const names = [...content.matchAll(/nameEN:\s*"([^"]+)"/g)].map(m => m[1]);

(async () => {
    let newContent = content;
    let replacedCount = 0;

    for (let name of names) {
        // Remove text in parentheses like "(OPC)"
        let cleanName = name.replace(/\s\([^)]+\)/g, '').trim();
        // Specifically add 'construction' to items that are too generic
        let searchString = cleanName;
        if (['Tile Adhesive', 'Sand', 'Gravel', 'Paint', 'Marble', 'Porcelain Tiles'].some(n => cleanName.includes(n))) {
            searchString += ' construction';
        }

        let q = encodeURIComponent('filetype:bitmap ' + searchString);
        let url = await new Promise(resolve => {
            https.get({
                hostname: 'commons.wikimedia.org',
                path: '/w/api.php?action=query&generator=search&gsrsearch=' + q + '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json',
                headers: { 'User-Agent': 'MaterialAppBot/1.0' }
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        let pages = JSON.parse(data).query.pages;
                        let page = Object.values(pages)[0];
                        let thumb = page.imageinfo[0].thumburl;
                        resolve(thumb);
                    } catch (e) {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });

        if (!url) {
            let words = cleanName.split(' ');
            let backupQ = encodeURIComponent('filetype:bitmap ' + words[0] + ' ' + (words[1] || ''));
            url = await new Promise(resolve => {
                https.get({
                    hostname: 'commons.wikimedia.org',
                    path: '/w/api.php?action=query&generator=search&gsrsearch=' + backupQ + '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json',
                    headers: { 'User-Agent': 'MaterialAppBot/1.0' }
                }, res => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => {
                        try {
                            let pages = JSON.parse(data).query.pages;
                            let page = Object.values(pages)[0];
                            let thumb = page.imageinfo[0].thumburl;
                            resolve(thumb);
                        } catch (e) { resolve(null); }
                    });
                }).on('error', () => resolve(null));
            });
        }

        if (url) {
            // Replace the image URL ONLY in the block that contains this nameEN
            let blockRegex = new RegExp(`(nameEN:\\s*"${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}".*?image:\\s*)"https?://[^"]+"`, 's');
            const prev = newContent;
            newContent = newContent.replace(blockRegex, `$1"${url}"`);
            if (prev !== newContent) {
                replacedCount++;
                process.stdout.write(`✅ [${name}] -> ${url}\n`);
            }
        } else {
            console.log(`❌ No image: ${name}`);
        }
    }
    fs.writeFileSync(file, newContent);
    console.log(`\nUpdated ${replacedCount}/${names.length} material images!`);
})();
