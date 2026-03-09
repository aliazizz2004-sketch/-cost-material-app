/**
 * AI Material Recognition Service v8.0 — CheckArch AI
 * ─────────────────────────────────────────────────────
 * Powered by Poliigon PBR Texture Library taxonomy (poliigon.com)
 *
 * Strategy:
 *  1. Gemini AI — enriched system prompt with Poliigon's 24-category taxonomy
 *     (Concrete × 7, Stone × 9, Wood × 9, Brick × 10, Metal × 16, Tile × 15, etc.)
 *  2. Fallback — Poliigon-informed color+texture DNA engine (no API needed)
 *
 * Output: primaryMatch, confidencePercent, keyVisualIndicators,
 *         commonAlternatives, detailedDescription, poliigonCategory
 */

import { Platform } from "react-native";
import materials from "../data/materials";

const GEMINI_API_KEY = "AIzaSyBgyFGItAFQga77pHUgfmsB843IkL8lnDc";

let geminiRateLimited = false;
let rateLimitResetTime = 0;

// ─── Poliigon Texture DNA ─────────────────────────────────────────────────────
// Each entry defines the visual fingerprint for a Poliigon category
// used in the fallback color engine when Gemini is unavailable.
const POLIIGON_DNA = [
    // ── CONCRETE (7 categories) ──
    {
        cat: "Concrete Aggregate", ids: [17, 18, 56], poliigonUrl: "concrete/aggregate",
        desc: "Exposed aggregate concrete — visible stones embedded in cement matrix. Rough, speckled surface.",
        // Visual: gray dominant, multi-tone speckles, rough texture, medium-high edges
        test: (p, t) => p.gray * 0.8 + (t.texT > 6 ? 0.25 : 0) + (t.edgePct > 0.25 ? 0.1 : 0) + (t.avgSat < 20 ? 0.1 : 0),
        min: 0.35,
    },
    {
        cat: "Board-Form Concrete", ids: [56, 17], poliigonUrl: "concrete/board-form",
        desc: "Board-form concrete — wooden plank impressions left in concrete surface. Strong directional grain in gray/beige tone.",
        test: (p, t) => p.gray * 0.6 + (t.texDir > 0.4 ? 0.25 : 0) + (t.texT > 5 ? 0.15 : 0) + (t.avgSat < 20 ? 0.1 : 0),
        min: 0.35,
    },
    {
        cat: "Old/Weathered Concrete", ids: [56, 9, 10], poliigonUrl: "concrete/old",
        desc: "Weathered concrete with cracks, stains, and erosion marks. Dark patches, uneven surface.",
        test: (p, t) => p.gray * 0.7 + (t.texT > 7 ? 0.2 : 0) + (p.dark > 0.1 ? 0.15 : 0) + (t.edgePct > 0.3 ? 0.1 : 0),
        min: 0.38,
    },
    {
        cat: "Polished Concrete", ids: [56, 17, 50], poliigonUrl: "concrete/polished",
        desc: "Polished concrete floor — smooth glossy gray surface. Reflective, minimal texture, fine aggregate just visible.",
        test: (p, t) => p.gray * 0.9 + (t.texT < 3 ? 0.25 : 0) + (t.avgBright > 130 ? 0.1 : 0) + (t.avgSat < 15 ? 0.1 : 0),
        min: 0.40,
    },
    {
        cat: "Concrete Block/Panel", ids: [9, 10, 14], poliigonUrl: "concrete/panel",
        desc: "Precast concrete block or panel — uniform rectangular gray unit with crisp edges.",
        test: (p, t) => p.gray * 0.85 + (t.edgePct > 0.2 ? 0.2 : 0) + (t.texT < 6 ? 0.1 : 0) + (t.avgSat < 18 ? 0.1 : 0),
        min: 0.38,
    },
    {
        cat: "Pigmented Concrete", ids: [56, 17, 50], poliigonUrl: "concrete/pigmented",
        desc: "Colored concrete — uniform hue (terracotta, charcoal, sandstone) with concrete texture.",
        test: (p, t) => (t.avgSat > 18 && t.avgSat < 55) ? p.gray * 0.5 + (t.texT > 3 ? 0.15 : 0) + 0.1 : 0,
        min: 0.30,
    },

    // ── STONE (9 categories) ──
    {
        cat: "Marble Stone", ids: [21], poliigonUrl: "stone/marble",
        desc: "Marble — white/cream/gray with characteristic flowing veins. Polished, high-gloss, crystalline.",
        test: (p, t) => (p.white * 0.5 + p.cream * 0.4) + (t.texT > 3 && t.texT < 8 ? 0.2 : 0) + (t.avgSat < 18 ? 0.1 : 0) + (t.avgBright > 160 ? 0.1 : 0),
        min: 0.32,
    },
    {
        cat: "Granite Stone", ids: [22], poliigonUrl: "stone/granite",
        desc: "Granite — speckled multi-color crystals (black, gray, white, pink). Coarse interlocking grain.",
        test: (p, t) => (t.edgePct > 0.28 ? 0.2 : 0) + p.dark * 0.3 + p.gray * 0.3 + (t.texT > 6 ? 0.15 : 0) + (t.avgSat < 22 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Travertine Stone", ids: [23], poliigonUrl: "stone/travertine",
        desc: "Travertine — warm cream/beige with pitted holes and banded parallel layers. Matte to polished.",
        test: (p, t) => p.cream * 0.85 + (t.texT > 4 && t.texT < 9 ? 0.15 : 0) + (p.white > 0.1 ? 0.1 : 0) + (t.avgSat > 8 && t.avgSat < 30 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Quartz Stone", ids: [22, 19, 20], poliigonUrl: "stone/quartz",
        desc: "Engineered quartz — very uniform, consistent pattern. Polished surface with slight sparkle.",
        test: (p, t) => (t.texT < 4 ? 0.2 : 0) + (t.avgBright > 150 ? 0.15 : 0) + p.white * 0.3 + (t.avgSat < 20 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Natural Wall Stone", ids: [13], poliigonUrl: "stone/walls",
        desc: "Natural stone wall — irregular limestone/sandstone blocks. Rough, varied color, mortar joints.",
        test: (p, t) => p.gray * 0.5 + p.cream * 0.3 + (t.texT > 7 ? 0.2 : 0) + (t.edgePct > 0.3 ? 0.15 : 0) + (p.brown > 0.05 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Terrazzo Stone", ids: [19, 20], poliigonUrl: "stone/terrazzo",
        desc: "Terrazzo — polished composite with colorful marble/glass chips in cement. Speckled, smooth.",
        test: (p, t) => (t.texT < 4 ? 0.15 : 0) + (t.avgSat > 20 ? 0.15 : 0) + (t.edgePct > 0.15 ? 0.1 : 0) + (t.avgBright > 140 ? 0.1 : 0),
        min: 0.28,
    },

    // ── BRICK (10 categories) ──
    {
        cat: "Red Brick", ids: [11], poliigonUrl: "brick/red",
        desc: "Red clay brick — vivid red/orange rectangular units with mortar joints. Fired clay.",
        test: (p, t) => p.red * 1.4 + p.orange * 0.7 + (t.edgePct > 0.2 ? 0.1 : 0),
        min: 0.18,
    },
    {
        cat: "Beige/Grey Brick", ids: [12, 9], poliigonUrl: "brick/beige",
        desc: "Beige or grey brick — pale yellow/cream/gray masonry units. Smooth or sand-faced finish.",
        test: (p, t) => p.cream * 0.9 + (p.yellow > 0.1 ? 0.2 : 0) + (p.gray > 0.2 ? 0.1 : 0) + (t.edgePct > 0.15 ? 0.1 : 0),
        min: 0.25,
    },
    {
        cat: "Reclaimed Brick", ids: [11], poliigonUrl: "brick/reclaimed",
        desc: "Reclaimed brick — aged, weathered clay bricks. Efflorescence, varied redness, mortar residue.",
        test: (p, t) => p.red * 1.0 + p.orange * 0.5 + (t.texT > 6 ? 0.2 : 0) + (p.dark > 0.05 ? 0.1 : 0),
        min: 0.20,
    },
    {
        cat: "Concrete Block Masonry", ids: [9, 10], poliigonUrl: "brick/concrete-block",
        desc: "CMU (concrete masonry unit) — gray hollow or solid block. Regular, uniform, industrial.",
        test: (p, t) => p.gray * 0.95 + (t.edgePct > 0.2 ? 0.15 : 0) + (t.texT < 7 ? 0.1 : 0) + (t.avgSat < 18 ? 0.1 : 0),
        min: 0.38,
    },

    // ── WOOD (9 categories) ──
    {
        cat: "Wood Flooring", ids: [52, 55], poliigonUrl: "wood/flooring",
        desc: "Wood flooring — polished planks with clear wood grain, tongue-and-groove. Warm tones.",
        test: (p, t) => p.brown * 0.9 + (t.texDir > 0.3 ? 0.2 : 0) + (t.texT > 3 && t.texT < 9 ? 0.15 : 0) + (t.avgSat > 25 ? 0.1 : 0),
        min: 0.35,
    },
    {
        cat: "Engineered Wood", ids: [46, 52, 53], poliigonUrl: "wood/engineered",
        desc: "Engineered wood (MDF/HDF/plywood) — uniform surface, no knots, consistent color.",
        test: (p, t) => p.brown * 0.7 + (t.texT < 5 ? 0.25 : 0) + (t.texDir < 0.2 ? 0.1 : 0) + (t.avgSat < 35 ? 0.1 : 0),
        min: 0.35,
    },
    {
        cat: "Old/Rough Wood", ids: [51, 45], poliigonUrl: "wood/old-wood",
        desc: "Raw or rough-hewn wood — visible knots, cracks, grain, and weathering. Lumber/timber.",
        test: (p, t) => p.brown * 1.0 + (t.texT > 7 ? 0.2 : 0) + (t.texDir > 0.35 ? 0.15 : 0) + (p.yellow > 0.05 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Wood Cladding", ids: [51, 45, 44], poliigonUrl: "wood/cladding",
        desc: "Wood cladding/siding — horizontal boards on exterior. Grain visible, painted or natural.",
        test: (p, t) => p.brown * 0.8 + (t.texDir > 0.4 ? 0.25 : 0) + (t.texT > 4 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Painted Wood", ids: [30, 46], poliigonUrl: "wood/painted",
        desc: "Painted wood surface — uniform color over wood grain, sometimes visible grain underneath.",
        test: (p, t) => (t.texT < 4 ? 0.2 : 0) + p.brown * 0.5 + (t.avgSat > 15 ? 0.1 : 0) + (t.texDir > 0.15 ? 0.1 : 0),
        min: 0.28,
    },
    {
        cat: "Wood Veneer", ids: [54, 55], poliigonUrl: "wood/veneer",
        desc: "Wood veneer — ultra-thin premium hardwood laminated on substrate. Very fine, consistent grain.",
        test: (p, t) => p.brown * 0.7 + (t.texDir > 0.3 ? 0.15 : 0) + (t.texT > 2 && t.texT < 6 ? 0.15 : 0) + (t.avgSat > 30 && t.avgSat < 60 ? 0.1 : 0),
        min: 0.32,
    },

    // ── METAL (16 categories) ──
    {
        cat: "Corrugated Metal", ids: [42], poliigonUrl: "metal/corrugated",
        desc: "Corrugated metal sheet — parallel ridges/channels. Galvanized silver or painted. Roofing.",
        test: (p, t) => p.metallic * 0.7 + (t.texDir > 0.45 ? 0.3 : 0) + p.gray * 0.3 + (t.avgBright > 130 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Galvanized/Brushed Metal", ids: [7, 8, 47, 48], poliigonUrl: "metal/galvanized",
        desc: "Galvanized or brushed steel — matte gray metallic with fine linear scratches or spangle pattern.",
        test: (p, t) => p.metallic * 0.8 + p.gray * 0.4 + (t.texT < 5 ? 0.1 : 0) + (t.avgBright > 100 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Rusty Metal", ids: [6, 7, 8, 42], poliigonUrl: "metal/rust",
        desc: "Rusty/oxidized steel — orange-brown patches, flaking scale, uneven weathered surface.",
        test: (p, t) => (p.red * 0.6 + p.orange * 0.7 + p.darkBrown * 0.4) + (t.texT > 6 ? 0.15 : 0),
        min: 0.25,
    },
    {
        cat: "Steel Structural", ids: [6, 7, 8], poliigonUrl: "metal/steel",
        desc: "Structural steel — dark gray mill-scale or painted members. Rebar, I-beam, angle bar.",
        test: (p, t) => p.dark * 0.7 + p.metallic * 0.5 + (t.texDir > 0.3 ? 0.15 : 0) + (t.avgBright < 90 ? 0.1 : 0),
        min: 0.28,
    },
    {
        cat: "Metal Panel", ids: [41, 42], poliigonUrl: "metal/panel",
        desc: "Metal cladding panel — flat or profiled sheet. Painted steel, aluminum composite. Clean surface.",
        test: (p, t) => p.metallic * 0.6 + (t.texT < 4 ? 0.2 : 0) + p.gray * 0.3 + (t.avgBright > 120 ? 0.1 : 0),
        min: 0.28,
    },
    {
        cat: "Perforated Metal", ids: [47], poliigonUrl: "metal/perforated",
        desc: "Perforated metal mesh — regular hole pattern in sheet metal. Grid/diamond pattern.",
        test: (p, t) => p.metallic * 0.5 + (t.edgePct > 0.38 ? 0.25 : 0) + p.gray * 0.3 + (t.texT > 8 ? 0.1 : 0),
        min: 0.28,
    },

    // ── TILE (15 categories) ──
    {
        cat: "Square Ceramic Tile", ids: [19], poliigonUrl: "tile/square",
        desc: "Square ceramic tile — smooth glazed surface, grout joints visible. Uniform color, standard 30×30.",
        test: (p, t) => (t.texT < 4 ? 0.2 : 0) + (t.edgePct > 0.12 && t.edgePct < 0.35 ? 0.15 : 0) + (t.avgSat > 15 ? 0.1 : 0) + (t.avgBright > 120 ? 0.1 : 0),
        min: 0.30,
    },
    {
        cat: "Porcelain/Marble Tile", ids: [20, 21], poliigonUrl: "tile/marble",
        desc: "Porcelain or marble-look tile — high gloss, thin veining imitation, very smooth.",
        test: (p, t) => (t.texT < 3 ? 0.3 : 0) + (t.avgBright > 155 ? 0.2 : 0) + (p.white * 0.3 + p.cream * 0.2) + (t.avgSat < 22 ? 0.1 : 0),
        min: 0.32,
    },
    {
        cat: "Terracotta Tile", ids: [11, 19], poliigonUrl: "tile/terracotta",
        desc: "Terracotta tile — unglazed fired clay. Warm orange/red-brown, matte, earthy.",
        test: (p, t) => p.orange * 1.0 + p.red * 0.5 + (t.texT > 3 ? 0.1 : 0) + (t.avgSat > 30 ? 0.1 : 0),
        min: 0.25,
    },
    {
        cat: "Mosaic Tile", ids: [19, 20], poliigonUrl: "tile/mosaic",
        desc: "Mosaic tile — small tessellated pieces of glass, ceramic, or stone. Many grout lines, colorful.",
        test: (p, t) => (t.edgePct > 0.30 ? 0.25 : 0) + (t.texT > 5 ? 0.15 : 0) + (t.avgSat > 25 ? 0.15 : 0),
        min: 0.28,
    },
    {
        cat: "Slate Tile", ids: [13, 19], poliigonUrl: "tile/slate",
        desc: "Slate tile — dark gray/charcoal natural split stone. Layered, matte, irregular surface.",
        test: (p, t) => p.dark * 0.6 + p.gray * 0.5 + (t.texT > 5 ? 0.15 : 0) + (t.avgSat < 20 ? 0.1 : 0),
        min: 0.28,
    },

    // ── ASPHALT ──
    {
        cat: "Asphalt", ids: [43], poliigonUrl: "asphalt",
        desc: "Asphalt road surface — near-black with visible aggregate particles. Rough, macadam texture.",
        test: (p, t) => p.dark * 0.7 + p.black * 0.5 + (t.texT > 5 ? 0.15 : 0) + (t.avgSat < 15 ? 0.1 : 0),
        min: 0.30,
    },

    // ── PLASTER / PAINT ──
    {
        cat: "Plaster / Stucco", ids: [4, 1], poliigonUrl: "plaster",
        desc: "Plaster or stucco wall — smooth or textured white/cream wall finish. Painted or raw.",
        test: (p, t) => p.white * 0.9 + p.cream * 0.4 + (t.texT < 3 ? 0.2 : 0) + (t.avgSat < 18 ? 0.1 : 0),
        min: 0.35,
    },
    {
        cat: "Paint (Flat/Emulsion)", ids: [25, 26], poliigonUrl: "paint",
        desc: "Interior/exterior paint — perfectly uniform flat color. Minimal texture, no grain.",
        test: (p, t) => (t.texT < 2 ? 0.3 : 0) + (t.edgePct < 0.1 ? 0.15 : 0) + (t.avgSat > 10 ? 0.1 : 0),
        min: 0.30,
    },

    // ── GLASS ──
    {
        cat: "Float / Architectural Glass", ids: [29], poliigonUrl: "glass",
        desc: "Float glass — transparent, translucent, or frosted. Highly reflective or see-through.",
        test: (p, t) => p.white * 0.4 + (p.blue > 0.05 ? 0.25 : 0) + (t.texT < 2 ? 0.3 : 0) + (t.avgBright > 160 ? 0.2 : 0) + (p.gray > 0.35 && t.avgBright > 120 && t.texT > 4 ? 0.5 : 0),
        min: 0.40,
    },

    // ── INSULATION ──
    {
        cat: "EPS / XPS Foam Insulation", ids: [38, 39], poliigonUrl: "insulation",
        desc: "Foam insulation board — white (EPS) or blue/pink (XPS). Smooth or beaded surface.",
        test: (p, t) => p.white * 1.0 + (t.texT > 2 && t.texT < 8 ? 0.15 : 0) + (t.avgSat < 15 ? 0.1 : 0) + (p.blue * 0.8 + p.pink * 0.7),
        min: 0.30,
    },
    {
        cat: "Waterproof Membrane", ids: [37], poliigonUrl: "membrane",
        desc: "Bituminous or EPDM membrane — jet black or dark gray, slightly textured or smooth roll.",
        test: (p, t) => p.black * 1.1 + p.dark * 0.5 + (t.texT < 5 ? 0.1 : 0) + (t.avgSat < 12 ? 0.1 : 0),
        min: 0.30,
    },

    // ── ROOFING ──
    {
        cat: "Metal Roofing Panel", ids: [41, 42], poliigonUrl: "roofing/metal",
        desc: "Metal roofing — corrugated or standing-seam profiled steel sheet. Parallel ridges.",
        test: (p, t) => p.metallic * 0.6 + (t.texDir > 0.4 ? 0.25 : 0) + p.gray * 0.3 + (t.avgBright > 120 ? 0.1 : 0),
        min: 0.28,
    },

    // ── SAND / AGGREGATE ──
    {
        cat: "Fine Sand", ids: [15], poliigonUrl: "earth",
        desc: "Fine sand — granular yellow/tan material. Individual grains visible, uniform texture.",
        test: (p, t) => p.yellow * 1.3 + p.cream * 0.5 + (t.texT > 5 ? 0.1 : 0) + (p.brown > 0.05 ? 0.05 : 0),
        min: 0.22,
    },
    {
        cat: "Gravel / Aggregate", ids: [16], poliigonUrl: "aggregate",
        desc: "Coarse aggregate/gravel — mixed gray and brown crushed stones, very irregular, rough.",
        test: (p, t) => (t.texT > 10 ? 0.3 : 0) + p.gray * 0.4 + (t.edgePct > 0.32 ? 0.15 : 0) + (t.avgSat < 25 ? 0.1 : 0),
        min: 0.28,
    },

    // ── PIPE / PLASTIC ──
    {
        cat: "PVC / PPR Pipe", ids: [32, 33], poliigonUrl: "plastic",
        desc: "Plastic pipe — white/gray PVC or green PPR cylindrical tube. Smooth, round cross-section.",
        test: (p, t) => (p.white > 0.35 || p.gray > 0.35 || p.green > 0.1 ? 0.25 : 0) + (t.texT < 3 ? 0.2 : 0) + (t.avgSat < 20 ? 0.1 : 0) + p.green * 1.1,
        min: 0.25,
    },

    // ── GYPSUM BOARD / DRYWALL ──
    {
        cat: "Gypsum Board / Drywall", ids: [24], poliigonUrl: "ceiling",
        desc: "Gypsum plasterboard — flat white/cream paper-faced rectangular board, matte surface.",
        test: (p, t) => p.white * 0.6 + p.cream * 0.4 + (t.texT < 2.5 ? 0.25 : 0) + (t.avgSat < 12 ? 0.1 : 0),
        min: 0.35,
    },

    // ── EPOXY FLOOR ──
    {
        cat: "Epoxy Floor Coating", ids: [50], poliigonUrl: "flooring",
        desc: "Epoxy floor — mirror-smooth, high-gloss colored coating. Very uniform, no texture.",
        test: (p, t) => (t.texT < 1.5 ? 0.35 : 0) + (t.avgBright > 125 ? 0.15 : 0) + (t.avgSat > 20 ? 0.1 : 0),
        min: 0.30,
    },
];

// ─── Main Recognition Function ─────────────────────────────────────────────────

export async function recognizeMaterial(base64Image) {
    const now = Date.now();

    if (geminiRateLimited && now < rateLimitResetTime) {
        console.log("[AI] Gemini rate-limited → Poliigon color engine");
        return analyzeByPoliigonDNA(base64Image);
    }
    if (geminiRateLimited && now >= rateLimitResetTime) {
        geminiRateLimited = false;
    }

    try {
        console.log("[AI] Calling Gemini (Poliigon-enhanced mode)…");
        const result = await callGemini(base64Image);
        if (result.matched || result.description) return result;
    } catch (err) {
        console.warn("[AI] Gemini error:", err.message);
        if (err.message.includes("429")) {
            geminiRateLimited = true;
            rateLimitResetTime = now + 60000;
            console.warn("[AI] Rate-limited — skipping Gemini for 60 s");
        }
    }

    return analyzeByPoliigonDNA(base64Image);
}

// ─── Gemini ─────────────────────────────────

async function callGemini(base64Image) {
    const matList = materials.map((m) => `${m.id}. ${m.nameEN} (${m.categoryEN})`).join("\n");

    // Poliigon-based material taxonomy injected as reference knowledge
    const poliigonRef = `
POLIIGON PBR TEXTURE TAXONOMY — use these sub-type distinctions:

CONCRETE (7 types): Aggregate (rough speckled), Board-Form (linear plank impressions), Old/Weathered (cracks, stains), Polished (smooth glossy), Panel/Block (crisp CMU edges), Pigmented (uniform color), Rammed-Earth (layered compressed soil).

STONE (9 types): Marble (flowing veins, polished), Granite (crystal speckles, coarse), Travertine (cream/beige, pitted holes, banded), Quartz (engineered, very uniform), Limestone/Wall Stone (irregular rough blocks), Terrazzo (chips in matrix), Countertop stone, Sidewalk stone, Stone tiles.

BRICK (10 types): Red brick (vivid red/orange), Beige brick (pale yellow), Grey brick (cool gray), Black brick, Grooved brick (textured face), Painted brick (coat over clay), Reclaimed (aged, mortar residue), Slim brick (thin coursing), White brick, Concrete block CMU.

WOOD (9 types): Flooring (polished planks, grain), Engineered (MDF/HDF, uniform, no knots), Old/Rough-hewn (knots, cracks, raw lumber), Cladding/siding (horizontal boards, exterior), Painted wood (uniform color), Veneer (ultra-thin premium), Decking, Wicker, Plywood.

METAL (16 types): Corrugated (parallel ridges, roofing), Galvanized (zinc spangle), Brushed (linear scratches), Rusty (orange-brown oxidation, flaking), Structural steel (dark mill-scale), Metal panel (flat/painted), Perforated (hole pattern), Cast iron, Bronze/copper (warm tone), Hammered.

TILE (15 types): Square ceramic (grout lines, glazed), Porcelain/marble-look (high gloss), Terracotta (warm orange, unglazed), Mosaic (tiny pieces, many grout joints), Slate tile (dark, layered), Herringbone, Hexagonal, Laminate, Penny-round, Zellige.

GLASS: Float glass (transparent/reflective), Frosted, Tinted, Textured, Wired glass.
ASPHALT: Hot-mix (dark, aggregate visible), Polished/smooth asphalt.
PLASTER/STUCCO: Smooth wall plaster, Roughcast, Cavity-fill.
ROOFING: Metal corrugated, Standing-seam, Slate shingles, Bitumen membrane.
INSULATION: EPS foam (white beads), XPS (blue/pink dense), Rock wool (fibrous yellow-brown).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are the core architectural material recognition engine for CheckArch AI, cross-referencing Poliigon's professional PBR texture library taxonomy.

${poliigonRef}

CRITICAL RULES:
1. Use the Poliigon sub-type distinctions above to make specific identifications, not broad guesses.
2. Distinguish carefully: glass vs. polished concrete, marble vs. ceramic tile, raw wood vs. engineered wood, red brick vs. terracotta tile, galvanized metal vs. painted metal.
3. Look at: surface texture pattern, reflectivity/gloss level, color tone, grain/vein/crystal structure, edge sharpness, mortar joints, weathering signs.
4. If you see flowing veins → marble not ceramic. If you see crystal speckles → granite not terrazzo. If you see pitted holes in cream stone → travertine. If you see parallel ridges → corrugated metal not brushed. If you see beaded white surface → EPS foam not gypsum.
5. Always output the Poliigon category that best describes what you see.

Available materials database (use exact ID):
${matList}

RESPOND with this exact JSON only (no markdown):
{
  "primaryMatch": "exact name from database",
  "materialId": <integer id or 0>,
  "confidencePercent": <0-100>,
  "poliigonCategory": "e.g. Travertine Stone / travertine",
  "poliigonUrl": "https://www.poliigon.com/textures/<category>",
  "keyVisualIndicators": [
    "specific detail 1 (e.g., cream beige tone with horizontal banding and small pits)",
    "specific detail 2",
    "specific detail 3"
  ],
  "commonAlternatives": [
    { "name": "material name", "reason": "why it could be confused" },
    { "name": "material name", "reason": "why it could be confused" }
  ],
  "detailedDescription": "Professional 1-2 sentence description referencing Poliigon texture characteristics."
}

If NOT a construction material:
{ "primaryMatch": "none", "materialId": 0, "confidencePercent": 0, "poliigonCategory": "none", "poliigonUrl": "", "keyVisualIndicators": [], "commonAlternatives": [], "detailedDescription": "Description of actual content." }`
                        },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }],
                generationConfig: { temperature: 0.03, maxOutputTokens: 700 },
            }),
        });

        clearTimeout(timer);

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!text) throw new Error("Empty response");

        const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jm = clean.match(/\{[\s\S]*\}/);
        if (!jm) throw new Error("No JSON in response");

        const parsed = JSON.parse(jm[0]);

        if (parsed.primaryMatch && parsed.primaryMatch !== "none") {
            let mat = null;
            if (parsed.materialId) mat = materials.find((m) => m.id === parsed.materialId);
            if (!mat) {
                const n = parsed.primaryMatch.toLowerCase();
                mat = materials.find((m) =>
                    m.nameEN.toLowerCase() === n ||
                    m.nameEN.toLowerCase().includes(n) ||
                    n.includes(m.nameEN.toLowerCase())
                );
            }
            if (!mat) {
                const words = parsed.primaryMatch.toLowerCase().split(/[\s()]+/).filter((w) => w.length > 3);
                let best = 0, bm = null;
                for (const m of materials) {
                    let s = 0;
                    for (const w of words) if (m.nameEN.toLowerCase().includes(w)) s += 2;
                    if (s > best) { best = s; bm = m; }
                }
                if (best >= 2) mat = bm;
            }

            const conf = parsed.confidencePercent || 85;
            const topMatches = mat ? [{ name: mat.nameEN, score: conf }] : [];

            if (Array.isArray(parsed.commonAlternatives)) {
                for (const a of parsed.commonAlternatives.slice(0, 2)) {
                    if (!a.name) continue;
                    const altScore = Math.max(10, conf - 25);
                    const am = materials.find((m) =>
                        m.nameEN.toLowerCase().includes(a.name.toLowerCase()) ||
                        a.name.toLowerCase().includes(m.nameEN.toLowerCase())
                    );
                    topMatches.push({ name: am ? am.nameEN : a.name, score: altScore });
                }
            }

            if (mat) {
                console.log("[AI] ✅ Poliigon-Gemini Match:", mat.nameEN, `(${conf}%) → ${parsed.poliigonCategory || ""}`);
                return {
                    matched: true,
                    material: mat,
                    confidence: Math.min(conf / 100, 1.0),
                    description: parsed.detailedDescription || "",
                    keyVisualIndicators: Array.isArray(parsed.keyVisualIndicators) ? parsed.keyVisualIndicators : [],
                    commonAlternatives: Array.isArray(parsed.commonAlternatives) ? parsed.commonAlternatives : [],
                    poliigonCategory: parsed.poliigonCategory || "",
                    poliigonUrl: parsed.poliigonUrl || "",
                    engine: "gemini-poliigon",
                    topMatches,
                };
            }
        }

        return {
            matched: false, material: null, confidence: 0,
            description: parsed.detailedDescription || "Could not identify the material.",
            keyVisualIndicators: [], commonAlternatives: [],
            poliigonCategory: "", poliigonUrl: "",
            engine: "gemini-poliigon",
        };
    } finally {
        clearTimeout(timer);
    }
}

// ─── Poliigon DNA Color+Texture Fallback Engine ───────────────────────────────

function analyzeByPoliigonDNA(base64Image) {
    if (Platform.OS !== "web") {
        return {
            matched: false,
            material: null,
            confidence: 0,
            description: "AI recognition is busy or unavailable. Please check your internet connection.",
            engine: "native-fallback"
        };
    }
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const S = 120;
                canvas.width = S;
                canvas.height = S;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, S, S);
                const px = ctx.getImageData(0, 0, S, S).data;
                const N = S * S;

                // ── Phase 1: Color buckets ──
                let brown = 0, gray = 0, red = 0, white = 0, yellow = 0, dark = 0;
                let metallic = 0, blue = 0, green = 0, orange = 0, cream = 0;
                let pink = 0, black = 0, lightBrown = 0, darkBrown = 0;
                let totalR = 0, totalG = 0, totalB = 0, totalSat = 0, totalBright = 0;

                for (let i = 0; i < px.length; i += 4) {
                    const r = px[i], g = px[i + 1], b = px[i + 2];
                    totalR += r; totalG += g; totalB += b;
                    const avg = (r + g + b) / 3;
                    const sat = Math.max(r, g, b) - Math.min(r, g, b);
                    totalSat += sat;
                    totalBright += avg;

                    if (r > 120 && g > 60 && g < r && b < g * 0.9 && sat > 25) brown++;
                    if (r > 160 && g > 100 && g < r * 0.85 && b < 80) darkBrown++;
                    if (r > 180 && g > 130 && b < 100 && sat > 20 && avg > 140) lightBrown++;
                    if (sat < 25 && avg > 70 && avg < 210) gray++;
                    if (r > 150 && r > g * 1.4 && r > b * 1.5 && sat > 40) red++;
                    if (avg > 210 && sat < 35) white++;
                    if (r > 170 && g > 140 && b < 100 && sat > 40) yellow++;
                    if (avg < 50) dark++;
                    if (avg < 30) black++;
                    if (sat < 20 && avg > 100 && avg < 185) metallic++;
                    if (b > 120 && b > r * 1.3 && b > g) blue++;
                    if (g > 100 && g > r * 1.2 && g > b * 1.2) green++;
                    if (r > 180 && g > 80 && g < 150 && b < 80) orange++;
                    if (r > 200 && g > 180 && b > 150 && sat < 50 && avg > 180) cream++;
                    if (r > 180 && g < 150 && b > 130 && r > b) pink++;
                }

                // ── Phase 2: Texture metrics ──
                let textureH = 0, textureV = 0, edgeCount = 0;
                for (let y = 1; y < S - 1; y++) {
                    for (let x = 1; x < S - 1; x++) {
                        const idx = (y * S + x) * 4;
                        const cc = (px[idx] + px[idx + 1] + px[idx + 2]) / 3;
                        const rr = (px[idx + 4] + px[idx + 5] + px[idx + 6]) / 3;
                        const dd = (px[idx + S * 4] + px[idx + S * 4 + 1] + px[idx + S * 4 + 2]) / 3;
                        const dH = Math.abs(cc - rr);
                        const dV = Math.abs(cc - dd);
                        textureH += dH;
                        textureV += dV;
                        if (dH > 20 || dV > 20) edgeCount++;
                    }
                }

                const texH = textureH / (N * 2);
                const texV = textureV / (N * 2);
                const texT = (texH + texV) / 2;
                const texDir = Math.abs(texH - texV) / (texT + 0.01);
                const edgePct = edgeCount / N;

                // ── Phase 3: Normalized color percentages ──
                const p = {
                    brown: brown / N, gray: gray / N, red: red / N, white: white / N,
                    yellow: yellow / N, dark: dark / N, metallic: metallic / N,
                    blue: blue / N, green: green / N, orange: orange / N, cream: cream / N,
                    pink: pink / N, black: black / N,
                    lightBrown: lightBrown / N, darkBrown: darkBrown / N,
                };
                const avgSat = totalSat / N;
                const avgBright = totalBright / N;
                const t = { texT, texDir, edgePct, avgSat, avgBright };

                console.log("[AI] Poliigon DNA colors:", JSON.stringify(p));
                console.log("[AI] Texture:", `t=${texT.toFixed(1)} dir=${texDir.toFixed(2)} edge=${edgePct.toFixed(2)} sat=${avgSat.toFixed(0)} brt=${avgBright.toFixed(0)}`);

                // ── Phase 4: Score all Poliigon DNA profiles ──
                const scored = POLIIGON_DNA.map((dna) => ({
                    dna,
                    score: dna.test(p, t),
                })).filter((s) => s.score >= s.dna.min).sort((a, b) => b.score - a.score);

                if (scored.length > 0) {
                    const best = scored[0];
                    const matId = best.dna.ids[0];
                    const mat = materials.find((m) => m.id === matId);

                    const topMatches = [];
                    for (const sc of scored.slice(0, 4)) {
                        const m = materials.find((mm) => sc.dna.ids.includes(mm.id));
                        if (m) topMatches.push({ name: m.nameEN, score: Math.round(Math.min(sc.score, 1) * 100) });
                    }

                    const conf = Math.min(best.score * 0.85, 0.80);
                    console.log("[AI] ✅ Poliigon DNA Match:", mat?.nameEN, `— ${best.dna.cat} (${(conf * 100).toFixed(0)}%)`);

                    resolve({
                        matched: true,
                        material: mat,
                        confidence: conf,
                        description: best.dna.desc,
                        keyVisualIndicators: [],
                        commonAlternatives: scored.slice(1, 3).map((sc) => ({
                            name: sc.dna.cat,
                            reason: `Similar visual profile (score: ${sc.score.toFixed(2)})`,
                        })),
                        poliigonCategory: best.dna.cat,
                        poliigonUrl: `https://www.poliigon.com/textures/${best.dna.poliigonUrl}`,
                        engine: "poliigon-dna",
                        topMatches,
                    });
                } else {
                    resolve({
                        matched: false, material: null, confidence: 0,
                        description: "Could not identify the material. Try a clearer, well-lit photo showing the surface texture.",
                        keyVisualIndicators: [], commonAlternatives: [],
                        poliigonCategory: "", poliigonUrl: "",
                        engine: "poliigon-dna",
                    });
                }
            } catch (e) {
                console.error("[AI] Poliigon DNA error:", e);
                resolve({ matched: false, material: null, confidence: 0, description: "Error: " + e.message, keyVisualIndicators: [], commonAlternatives: [], poliigonCategory: "", poliigonUrl: "", engine: "error" });
            }
        };

        img.onerror = () => {
            resolve({ matched: false, material: null, confidence: 0, description: "Could not load image.", keyVisualIndicators: [], commonAlternatives: [], poliigonCategory: "", poliigonUrl: "", engine: "error" });
        };

        img.src = `data:image/jpeg;base64,${base64Image}`;
    });
}
