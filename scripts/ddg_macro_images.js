const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');
const assetDir = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/assets/materials';

// Custom search queries designed to bring up perfect close-ups or studio shots
const SEARCH_QUERIES = {
    1: "cement bag isolated white background",
    2: "white cement bag isolated studio",
    3: "portland cement stack isolated",
    4: "gypsum plaster bag isolated white background",
    5: "tile adhesive bag professional",
    6: "steel rebar bundle close up texture",
    7: "steel I-beam close up isolated",
    8: "steel angle bar close up isolated",
    9: "concrete block close up texture",
    10: "concrete block hollow texture close up",
    11: "red brick texture close up high res",
    12: "fire brick close up texture",
    13: "natural stone limestone block texture",
    14: "aac block ytong close up",
    15: "pile of fine sand close up texture",
    16: "crushed gravel close up texture",
    17: "ready mix concrete texture wet close up",
    18: "wet concrete texture macro",
    19: "ceramic tile texture close up",
    20: "porcelain floor tile texture macro",
    21: "carrara marble slab texture high res",
    22: "polished granite slab texture close up",
    23: "travertine stone tile texture macro",
    24: "gypsum board drywall sheet close up edge",
    25: "interior paint bucket white background",
    26: "exterior paint bucket white background",
    27: "aluminium window frame corner close up",
    28: "upvc window frame profile close up",
    29: "clear glass sheet edge close up",
    30: "solid wood door panel close up",
    31: "steel security door texture close up",
    32: "pvc pipe fittings bundle close up",
    33: "ppr water pipe green close up",
    34: "polyethylene water tank isolated white",
    35: "electrical copper cable cross section close up",
    36: "electrical wire bundle close up",
    37: "bitumen waterproofing membrane roll close up",
    38: "eps polystyrene foam texture macro",
    39: "xps foam board pink texture macro",
    40: "rockwool insulation texture close up",
    41: "sandwich panel roof close up edge",
    42: "corrugated galvanized iron roofing texture",
    43: "asphalt pavement road texture macro",
    44: "plywood sheet edge close up texture",
    45: "timber lumber wooden planks texture macro",
    46: "mdf board edge close up texture",
    47: "steel wire mesh roll close up",
    48: "construction scaffolding tubes detail",
    49: "acoustic ceiling tile texture close up",
    50: "epoxy resin floor texture smooth",
    51: "wooden framing lumber pile close up",
    52: "laminate flooring plank texture macro",
    53: "chipboard particle board texture macro",
    54: "teak wood grain texture high res",
    55: "oak wood plank texture macro",
    56: "polished concrete floor texture macro"
};

function fetchJSON(url, headers) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function searchDuckDuckGoImages(query) {
    // 1. Get VQD token
    const html = await fetchHTML(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`);
    const match = html.match(/vqd=([\d-]+)/);
    if (!match) throw new Error("No VQD found");
    const vqd = match[1];

    // 2. Search images
    const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const res = await fetchJSON(url, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://duckduckgo.com/',
    });
    return res.results;
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const protocol = parsed.protocol === 'https:' ? https : (parsed.protocol === 'http:' ? http : null);
        if (!protocol) return reject("Invalid protocol");

        const timeout = setTimeout(() => reject("Timeout"), 10000);
        const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            clearTimeout(timeout);
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) return reject(`Status ${res.statusCode}`);
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            clearTimeout(timeout);
            fs.unlink(dest, () => { });
            reject(err.message);
        });
    });
}

async function run() {
    console.log("Searching and downloading close-up macro photos...");
    let result = [];
    const lines = content.split('\n');
    let replaced = 0;

    // We already have `require(...)` in the files, so we just need to overwrite the .jpgs!
    // We don't even need to modify materials.js if they are pointing to local assets. 
    // Wait, let's verify if materials.js uses exact currentId.jpg.
    // Actually, in the last steps I reverted to wsrv.nl so I MUST modify materials.js again to use the local assets!

    let currentId = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const idMatch = line.match(/^\s*id:\s*(\d+),/);
        if (idMatch) currentId = parseInt(idMatch[1]);

        if (line.includes('image: ')) {
            if (currentId && SEARCH_QUERIES[currentId]) {
                const imgPath = path.join(assetDir, `${currentId}.jpg`);
                try {
                    console.log(`Searching DDG: ${SEARCH_QUERIES[currentId]}`);
                    const images = await searchDuckDuckGoImages(SEARCH_QUERIES[currentId]);
                    if (images && images.length > 0) {
                        let success = false;
                        for (let j = 0; j < Math.min(6, images.length); j++) {
                            try {
                                await download(images[j].image, imgPath);
                                // Ensure > 5KB to avoid broken images
                                if (fs.statSync(imgPath).size > 5000) {
                                    success = true; break;
                                }
                            } catch (e) { }
                        }
                        if (success) console.log(`✓ Got high-res photo for ID ${currentId}`);
                        else console.log(`Failed all photo downloads for ID ${currentId}`);
                    }
                    result.push(`    image: require("../../assets/materials/${currentId}.jpg"),`);
                    replaced++;
                } catch (e) {
                    console.log(`Skipping ID ${currentId}: ${e.message}`);
                    result.push(`    image: require("../../assets/materials/${currentId}.jpg"),`);
                }
            } else {
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }

    fs.writeFileSync(file, result.join('\n'), 'utf8');
    console.log(`Done! Synced ${replaced} stunning macro/studio photos directly to local app storage.`);
}

run();
