const fs = require('fs');
const https = require('https');
const path = require('path');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

const assetDir = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/assets/materials';
if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
}

// Exactly hand-picked high quality URLs
const EXACT_IMAGES = {
    // ── BINDING ---------
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Portland_Cement_Bags.jpg/600px-Portland_Cement_Bags.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/White_cement.jpg/600px-White_cement.jpg",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Portland_Cement_Bags.jpg/600px-Portland_Cement_Bags.jpg",
    4: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Gypsum_plaster.jpg/600px-Gypsum_plaster.jpg",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Tileadhesive.jpg/600px-Tileadhesive.jpg",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Rebar_and_wires.jpg/600px-Rebar_and_wires.jpg",
    7: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/I-Beam.JPG/600px-I-Beam.JPG",
    8: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Metal_angle_steel.jpg/600px-Metal_angle_steel.jpg",
    9: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Concrete-blocks.jpg/600px-Concrete-blocks.jpg",
    10: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Concrete-blocks.jpg/600px-Concrete-blocks.jpg",
    11: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Brick_wall_close-up_view.jpg/600px-Brick_wall_close-up_view.jpg",
    12: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Firebrick.JPG/600px-Firebrick.JPG",
    13: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Limestone_quarry.jpg/600px-Limestone_quarry.jpg",
    14: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Ytong_blocks.jpg/600px-Ytong_blocks.jpg",
    15: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image-Silica.jpg/600px-Image-Silica.jpg",
    16: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Crushed_gravel.jpg/600px-Crushed_gravel.jpg",
    17: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Pouring_concrete.jpg/600px-Pouring_concrete.jpg",
    18: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Pouring_concrete.jpg/600px-Pouring_concrete.jpg",
    19: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Ceramic_tile_floor.jpg/600px-Ceramic_tile_floor.jpg",
    20: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Porcelain_tile.jpg/600px-Porcelain_tile.jpg",
    21: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Carrara_marble_floor.jpg/600px-Carrara_marble_floor.jpg",
    22: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Granite_Yosemite_P1080750.jpg/600px-Granite_Yosemite_P1080750.jpg",
    23: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Travertine_closeup.jpg/600px-Travertine_closeup.jpg",
    24: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Drywall-segments.jpg/600px-Drywall-segments.jpg",
    25: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Paint_can.jpg/600px-Paint_can.jpg",
    26: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Exterior_Paint.jpg/600px-Exterior_Paint.jpg",
    27: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Aluminium_window_frame.jpg/600px-Aluminium_window_frame.jpg",
    28: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Upvc_window.jpg/600px-Upvc_window.jpg",
    29: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Float_glass.jpg/600px-Float_glass.jpg",
    30: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wooden_door.jpg/600px-Wooden_door.jpg",
    31: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Steel_door.jpg/600px-Steel_door.jpg",
    32: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/PVC_pipe.jpg/600px-PVC_pipe.jpg",
    33: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/PPR_pipes.jpg/600px-PPR_pipes.jpg",
    34: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Polyethylene_water_tank.jpg/600px-Polyethylene_water_tank.jpg",
    35: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Electrical_cable.jpg/600px-Electrical_cable.jpg",
    36: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Electrical_cable.jpg/600px-Electrical_cable.jpg",
    37: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Bitumen_waterproofing_membrane.jpg/600px-Bitumen_waterproofing_membrane.jpg",
    38: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Expanded_polystyrene_foam.jpg/600px-Expanded_polystyrene_foam.jpg",
    39: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/XPS_foam.jpg/600px-XPS_foam.jpg",
    40: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Rock_wool_board.jpg/600px-Rock_wool_board.jpg",
    41: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sandwich_panel_closeup.jpg/600px-Sandwich_panel_closeup.jpg",
    42: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Corrugated_galvanised_iron.jpg/600px-Corrugated_galvanised_iron.jpg",
    43: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Asphalt_concrete.jpg/600px-Asphalt_concrete.jpg",
    44: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Plywood.jpg/600px-Plywood.jpg",
    45: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Lumber.jpg/600px-Lumber.jpg",
    46: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/MDF_board.jpg/600px-MDF_board.jpg",
    47: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Wire_mesh.jpg/600px-Wire_mesh.jpg",
    48: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Scaffolding_in_use.jpg/600px-Scaffolding_in_use.jpg",
    49: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Suspended_ceiling_tiles.jpg/600px-Suspended_ceiling_tiles.jpg",
    50: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Epoxy_resin_floor.jpg/600px-Epoxy_resin_floor.jpg",
    51: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Lumber_pile.jpg/600px-Lumber_pile.jpg",
    52: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Laminate_flooring.jpg/600px-Laminate_flooring.jpg",
    53: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Particle_board_closeup.jpg/600px-Particle_board_closeup.jpg",
    54: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Teak_wood_grain.jpg/600px-Teak_wood_grain.jpg",
    55: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Oak_wood_closeup.jpg/600px-Oak_wood_closeup.jpg",
    56: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Polished_concrete_surface.jpg/600px-Polished_concrete_surface.jpg"
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // follow redirect
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(dest, () => { });
                return reject(`Status ${res.statusCode}`);
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err.message);
        });
    });
}

async function run() {
    console.log("Downloading 56 images locally...");
    const lines = content.split('\n');
    let result = [];
    let replaced = 0;
    let currentId = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const idMatch = line.match(/^\s*id:\s*(\d+),/);
        if (idMatch) currentId = parseInt(idMatch[1]);

        if (line.includes('image: ')) {
            if (currentId && EXACT_IMAGES[currentId]) {
                const imgPath = path.join(assetDir, `${currentId}.jpg`);
                try {
                    if (!fs.existsSync(imgPath)) {
                        await download(EXACT_IMAGES[currentId], imgPath);
                    }
                    // Crucial: Use require() instead of string URL
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
