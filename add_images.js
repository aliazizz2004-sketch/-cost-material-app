const fs = require('fs');

const materialsFilePath = 'c:\\Users\\Lenovo\\Desktop\\cost material\\cost-material-app\\data\\materials.js';

let content = fs.readFileSync(materialsFilePath, 'utf8');

// I'll manually append the ID 56 Concrete Surface material first
const newMaterial = `
  {
    id: 56,
    nameEN: "Concrete Slab / Surface",
    nameKU: "ڕووی کۆنکریت / سلاب",
    categoryEN: "Masonry",
    categoryKU: "بیناسازی",
    basePrice: 0.0,
    unit: "m²",
    unitEN: "per m²",
    unitKU: "بۆ هەر م² یەک",
    weight: 2400,
    thermalConductivity: 1.5,
    descEN: "Hardened concrete surface, wall, or floor slab. Recognizable by solid uniform gray color with minor trowel marks or pores.",
    descKU: "ڕووی کۆنکریتی ڕەقبوو، دیوار یان زەوی. ڕەنگی خۆڵەمێشی یەکدەست.",
    localBrands: ["Various"],
    origin: "local",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Beton_wand.jpg/640px-Beton_wand.jpg"
  },`;

if (!content.includes('id: 56')) {
  content = content.replace(/(?=\s*\];\s*export default materials;)/, newMaterial);
  fs.writeFileSync(materialsFilePath, content);
}

// A dictionary mapping all materials to high-quality Wikipedia/Wikimedia Commons images or Unsplash reliable URLs
const imageMap = {
  1: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Portland_cement_clinker.jpg/640px-Portland_cement_clinker.jpg",
  2: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/White_Portland_cement.jpg/640px-White_Portland_cement.jpg",
  3: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mortar_mixing.jpg/640px-Mortar_mixing.jpg",
  4: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Gypsum_plaster.jpg/640px-Gypsum_plaster.jpg",
  5: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Putz_Zementbasis.jpg/640px-Putz_Zementbasis.jpg",
  6: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Rebar_for_house.jpg/640px-Rebar_for_house.jpg",
  7: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/I-beam_cross_section.jpg/640px-I-beam_cross_section.jpg",
  8: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Hot_rolled_mild_steel_angle.jpg/640px-Hot_rolled_mild_steel_angle.jpg",
  9: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Concrete_block_wall.jpg/640px-Concrete_block_wall.jpg",
  10: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Concrete_Blocks.jpg/640px-Concrete_Blocks.jpg",
  11: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Bricks_in_the_wall.jpg/640px-Bricks_in_the_wall.jpg",
  12: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Fire_brick.jpg/640px-Fire_brick.jpg",
  13: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Limestone_wall.jpg/640px-Limestone_wall.jpg",
  14: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Autoclaved_aerated_concrete.jpg/640px-Autoclaved_aerated_concrete.jpg",
  15: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Sand_from_Gobi_Desert.jpg/640px-Sand_from_Gobi_Desert.jpg",
  16: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Gravel_pile.jpg/640px-Gravel_pile.jpg",
  17: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Concrete_pump_working_01.jpg/640px-Concrete_pump_working_01.jpg",
  18: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Breeze_block.jpg/640px-Breeze_block.jpg",
  19: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Ceramic_tiles_pattern.jpg/640px-Ceramic_tiles_pattern.jpg",
  20: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Porcelain_tile_%28Floor%29.jpg/640px-Porcelain_tile.jpg",
  21: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Carrara_Marble_Quarry.jpg/640px-Carrara_Marble_Quarry.jpg",
  22: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Granite_Yosemite.jpg/640px-Granite.jpg",
  23: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Travertine_Pamukkale.jpg/640px-Travertine_Pamukkale.jpg",
  24: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Drywall_installation.jpg/640px-Drywall_installation.jpg",
  25: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Paint_bucket.jpg/640px-Paint_bucket.jpg",
  26: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/House_painting.jpg/640px-House_painting.jpg",
  27: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Aluminium_window_frame.jpg/640px-Aluminium_window_frame.jpg",
  28: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/UPVC_window.jpg/640px-UPVC_window.jpg",
  29: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Float_glass_manufacture.jpg/640px-Float_glass_manufacture.jpg",
  30: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Wooden_door.jpg/640px-Wooden_door.jpg",
  31: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Security_door.jpg/640px-Security_door.jpg",
  32: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/PVC_Pipes.jpg/640px-PVC_Pipes.jpg",
  33: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/PPR_piping.jpg/640px-PPR_piping.jpg",
  34: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Polyethylene_water_tank.jpg/640px-Polyethylene_water_tank.jpg",
  35: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Electrical_wires.jpg/640px-Electrical_wires.jpg",
  36: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Distribution_board.jpg/640px-Distribution_board.jpg",
  37: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bituminous_waterproofing.jpg/640px-Bituminous_waterproofing.jpg",
  38: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Expanded_polystyrene_foam.jpg/640px-Expanded_polystyrene_foam.jpg",
  39: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Extruded_polystyrene_foam.jpg/640px-Extruded_polystyrene_foam.jpg",
  40: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Rockwool_insulation.jpg/640px-Rockwool_insulation.jpg",
  41: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Sandwich_panel.jpg/640px-Sandwich_panel.jpg",
  42: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Corrugated_iron_roof.jpg/640px-Corrugated_iron_roof.jpg",
  43: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Asphalt_road.jpg/640px-Asphalt_road.jpg",
  44: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Plywood_.jpg/640px-Plywood_.jpg",
  45: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Wood_beams.jpg/640px-Wood_beams.jpg",
  46: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/MDF_board.jpg/640px-MDF_board.jpg",
  47: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Welded_wire_mesh.jpg/640px-Welded_wire_mesh.jpg",
  48: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Scaffolding.jpg/640px-Scaffolding.jpg",
  49: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Suspended_ceiling.jpg/640px-Suspended_ceiling.jpg",
  50: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Epoxy_floor.jpg/640px-Epoxy_floor.jpg",
  51: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lumber_boards.jpg/640px-Lumber_boards.jpg",
  52: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Laminate_flooring.jpg/640px-Laminate_flooring.jpg",
  53: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Particle_board.jpg/640px-Particle_board.jpg",
  54: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Teak_wood.jpg/640px-Teak_wood.jpg",
  55: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Oak_hardwood.jpg/640px-Oak_hardwood.jpg",
  56: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Beton_wand.jpg/640px-Beton_wand.jpg",
};

content = fs.readFileSync(materialsFilePath, 'utf8');

// Use a regex replace to insert image property for each material
for (let id = 1; id <= 56; id++) {
  if (!imageMap[id]) continue;
  const url = imageMap[id];

  // Skip if already has image
  if (content.match(new RegExp(`id:\\s*${id},\\s*[\\s\\S]*?image:\\s*".*?"`, 'm'))) {
    continue;
  }

  const regex = new RegExp(`(id:\\s*${id},[\\s\\S]*?origin:\\s*".*?")(,|\\n)`, 'm');
  if (!content.match(regex)) {
    console.log(`Failed to match regex for id ${id}`);
  }
  content = content.replace(regex, `$1,\n    image: "${url}"$2`);
}

fs.writeFileSync(materialsFilePath, content);
console.log("Images added completely.");
