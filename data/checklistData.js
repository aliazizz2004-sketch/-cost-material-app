/**
 * Interactive Material Checklists
 * Auto-suggests supplementary materials based on selected materials
 * Phase-based construction checklists for Kurdistan/Iraq
 */

// When a user selects certain materials, suggest complementary ones
// Keys are material IDs, values are arrays of { id, reasonEN, reasonKU }
export const MATERIAL_SUGGESTIONS = {
  // If user selects Cement, suggest sand, gravel, rebar, water tank
  1: [ // OPC Cement
    { id: 15, reasonEN: "Sand is needed for mortar/concrete mix", reasonKU: "خوڵ پێویستە بۆ تێکەڵەی ملاط/کۆنکریت" },
    { id: 16, reasonEN: "Gravel needed for concrete", reasonKU: "بەرد پێویستە بۆ کۆنکریت" },
    { id: 6, reasonEN: "Steel rebar for reinforced concrete", reasonKU: "میلە ئاسن بۆ کۆنکریتی ئاسنداخراو" },
  ],
  3: [ // SRC Cement
    { id: 15, reasonEN: "Sand is needed for mortar mix", reasonKU: "خوڵ پێویستە بۆ تێکەڵەی ملاط" },
    { id: 16, reasonEN: "Gravel needed for concrete", reasonKU: "بەرد پێویستە بۆ کۆنکریت" },
    { id: 37, reasonEN: "Waterproofing membrane for foundations", reasonKU: "مەمبرەینی بەرگری لە ئاو بۆ بنەڕەت" },
  ],
  6: [ // Rebar
    { id: 1, reasonEN: "Cement for concrete mix", reasonKU: "سمێنت (چیمەنتۆ) بۆ تێکەڵەی کۆنکریت" },
    { id: 15, reasonEN: "Sand for concrete mix", reasonKU: "خوڵ بۆ تێکەڵەی کۆنکریت" },
    { id: 16, reasonEN: "Gravel for concrete mix", reasonKU: "بەرد بۆ تێکەڵەی کۆنکریت" },
  ],
  9: [ // Concrete Block 20cm
    { id: 1, reasonEN: "Cement for mortar joints", reasonKU: "سمێنت (چیمەنتۆ) بۆ بەستنی بلۆکەکان" },
    { id: 15, reasonEN: "Sand for mortar", reasonKU: "خوڵ بۆ ملاط" },
    { id: 4, reasonEN: "Gypsum plaster for wall finishing", reasonKU: "جەبس بۆ ڕازی دیوار" },
  ],
  10: [ // Concrete Block 15cm
    { id: 1, reasonEN: "Cement for mortar joints", reasonKU: "سمێنت (چیمەنتۆ) بۆ بەستنی بلۆکەکان" },
    { id: 15, reasonEN: "Sand for mortar", reasonKU: "خوڵ بۆ ملاط" },
    { id: 4, reasonEN: "Gypsum plaster for wall finishing", reasonKU: "جەبس بۆ ڕازی دیوار" },
  ],
  11: [ // Red Clay Brick
    { id: 1, reasonEN: "Cement for brick mortar", reasonKU: "سمێنت (چیمەنتۆ) بۆ ملاطی خشت" },
    { id: 15, reasonEN: "Sand for mortar", reasonKU: "خوڵ بۆ ملاط" },
  ],
  19: [ // Ceramic Tiles
    { id: 5, reasonEN: "Tile adhesive for installation", reasonKU: "چەسپی کاشی بۆ دانان" },
    { id: 2, reasonEN: "White cement for grouting", reasonKU: "سمێنتی (چیمەنتۆ) سپی بۆ داگرتن" },
  ],
  20: [ // Porcelain Tiles
    { id: 5, reasonEN: "Tile adhesive for installation", reasonKU: "چەسپی کاشی بۆ دانان" },
    { id: 2, reasonEN: "White cement for grouting", reasonKU: "سمێنتی (چیمەنتۆ) سپی بۆ داگرتن" },
  ],
  21: [ // Marble
    { id: 5, reasonEN: "Tile adhesive or cement mortar", reasonKU: "چەسپی کاشی یان ملاطی سمێنت (چیمەنتۆ)" },
  ],
  24: [ // Gypsum Board
    { id: 25, reasonEN: "Paint for finishing", reasonKU: "بۆیە بۆ ڕازاندنەوە" },
  ],
  25: [ // Interior Paint
    { id: 4, reasonEN: "Gypsum plaster for wall prep", reasonKU: "جەبس بۆ ئامادەکردنی دیوار" },
  ],
  27: [ // Aluminum Window
    { id: 29, reasonEN: "Glass for window panes", reasonKU: "شووشە بۆ پەنجەرەکان" },
  ],
  28: [ // UPVC Window
    { id: 29, reasonEN: "Glass for window panes", reasonKU: "شووشە بۆ پەنجەرەکان" },
  ],
  37: [ // Waterproofing
    { id: 38, reasonEN: "EPS insulation on top of membrane", reasonKU: "ئینسولاسیۆنی EPS لەسەر مەمبرەین" },
  ],
  38: [ // EPS Insulation
    { id: 37, reasonEN: "Waterproofing membrane below insulation", reasonKU: "مەمبرەینی بەرگری لە ئاو لەژێر ئینسولاسیۆن" },
  ],
  32: [ // PVC Pipe
    { id: 33, reasonEN: "PPR pipe for hot water", reasonKU: "بۆری PPR بۆ ئاوی گەرم" },
  ],
  33: [ // PPR Pipe
    { id: 34, reasonEN: "Water tank for storage", reasonKU: "تانکی ئاو بۆ ھەڵگرتن" },
  ],
  35: [ // Electrical Cable 2.5mm
    { id: 36, reasonEN: "4mm² cable for heavy loads (AC)", reasonKU: "کێبڵی ٤مم² بۆ بار ئاگرەکان" },
  ],
};

// Phase-based checklists
export const CONSTRUCTION_PHASES = [
  {
    id: "foundation",
    nameEN: "Foundation & Structure",
    nameKU: "بنەڕەت و ئینشایی",
    icon: "🏗️",
    materialIds: [3, 1, 6, 15, 16, 17, 18, 37],
    descEN: "Foundation, columns, beams, and slabs",
    descKU: "بنەڕەت، ستوون، تیر، و سلاب",
  },
  {
    id: "walls",
    nameEN: "Walls & Masonry",
    nameKU: "دیوار و بیناسازی",
    icon: "🧱",
    materialIds: [9, 10, 11, 14, 1, 15, 4],
    descEN: "External walls, internal partitions",
    descKU: "دیواری دەرەوە، جیاکەرەوەی ناوەوە",
  },
  {
    id: "roofing",
    nameEN: "Roofing & Insulation",
    nameKU: "سەربان و ئینسولاسیۆن",
    icon: "🏠",
    materialIds: [37, 38, 39, 40, 41, 42],
    descEN: "Waterproofing, insulation, and roofing",
    descKU: "بەرگری لە ئاو، ئینسولاسیۆن، و سەربان",
  },
  {
    id: "mep",
    nameEN: "Plumbing & Electrical",
    nameKU: "ئاو و کارەبا",
    icon: "🔌",
    materialIds: [32, 33, 34, 35, 36],
    descEN: "Water, drainage, and electrical systems",
    descKU: "ئاو، لاڕێژ، و سیستەمی کارەبا",
  },
  {
    id: "finishing",
    nameEN: "Finishing & Fit-out",
    nameKU: "پەرداخت و ڕازاندنەوە",
    icon: "🎨",
    materialIds: [19, 20, 21, 22, 23, 24, 25, 26, 5],
    descEN: "Tiles, marble, paint, and gypsum board",
    descKU: "کاشی، مەڕمەڕ، بۆیە، و تەختەی جەبس",
  },
  {
    id: "openings",
    nameEN: "Doors & Windows",
    nameKU: "دەرگا و پەنجەرە",
    icon: "🪟",
    materialIds: [27, 28, 29, 30, 31],
    descEN: "Window frames, glass, internal and security doors",
    descKU: "چوارچێوەی پەنجەرە، شووشە، دەرگای ناوەوە و ئاسایشی",
  },
];

/**
 * Get suggestions for currently selected materials
 * @param {Object} quantities - { materialId: qty }
 * @param {Array} allMaterials - all materials array
 * @returns {Array} suggestions that are NOT already selected
 */
export function getSuggestions(quantities, allMaterials) {
  const selectedIds = Object.keys(quantities)
    .filter(id => quantities[id] > 0)
    .map(id => parseInt(id));

  if (selectedIds.length === 0) return [];

  const suggestedSet = new Map(); // id -> { material, reasons }

  selectedIds.forEach(selectedId => {
    const suggestions = MATERIAL_SUGGESTIONS[selectedId] || [];
    suggestions.forEach(s => {
      // Don't suggest if already selected
      if (selectedIds.includes(s.id)) return;

      if (!suggestedSet.has(s.id)) {
        const material = allMaterials.find(m => m.id === s.id);
        if (material) {
          suggestedSet.set(s.id, {
            material,
            reasons: [{ reasonEN: s.reasonEN, reasonKU: s.reasonKU, fromId: selectedId }],
          });
        }
      } else {
        suggestedSet.get(s.id).reasons.push({
          reasonEN: s.reasonEN,
          reasonKU: s.reasonKU,
          fromId: selectedId,
        });
      }
    });
  });

  return Array.from(suggestedSet.values());
}

export default {
  MATERIAL_SUGGESTIONS,
  CONSTRUCTION_PHASES,
  getSuggestions,
};
