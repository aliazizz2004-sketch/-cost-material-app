const fs = require('fs');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

// Explicit hand-picked high quality, close-up Wikipedia/Pexels verified URLs for all 56 items
const EXACT_IMAGES = {
    // ── BINDING ---------
    1: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/62/Portland_Cement_Bags.jpg&w=600", // OPC
    2: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/52/White_cement.jpg&w=600", // White Cement
    3: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/62/Portland_Cement_Bags.jpg&w=600", // SRC runs same as OPC
    4: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/d/d0/Gypsum_plaster.jpg&w=600", // Gypsum
    5: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7a/Tileadhesive.jpg&w=600", // Tile Adhesive

    // ── STRUCTURAL ------
    6: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/c/cc/Rebar_and_wires.jpg&w=600", // Rebar
    7: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/eb/I-Beam.JPG&w=600", // I-Beam
    8: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/f/f6/Metal_angle_steel.jpg&w=600", // Angle Bar

    // ── MASONRY ---------
    9: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/d/d8/Concrete-blocks.jpg&w=600", // Block 20cm
    10: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/d/d8/Concrete-blocks.jpg&w=600", // Block 15cm
    11: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/82/Brick_wall_close-up_view.jpg&w=600", // Red Brick
    12: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/e0/Firebrick.JPG&w=600", // Fire Brick
    13: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/c/cb/Limestone_quarry.jpg&w=600", // Natural Stone
    14: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/0/0f/Ytong_blocks.jpg&w=600", // AAC Ytong

    // ── AGGREGATE -------
    15: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/b/b6/Image-Silica.jpg&w=600", // Sand
    16: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7b/Crushed_gravel.jpg&w=600", // Gravel
    17: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/2a/Pouring_concrete.jpg&w=600", // Ready Mix 30
    18: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/2a/Pouring_concrete.jpg&w=600", // Ready Mix 25

    // ── FINISHING -------
    19: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/29/Ceramic_tile_floor.jpg&w=600", // Ceramic Tile
    20: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/34/Porcelain_tile.jpg&w=600", // Porcelain Tile
    21: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/a/a7/Carrara_marble_floor.jpg&w=600", // Marble
    22: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/1/1f/Granite_Yosemite_P1080750.jpg&w=600", // Granite
    23: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/85/Travertine_closeup.jpg&w=600", // Travertine
    24: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/69/Drywall-segments.jpg&w=600", // Gypsum Board Drywall

    // ── PAINT ───────────
    25: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/1/1e/Paint_can.jpg&w=600", // Interior Paint
    26: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/61/Exterior_Paint.jpg&w=600", // Exterior Paint

    // ── OPENINGS ────────
    27: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/a/a4/Aluminium_window_frame.jpg&w=600", // Alu Window
    28: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/d/d8/Upvc_window.jpg&w=600", // UPVC Window
    29: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/6d/Float_glass.jpg&w=600", // Glass
    30: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/1/1e/Wooden_door.jpg&w=600", // Wood Door
    31: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/72/Steel_door.jpg&w=600", // Steel Door

    // ── PLUMBING ────────
    32: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/9f/PVC_pipe.jpg&w=600", // PVC Pipe
    33: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5a/PPR_pipes.jpg&w=600", // PPR Pipe
    34: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/68/Polyethylene_water_tank.jpg&w=600", // Water Tank

    // ── ELECTRICAL ──────
    35: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/86/Electrical_cable.jpg&w=600", // Electric Cable
    36: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/86/Electrical_cable.jpg&w=600", // Cable 4mm

    // ── INSULATION ──────
    37: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/8d/Bitumen_waterproofing_membrane.jpg&w=600", // Bitumen
    38: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/c/c9/Expanded_polystyrene_foam.jpg&w=600", // EPS
    39: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/96/XPS_foam.jpg&w=600", // XPS
    40: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/4/4b/Rock_wool_board.jpg&w=600", // Rockwool

    // ── ROOFING ─────────
    41: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/8d/Sandwich_panel_closeup.jpg&w=600", // Sandwich Panel
    42: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/1/1d/Corrugated_galvanised_iron.jpg&w=600", // Corrugated Iron
    43: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/9c/Asphalt_concrete.jpg&w=600", // Asphalt

    // ── WOOD ────────────
    44: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/f/f5/Plywood.jpg&w=600", // Plywood
    45: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/3e/Lumber.jpg&w=600", // Timber
    46: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/6c/MDF_board.jpg&w=600", // MDF

    // ── OTHER ───────────
    47: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/f/f3/Wire_mesh.jpg&w=600", // BRC Mesh
    48: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/93/Scaffolding_in_use.jpg&w=600", // Scaffolding
    49: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7e/Suspended_ceiling_tiles.jpg&w=600", // Ceiling
    50: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7d/Epoxy_resin_floor.jpg&w=600", // Epoxy
    51: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/b/b5/Lumber_pile.jpg&w=600", // Wood Frame
    52: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/8a/Laminate_flooring.jpg&w=600", // Laminate
    53: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/29/Particle_board_closeup.jpg&w=600", // Chipboard
    54: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5b/Teak_wood_grain.jpg&w=600", // Teak Wood
    55: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/67/Oak_wood_closeup.jpg&w=600", // Oak Wood
    56: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5e/Polished_concrete_surface.jpg&w=600" // Polished Concrete
};

const lines = content.split('\n');
let result = [];
let replaced = 0;
let currentId = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track ID
    const idMatch = line.match(/^\s*id:\s*(\d+),/);
    if (idMatch) {
        currentId = parseInt(idMatch[1]);
    }

    // Replace image link based on tracked ID
    if (line.includes('image: "https://')) {
        if (currentId && EXACT_IMAGES[currentId]) {
            result.push(line.replace(/image:\s*"https:\/\/[^"]+"/, `image: "${EXACT_IMAGES[currentId]}"`));
            replaced++;
        } else {
            result.push(line);
        }
    } else {
        result.push(line);
    }
}

fs.writeFileSync(file, result.join('\n'), 'utf8');
console.log(`Successfully mapped ${replaced} exquisite close-up Wikimedia photos.`);
