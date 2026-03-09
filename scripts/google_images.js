const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const google = require('googlethis');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

const assetDir = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/assets/materials';

// Highly optimized Google Image queries to get absolute close-up photos matching the list
const SEARCH_QUERIES = {
    1: "portland cement bag isolated high res",
    2: "white cement bag isolated high res",
    3: "portland cement bag close up",
    4: "gypsum plaster bag isolated white background",
    5: "tile adhesive bag professional isolated",
    6: "steel rebar bundle close up texture raw",
    7: "steel I-beam close up isolated straight",
    8: "steel angle bar close up isolated metal",
    9: "concrete hollow block close up texture",
    10: "concrete block hollow texture close up masonry",
    11: "red brick texture close up high res single",
    12: "fire brick close up texture single refractory",
    13: "natural stone limestone block texture rough",
    14: "aac block ytong close up texture pore",
    15: "pile of fine silica sand close up texture macro",
    16: "crushed gravel close up texture aggregate",
    17: "ready mix concrete texture wet close up grey",
    18: "wet concrete texture macro gray",
    19: "ceramic floor tile isolated close up texture",
    20: "porcelain slab tile isolated close up texture",
    21: "carrara marble slab texture high res seamless",
    22: "polished granite slab texture close up stone",
    23: "travertine stone tile texture macro raw",
    24: "gypsum board drywall sheet close up edge white",
    25: "interior paint bucket white background isolated",
    26: "exterior paint bucket white background isolated",
    27: "aluminium window frame corner close up cross section",
    28: "upvc window frame profile close up cross section",
    29: "clear float glass sheet edge close up",
    30: "solid wooden door panel close up texture",
    31: "steel security door texture close up metal",
    32: "pvc pipe fittings bundle close up grey plastic",
    33: "ppr water pipe green close up construction",
    34: "polyethylene water tank isolated white plastic",
    35: "electrical copper cable cross section close up wire",
    36: "electrical wire bundle close up copper construction",
    37: "bitumen waterproofing membrane roll close up black asphalt",
    38: "eps polystyrene foam texture macro white bead",
    39: "xps foam board pink texture macro insulation",
    40: "rockwool insulation texture close up yellow fibrous",
    41: "sandwich panel roof close up edge metal insulation",
    42: "corrugated galvanized iron roofing texture metal sheet",
    43: "asphalt pavement road texture macro black tar",
    44: "plywood sheet edge close up texture wood grain layer",
    45: "timber lumber wooden planks texture macro construction pile",
    46: "mdf board edge close up texture uniform wood",
    47: "steel wire mesh roll close up brc concrete reinforcement",
    48: "construction scaffolding tubes detail steel structural joint",
    49: "acoustic ceiling tile texture close up perforated white",
    50: "epoxy resin floor texture smooth reflective seamless",
    51: "wooden framing lumber pile close up construction 2x4 stack",
    52: "laminate flooring plank texture macro wood finish isolated",
    53: "chipboard particle board texture macro flake wood panel",
    54: "teak wood grain texture high res brown solid",
    55: "oak wood plank texture macro light brown solid natural",
    56: "polished concrete floor texture macro smooth shine grey"
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const protocol = parsed.protocol === 'https:' ? https : (parsed.protocol === 'http:' ? http : null);
        if (!protocol) return reject("Invalid protocol");

        const timeout = setTimeout(() => reject("Timeout"), 5000);
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

        req.on('socket', function (socket) {
            socket.setTimeout(6000);
            socket.on('timeout', function () { req.abort(); });
        });
    });
}

async function run() {
    console.log("Searching Google Images to download incredibly close-up macro product photos...");
    let result = [];
    const lines = content.split('\n');
    let replaced = 0;

    let currentId = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const idMatch = line.match(/^\s*id:\s*(\d+),/);
        if (idMatch) currentId = parseInt(idMatch[1]);

        if (line.includes('image: ')) {
            if (currentId && SEARCH_QUERIES[currentId]) {
                const imgPath = path.join(assetDir, `${currentId}.jpg`);
                try {
                    // Only download if missing or obviously too small
                    if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 1000) {
                        console.log(`Searching Google Images: ${SEARCH_QUERIES[currentId]}`);
                        const images = await google.image(SEARCH_QUERIES[currentId], { safe: false });

                        let success = false;
                        if (images && images.length > 0) {
                            for (let j = 0; j < Math.min(10, images.length); j++) {
                                try {
                                    // Make sure it doesn't look like an ugly transparent placeholder or small icon
                                    if (images[j].url.includes("placeholder") || images[j].url.endsWith(".svg")) continue;

                                    await download(images[j].url, imgPath);
                                    if (fs.statSync(imgPath).size > 2000) { // Require at least 2KB for valid macro textures
                                        success = true; break;
                                    }
                                } catch (e) { }
                            }
                        }
                        if (success) console.log(`✓ Got high-res photo for ID ${currentId}`);
                        else {
                            console.log(`Failed all photo downloads for ID ${currentId}, creating fallback empty image!`);
                        }
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
    console.log(`Done! Configured ${replaced} items to use pure local asset photography.`);
}

run();
