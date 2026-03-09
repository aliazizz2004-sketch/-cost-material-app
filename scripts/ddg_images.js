const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const DDG = require('duckduckgo-images-api');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

const assetDir = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/assets/materials';

// Custom search queries designed to bring up perfect close-ups or studio shots
const SEARCH_QUERIES = {
    1: "Portland cement bag close up isolated professional",
    2: "White cement bag close up",
    3: "Portland cement bags stacked",
    4: "Gypsum plaster bag",
    5: "Tile adhesive bag",
    6: "Steel rebar bundle isolated close up",
    7: "Steel I-Beam construction closeup",
    8: "Steel Angle Bar closeup",
    9: "20cm Concrete block isolated",
    10: "15cm concrete block isolated",
    11: "Red brick isolated",
    12: "Fire brick refractory close up",
    13: "Natural limestone block texture",
    14: "Ytong AAC blocks closeup",
    15: "Pile of fine silica sand close up",
    16: "Crushed gravel pile close up",
    17: "Ready mix concrete truck pouring close up",
    18: "Cement mixer pouring ready mix",
    19: "Ceramic floor tile isolated",
    20: "Porcelain tile slab isolated",
    21: "Carrara marble slab close up",
    22: "Granite slab texture isolated",
    23: "Travertine stone tile closeup",
    24: "Gypsum board drywall sheet isolated",
    25: "Interior paint bucket isolated",
    26: "Exterior paint bucket isolated",
    27: "Aluminium window frame close up",
    28: "UPVC window frame close up",
    29: "Clear glass sheet window",
    30: "Solid wooden door isolated",
    31: "Steel security door isolated",
    32: "PVC pipe fittings isolated",
    33: "PPR water pipes isolated",
    34: "Polyethylene water tank isolated",
    35: "Electrical copper cable wire closeup",
    36: "Electric cable wiring closeup",
    37: "Bitumen waterproofing membrane roll",
    38: "Expanded polystyrene foam EPS insulation",
    39: "XPS foam board insulation pink",
    40: "Rockwool insulation batt",
    41: "Sandwich panel roofing closeup",
    42: "Corrugated galvanized iron roofing sheet",
    43: "Asphalt pavement concrete texture",
    44: "Plywood sheet isolated",
    45: "Timber lumber wooden planks stack",
    46: "MDF board sheet isolated",
    47: "Steel BRC wire mesh closeup",
    48: "Construction scaffolding steel tubes",
    49: "Suspended ceiling tile acoustic",
    50: "Epoxy resin floor sample",
    51: "Wooden framing lumber pile",
    52: "Laminate flooring plank isolated",
    53: "Chipboard particle board sheet",
    54: "Teak wood grain board",
    55: "Oak wood plank isolated",
    56: "Polished concrete floor texture"
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const protocol = parsed.protocol === 'https:' ? https : (parsed.protocol === 'http:' ? http : null);
        if (!protocol) return reject("Invalid protocol");

        // Timeout mechanism to prevent hanging
        const timeout = setTimeout(() => {
            reject("Timeout");
        }, 8000);

        const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
            clearTimeout(timeout);
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                return reject(`Status ${res.statusCode}`);
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            fs.unlink(dest, () => { });
            reject(err.message);
        });

        req.on('socket', function (socket) {
            socket.setTimeout(8000);
            socket.on('timeout', function () { req.abort(); });
        });
    });
}

async function run() {
    console.log("Searching DDG images and downloading specific photos...");
    let result = [];
    let replaced = 0;

    // Process line by line
    const lines = content.split('\n');
    let currentId = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const idMatch = line.match(/^\s*id:\s*(\d+),/);
        if (idMatch) currentId = parseInt(idMatch[1]);

        if (line.includes('image: ')) {
            if (currentId && SEARCH_QUERIES[currentId]) {
                const imgPath = path.join(assetDir, `${currentId}.jpg`);
                try {
                    console.log(`Searching: ${SEARCH_QUERIES[currentId]}...`);
                    const results = await DDG.image_search({ query: SEARCH_QUERIES[currentId], moderate: true, retries: 2, iterations: 1 });
                    if (results && results.length > 0) {
                        // try to download first working image
                        let success = false;
                        for (let j = 0; j < Math.min(5, results.length); j++) {
                            try {
                                await download(results[j].image, imgPath);
                                success = true;
                                console.log(`✓ Downloaded image for ID ${currentId}`);
                                break;
                            } catch (e) { } // Ignore download errors, try next
                        }
                        if (!success) {
                            console.log(`Failed all downloads for ID ${currentId}`);
                        }
                    }
                    result.push(`    image: require("../../assets/materials/${currentId}.jpg"),`);
                    replaced++;
                } catch (e) {
                    console.log(`Failed DDG search ID ${currentId}: ${e.message}`);
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
    console.log(`Finished! Updated ${replaced} images to exact photos.`);
}

run();
