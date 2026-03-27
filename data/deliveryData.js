/**
 * Comprehensive Delivery Cost Database for Kurdistan Region & Iraq
 * 
 * Data sources:
 * - LTL rates: $40-60/ton (<200km), $60-90/ton (200-400km), $90-120/ton (400+km)
 * - FTL rates: $350-500 per truck (Baghdad-Erbil, ~22 ton capacity)
 * - Distances verified via Rome2Rio, Google Maps, and regional mapping sources
 * - Base rate per ton/km: ~1,500-2,500 IQD depending on route category
 * - Specialized/heavy materials: +20-25% surcharge
 * 
 * All distances are approximate driving distances in KM.
 * Rates are in USD per ton and will be converted to IQD using live exchange rate.
 */

// ═══════════════════════════════════════════════════════════════
// CITIES DATABASE
// ═══════════════════════════════════════════════════════════════

export const CITIES = [
  // Kurdistan Region
  { id: "erbil",        nameEN: "Erbil (Hewlêr)",           nameKU: "ھەولێر",           region: "kurdistan", isCapital: true },
  { id: "sulaymaniyah", nameEN: "Sulaymaniyah (Silêmanî)",  nameKU: "سلێمانی",          region: "kurdistan" },
  { id: "duhok",        nameEN: "Duhok (Dihok)",            nameKU: "دھۆک",             region: "kurdistan" },
  { id: "halabja",      nameEN: "Halabja",                  nameKU: "ھەڵەبجە",          region: "kurdistan" },
  { id: "zakho",        nameEN: "Zakho",                    nameKU: "زاخۆ",             region: "kurdistan" },
  { id: "kalar",        nameEN: "Kalar",                    nameKU: "کەلار",             region: "kurdistan" },
  { id: "ranya",        nameEN: "Ranya",                    nameKU: "رانیە",             region: "kurdistan" },
  { id: "shaqlawa",     nameEN: "Shaqlawa",                 nameKU: "شەقڵاوە",          region: "kurdistan" },
  { id: "soran",        nameEN: "Soran",                    nameKU: "سۆران",            region: "kurdistan" },
  { id: "koysinjaq",    nameEN: "Koya (Koysinjaq)",         nameKU: "کۆیە",             region: "kurdistan" },
  { id: "chamchamal",   nameEN: "Chamchamal",               nameKU: "چەمچەماڵ",         region: "kurdistan" },
  { id: "pirmam",       nameEN: "Pirmam",                   nameKU: "پیرمام",            region: "kurdistan" },
  { id: "akre",         nameEN: "Akre (Aqra)",              nameKU: "ئاکرێ",            region: "kurdistan" },
  { id: "mergasor",     nameEN: "Mergasor",                 nameKU: "مێرگەسۆر",         region: "kurdistan" },
  { id: "darbandikhan", nameEN: "Darbandikhan",             nameKU: "دەربەندیخان",       region: "kurdistan" },
  { id: "bazian",       nameEN: "Bazian",                   nameKU: "بازیان",            region: "kurdistan" },
  { id: "said_sadiq",   nameEN: "Said Sadiq",               nameKU: "سەید سادق",         region: "kurdistan" },
  { id: "amedi",        nameEN: "Amedi",                    nameKU: "ئامێدی",           region: "kurdistan" },

  // Federal Iraq
  { id: "baghdad",      nameEN: "Baghdad",                  nameKU: "بەغداد",            region: "iraq", isCapital: true },
  { id: "kirkuk",       nameEN: "Kirkuk",                   nameKU: "کەرکوک",           region: "iraq" },
  { id: "mosul",        nameEN: "Mosul (Nineveh)",          nameKU: "موسڵ",             region: "iraq" },
  { id: "basra",        nameEN: "Basra",                    nameKU: "بەسرە",             region: "iraq" },
  { id: "najaf",        nameEN: "Najaf",                    nameKU: "نەجەف",             region: "iraq" },
  { id: "karbala",      nameEN: "Karbala",                  nameKU: "کەربەلا",           region: "iraq" },
  { id: "tikrit",       nameEN: "Tikrit",                   nameKU: "تکریت",             region: "iraq" },
  { id: "samarra",      nameEN: "Samarra",                  nameKU: "سامەرا",            region: "iraq" },
  { id: "fallujah",     nameEN: "Fallujah",                 nameKU: "فەلوجە",            region: "iraq" },
  { id: "ramadi",       nameEN: "Ramadi",                   nameKU: "رامادی",            region: "iraq" },
  { id: "hilla",        nameEN: "Hilla",                    nameKU: "حیللە",              region: "iraq" },
  { id: "diwaniyah",    nameEN: "Diwaniyah",                nameKU: "دیوانیە",           region: "iraq" },
  { id: "nasiriyah",    nameEN: "Nasiriyah",                nameKU: "ناسریە",            region: "iraq" },
  { id: "amarah",       nameEN: "Amarah",                   nameKU: "عەمارە",            region: "iraq" },
  { id: "kut",          nameEN: "Kut",                      nameKU: "کوت",               region: "iraq" },
];

// ═══════════════════════════════════════════════════════════════
// DISTANCE MATRIX (in km) - driving distances
// Key format: "cityA_cityB" (alphabetically sorted)
// ═══════════════════════════════════════════════════════════════

export const DISTANCES = {
  // Erbil connections
  "duhok_erbil": 150,
  "erbil_kirkuk": 95,
  "erbil_sulaymaniyah": 195,
  "erbil_halabja": 257,
  "erbil_zakho": 205,
  "erbil_kalar": 250,
  "erbil_ranya": 135,
  "erbil_shaqlawa": 55,
  "erbil_soran": 115,
  "erbil_koysinjaq": 70,
  "erbil_chamchamal": 145,
  "erbil_pirmam": 35,
  "erbil_akre": 105,
  "erbil_mergasor": 145,
  "erbil_bazian": 170,
  "erbil_darbandikhan": 210,
  "erbil_said_sadiq": 240,
  "erbil_amedi": 170,
  "baghdad_erbil": 350,
  "erbil_mosul": 90,
  "basra_erbil": 900,
  "erbil_najaf": 590,
  "erbil_karbala": 530,
  "erbil_tikrit": 210,
  "erbil_samarra": 260,
  "erbil_fallujah": 390,
  "erbil_ramadi": 420,
  "erbil_hilla": 470,

  // Sulaymaniyah connections
  "duhok_sulaymaniyah": 325,
  "kirkuk_sulaymaniyah": 111,
  "halabja_sulaymaniyah": 76,
  "sulaymaniyah_zakho": 370,
  "kalar_sulaymaniyah": 139,
  "ranya_sulaymaniyah": 105,
  "shaqlawa_sulaymaniyah": 175,
  "soran_sulaymaniyah": 180,
  "koysinjaq_sulaymaniyah": 140,
  "chamchamal_sulaymaniyah": 40,
  "bazian_sulaymaniyah": 30,
  "darbandikhan_sulaymaniyah": 65,
  "said_sadiq_sulaymaniyah": 48,
  "baghdad_sulaymaniyah": 310,
  "mosul_sulaymaniyah": 330,
  "basra_sulaymaniyah": 820,
  "sulaymaniyah_tikrit": 230,

  // Duhok connections
  "duhok_kirkuk": 248,
  "duhok_halabja": 370,
  "duhok_zakho": 58,
  "duhok_kalar": 380,
  "duhok_akre": 70,
  "duhok_amedi": 65,
  "duhok_mergasor": 100,
  "baghdad_duhok": 475,
  "duhok_mosul": 70,

  // Kirkuk connections
  "halabja_kirkuk": 190,
  "kirkuk_zakho": 273,
  "kalar_kirkuk": 246,
  "kirkuk_tikrit": 140,
  "baghdad_kirkuk": 260,
  "kirkuk_mosul": 170,

  // Other Kurdistan
  "halabja_zakho": 460,
  "darbandikhan_kalar": 95,
  "halabja_kalar": 160,
  "ranya_soran": 55,
  "akre_mergasor": 60,
  "bazian_chamchamal": 25,

  // Baghdad connections
  "baghdad_mosul": 400,
  "baghdad_basra": 545,
  "baghdad_najaf": 165,
  "baghdad_karbala": 110,
  "baghdad_tikrit": 170,
  "baghdad_samarra": 125,
  "baghdad_fallujah": 65,
  "baghdad_ramadi": 110,
  "baghdad_hilla": 100,
  "baghdad_diwaniyah": 195,
  "baghdad_nasiriyah": 375,
  "baghdad_amarah": 370,
  "baghdad_kut": 190,
  "baghdad_kalar": 230,
};

// ═══════════════════════════════════════════════════════════════
// RATE CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Base delivery rates (USD per ton) by distance category
 * Based on market research for Iraq/Kurdistan truck transport
 */
const RATE_TIERS = [
  { maxKm: 50,   baseRatePerTon: 25 },   // Very short (<50km)
  { maxKm: 100,  baseRatePerTon: 35 },   // Short (50-100km)
  { maxKm: 200,  baseRatePerTon: 50 },   // Medium-short (100-200km)
  { maxKm: 400,  baseRatePerTon: 75 },   // Medium (200-400km)
  { maxKm: 600,  baseRatePerTon: 100 },  // Long (400-600km)
  { maxKm: 99999, baseRatePerTon: 120 }, // Very long (600+km)
];

/**
 * Material weight categories affect delivery cost
 */
const MATERIAL_WEIGHT_MULTIPLIERS = {
  light: 0.8,      // Insulation, EPS, gypsum board, etc.
  standard: 1.0,   // Cement, blocks, bricks, etc.
  heavy: 1.15,     // Steel, rebar, I-beams, etc.
  liquid: 1.1,     // Paint, adhesives, ready-mix, etc.
  fragile: 1.25,   // Glass, tiles, marble, granite
};

/**
 * Get distance between two cities
 */
export function getDistance(cityA, cityB) {
  if (cityA === cityB) return 0;
  
  const sorted = [cityA, cityB].sort();
  const key = sorted.join("_");
  
  if (DISTANCES[key] !== undefined) {
    return DISTANCES[key];
  }
  
  // Try to estimate via a hub city (Erbil or Baghdad)
  const hubs = ["erbil", "baghdad", "sulaymaniyah"];
  let bestEstimate = null;
  
  for (const hub of hubs) {
    const distAHub = getDirectDistance(cityA, hub);
    const distHubB = getDirectDistance(hub, cityB);
    
    if (distAHub !== null && distHubB !== null) {
      const estimate = distAHub + distHubB;
      if (bestEstimate === null || estimate < bestEstimate) {
        bestEstimate = estimate;
      }
    }
  }
  
  return bestEstimate || null;
}

function getDirectDistance(cityA, cityB) {
  if (cityA === cityB) return 0;
  const sorted = [cityA, cityB].sort();
  const key = sorted.join("_");
  return DISTANCES[key] !== undefined ? DISTANCES[key] : null;
}

/**
 * Calculate delivery cost
 * @param {number} distanceKm - Distance in km
 * @param {number} tons - Weight in tons (default 1)
 * @param {string} weightCategory - Material weight category
 * @param {number} exchangeRate - USD to IQD rate
 * @returns {{ costUSD, costIQD, ratePerTon, distanceKm, tier }}
 */
export function calculateDeliveryCost(distanceKm, tons = 1, weightCategory = "standard", exchangeRate = 1310) {
  if (!distanceKm || distanceKm <= 0) {
    return { costUSD: 0, costIQD: 0, ratePerTon: 0, distanceKm: 0, tier: null };
  }

  // Find the right tier
  const tier = RATE_TIERS.find(t => distanceKm <= t.maxKm) || RATE_TIERS[RATE_TIERS.length - 1];
  
  // Get weight multiplier
  const weightMult = MATERIAL_WEIGHT_MULTIPLIERS[weightCategory] || 1.0;
  
  // Calculate rate per ton
  const ratePerTon = tier.baseRatePerTon * weightMult;
  
  // Total cost in USD
  const costUSD = ratePerTon * tons;
  
  // Convert to IQD
  const costIQD = Math.round(costUSD * exchangeRate);

  return {
    costUSD: Math.round(costUSD * 100) / 100,
    costIQD,
    ratePerTon: Math.round(ratePerTon * 100) / 100,
    distanceKm,
    tier: getTierLabel(distanceKm),
    weightCategory,
    weightMultiplier: weightMult,
  };
}

function getTierLabel(km) {
  if (km <= 50) return { en: "Very Short Route", ku: "ڕێگای زۆر نزیک" };
  if (km <= 100) return { en: "Short Route", ku: "ڕێگای نزیک" };
  if (km <= 200) return { en: "Medium-Short Route", ku: "ڕێگای مامناوەند" };
  if (km <= 400) return { en: "Medium Route", ku: "ڕێگای ناوەندی" };
  if (km <= 600) return { en: "Long Route", ku: "ڕێگای دوور" };
  return { en: "Very Long Route", ku: "ڕێگای زۆر دوور" };
}

/**
 * Get material weight category based on material category
 */
export function getMaterialWeightCategory(materialCategoryEN) {
  const cat = (materialCategoryEN || "").toLowerCase();
  if (cat.includes("steel") || cat.includes("structural") || cat.includes("iron")) return "heavy";
  if (cat.includes("insulation") || cat.includes("roofing")) return "light";
  if (cat.includes("concrete") && cat.includes("ready")) return "liquid";
  if (cat.includes("paint") || cat.includes("finishing") || cat.includes("adhesive")) return "liquid";
  if (cat.includes("glass") || cat.includes("tile") || cat.includes("marble") || cat.includes("granite") || cat.includes("opening")) return "fragile";
  return "standard";
}

export default {
  CITIES,
  DISTANCES,
  getDistance,
  calculateDeliveryCost,
  getMaterialWeightCategory,
};
