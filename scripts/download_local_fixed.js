const fs = require('fs');
const https = require('https');
const path = require('path');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

const assetDir = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/assets/materials';
if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
}

// Exactly hand-picked high quality URLs - mapping to ORIGINAL file paths
const EXACT_IMAGES = {
    1: "Portland_Cement_Bags.jpg",
    2: "White_cement.jpg",
    3: "Portland_Cement_Bags.jpg",
    4: "Gypsum_plaster.jpg",
    5: "Tileadhesive.jpg",
    6: "Rebar_and_wires.jpg",
    7: "I-Beam.JPG",
    8: "Metal_angle_steel.jpg",
    9: "Concrete-blocks.jpg",
    10: "Concrete-blocks.jpg",
    11: "Brick_wall_close-up_view.jpg",
    12: "Firebrick.JPG",
    13: "Limestone_quarry.jpg",
    14: "Ytong_blocks.jpg",
    15: "Image-Silica.jpg",
    16: "Crushed_gravel.jpg",
    17: "Pouring_concrete.jpg",
    18: "Pouring_concrete.jpg",
    19: "Ceramic_tile_floor.jpg",
    20: "Porcelain_tile.jpg",
    21: "Carrara_marble_floor.jpg",
    22: "Granite_Yosemite_P1080750.jpg",
    23: "Travertine_closeup.jpg",
    24: "Drywall-segments.jpg",
    25: "Paint_can.jpg",
    26: "Exterior_Paint.jpg",
    27: "Aluminium_window_frame.jpg",
    28: "Upvc_window.jpg",
    29: "Float_glass.jpg",
    30: "Wooden_door.jpg",
    31: "Steel_door.jpg",
    32: "PVC_pipe.jpg",
    33: "PPR_pipes.jpg",
    34: "Polyethylene_water_tank.jpg",
    35: "Electrical_cable.jpg",
    36: "Electrical_cable.jpg",
    37: "Bitumen_waterproofing_membrane.jpg",
    38: "Expanded_polystyrene_foam.jpg",
    39: "XPS_foam.jpg",
    40: "Rock_wool_board.jpg",
    41: "Sandwich_panel_closeup.jpg",
    42: "Corrugated_galvanised_iron.jpg",
    43: "Asphalt_concrete.jpg",
    44: "Plywood.jpg",
    45: "Lumber.jpg",
    46: "MDF_board.jpg",
    47: "Wire_mesh.jpg",
    48: "Scaffolding_in_use.jpg",
    49: "Suspended_ceiling_tiles.jpg",
    50: "Epoxy_resin_floor.jpg",
    51: "Lumber_pile.jpg",
    52: "Laminate_flooring.jpg",
    53: "Particle_board_closeup.jpg",
    54: "Teak_wood_grain.jpg",
    55: "Oak_wood_closeup.jpg",
    56: "Polished_concrete_surface.jpg"
};

function downloadSpecialFilePath(filename, dest) {
    // Wikipedia's Special:FilePath endpoint returns the full original image, avoiding 404 thumbnails
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'CostMaterialApp/1.0 (costmaterial@example.com)' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // follow redirect which points to the actual upload.wikimedia.org CDN
                downloadRedirect(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                file.close(); fs.unlink(dest, () => { });
                return reject(`Status ${res.statusCode}`);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => { }); reject(err.message); });
    });
}

function downloadRedirect(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'CostMaterialApp/1.0' } }, (res) => {
            if (res.statusCode !== 200) {
                file.close(); fs.unlink(dest, () => { });
                return reject(`Status ${res.statusCode}`);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => { fs.unlink(dest, () => { }); reject(err.message); });
    });
}

// Wait function to avoid 429 limits
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Downloading images ONE by ONE with delays to avoid 429...");
    let result = [];
    let replaced = 0;

    // Process line by line, but only download when needed
    const lines = content.split('\n');
    let currentId = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const idMatch = line.match(/^\s*id:\s*(\d+),/);
        if (idMatch) currentId = parseInt(idMatch[1]);

        if (line.includes('image: ')) {
            if (currentId && EXACT_IMAGES[currentId]) {
                const imgPath = path.join(assetDir, `${currentId}.jpg`);
                try {
                    if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 1000) {
                        console.log(`Downloading ID ${currentId}: ${EXACT_IMAGES[currentId]}`);
                        await downloadSpecialFilePath(EXACT_IMAGES[currentId], imgPath);
                        await sleep(800); // 800ms delay per image to prevent rate limit!
                    }
                    result.push(`    image: require("../../assets/materials/${currentId}.jpg"),`);
                    replaced++;
                } catch (e) {
                    console.log(`Failed ID ${currentId}: ${e}`);
                    result.push(line);
                }
            } else {
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }

    fs.writeFileSync(file, result.join('\n'), 'utf8');
    console.log(`Finished! Rendered ${replaced} images as direct local assets.`);
}

run();
