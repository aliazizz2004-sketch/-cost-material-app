const fs = require('fs');
const path = require('path');
const https = require('https');

const materialsFilePath = path.join(__dirname, 'data', 'materials.js');
const assetsDir = path.join(__dirname, 'assets', 'materials');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

let content = fs.readFileSync(materialsFilePath, 'utf8');

// We will extract all image URLs
const regex = /id:\s*(\d+)[^}]*?image:\s*"([^"]+)"/g;
let match;
const records = [];

while ((match = regex.exec(content)) !== null) {
    records.push({
        id: match[1],
        url: match[2],
        fullMatch: match[0]
    });
}

function fetchUrl(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6'
            }
        };

        const getRequest = url.startsWith('https') ? require('https') : require('http');

        const req = getRequest.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // follow redirect
                let newUrl = res.headers.location;
                if (!newUrl.startsWith('http')) newUrl = 'https://upload.wikimedia.org' + newUrl;
                return fetchUrl(newUrl, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode} for ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    let newContent = content;

    for (const rec of records) {
        let url = rec.url;
        // Fix proxy remnants
        if (url.includes('images1-focus-opensocial.googleusercontent.com')) {
            const m = url.match(/url=(http[^&]+)/);
            if (m) url = decodeURIComponent(m[1]);
        }
        if (url.includes('wsrv.nl')) {
            const m = url.match(/url=([^&]+)/);
            if (m) url = "https://" + decodeURIComponent(m[1]);
        }
        if (!url.startsWith('http')) {
            console.log("Skipping invalid URL", url);
            continue;
        }

        const ext = '.jpg';
        const filename = `m_${rec.id}${ext}`;
        const dest = path.join(assetsDir, filename);

        try {
            console.log(`Fetching ${url}`);
            await fetchUrl(url, dest);
        } catch (e) {
            console.log(`Failed to fetch ${url}, falling back to placeholder`, e.message);
            try {
                await fetchUrl("https://picsum.photos/200", dest);
            } catch (ex) { }
        }

        // Replace the string
        const oldImageStr = `image: "${rec.url}"`;
        const newImageStr = `image: require('../assets/materials/${filename}')`;
        newContent = newContent.replace(oldImageStr, newImageStr);
    }

    fs.writeFileSync(materialsFilePath, newContent);
    console.log("Done updating materials.js");
}

run();
