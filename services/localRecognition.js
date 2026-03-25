/**
 * ML-POWERED Material Recognition Engine v4.0
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * Uses MobileNet neural network for REAL image understanding.
 * 100% FREE. No API key. Runs entirely in the browser.
 *
 * Architecture:
 * 1. Loads TensorFlow.js + MobileNet via CDN (no npm = no bundler issues)
 * 2. MobileNet classifies image â†’ semantic labels ("stone wall", "desk", etc.)
 * 3. Maps labels to our construction materials
 * 4. Local color analysis provides base scores
 * 5. MobileNet boosts/penalizes for maximum accuracy
 */

import materials from "../data/materials";

// â”€â”€â”€ CDN-based Model Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let tfLoaded = false;
let modelLoaded = false;
let mlModel = null;
let loadingPromise = null;

async function loadTFFromCDN() {
    if (tfLoaded) return true;

    return new Promise((resolve) => {
        // Check if already loaded
        if (window.tf && window.mobilenet) {
            tfLoaded = true;
            resolve(true);
            return;
        }

        // Load TF.js first
        const tfScript = document.createElement("script");
        tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
        tfScript.onload = () => {
            console.log("âœ… TensorFlow.js loaded from CDN");
            // Then load MobileNet
            const mnScript = document.createElement("script");
            mnScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";
            mnScript.onload = () => {
                console.log("âœ… MobileNet loaded from CDN");
                tfLoaded = true;
                resolve(true);
            };
            mnScript.onerror = () => {
                console.warn("âš  MobileNet CDN load failed");
                resolve(false);
            };
            document.head.appendChild(mnScript);
        };
        tfScript.onerror = () => {
            console.warn("âš  TF.js CDN load failed");
            resolve(false);
        };
        document.head.appendChild(tfScript);
    });
}

async function getModel() {
    if (mlModel) return mlModel;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        const loaded = await loadTFFromCDN();
        if (!loaded || !window.mobilenet) return null;

        try {
            mlModel = await window.mobilenet.load({ version: 2, alpha: 1.0 });
            modelLoaded = true;
            console.log("âœ… MobileNet model ready");
            return mlModel;
        } catch (err) {
            console.warn("âš  MobileNet model load failed:", err.message);
            return null;
        }
    })();

    return loadingPromise;
}

// â”€â”€â”€ ImageNet â†’ Material Mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LABEL_MAPS = [
    // â•â•â• STONE / ROCK / MARBLE / GRANITE â•â•â•
    {
        keywords: ["stone wall", "stone", "rock", "cliff", "promontory", "alp", "valley",
            "volcano", "geyser", "lakeside", "quarry", "castle", "monastery", "church",
            "mosque", "palace", "fortress", "dam", "breakwater", "pier", "seawall",
            "viaduct", "megalith", "cairn", "ruins", "altar", "fountain", "obelisk", "pedestal", "bathtub"],
        boost: { 13: 50, 21: 40, 22: 40, 23: 35, 16: 20 },
        penalize: { 44: -30, 45: -30, 51: -30, 32: -20 },
    },

    // â•â•â• WOOD / WOODEN â•â•â•
    {
        keywords: ["desk", "dining table", "table", "wardrobe", "closet",
            "bookcase", "bookshelf", "cabinet", "chest of drawers", "dresser",
            "bureau", "rocking chair", "wooden spoon", "crate", "barrel",
            "plywood", "lumber", "hardwood", "pallet", "log cabin",
            "entertainment center", "china cabinet", "medicine chest",
            "file cabinet"],
        boost: { 51: 50, 45: 45, 46: 40, 52: 40, 53: 40, 54: 45, 55: 45, 44: 35 },
        penalize: { 56: -30, 17: -30, 9: -20 },
    },
    {
        keywords: ["door"],
        boost: { 30: 55, 31: 30 },
        penalize: { 15: -20, 16: -20 },
    },

    // â•â•â• BRICK â•â•â•
    {
        keywords: ["brick", "wall", "prison", "jail", "chimney", "fireplace"],
        boost: { 11: 55, 12: 40, 9: 15, 10: 15 },
        penalize: { 29: -25, 32: -20 },
    },

    // â•â•â• METAL / STEEL â•â•â•
    {
        keywords: ["steel arch bridge", "bridge", "chain-link fence", "chain link",
            "safety pin", "nail", "screw", "wrench", "hammer", "iron", "anvil",
            "forklift", "crane", "manhole cover", "dutch oven", "wok",
            "frying pan", "cleaver", "barbell", "dumbbell", "shield", "radiator"],
        boost: { 6: 45, 7: 40, 8: 40, 42: 35, 47: 35, 31: 20 },
        penalize: { 51: -30, 29: -20 },
    },
    {
        keywords: ["window screen", "window shade", "venetian blind", "blind"],
        boost: { 27: 35, 28: 25 },
        penalize: { 1: -15 },
    },

    // â•â•â• SAND / GRAVEL â•â•â•
    {
        keywords: ["sandbar", "seashore", "coast", "beach", "sand", "dune",
            "desert", "oasis"],
        boost: { 15: 55, 16: 20 },
        penalize: { 29: -30, 30: -30 },
    },

    // â•â•â• TILE â•â•â•
    {
        keywords: ["tile roof", "roof tile", "tile", "mosaic", "patio"],
        boost: { 19: 50, 20: 45 },
        penalize: { 45: -25, 16: -25 },
    },

    // â•â•â• GLASS â•â•â•
    {
        keywords: ["window", "greenhouse", "pane", "glass", "mirror",
            "sunglasses", "goblet", "wine glass"],
        boost: { 29: 65, 27: 25, 28: 25 },
        penalize: { 17: -40, 18: -40, 56: -40, 9: -30, 10: -30, 1: -30, 16: -30 },
    },

    // â•â•â• CONCRETE / BLOCKS â•â•â•
    {
        keywords: ["parking meter", "pillar", "column", "pedestal",
            "parking garage", "sidewalk", "curb"],
        boost: { 56: 45, 17: 35, 18: 35, 9: 30, 10: 30 },
        penalize: { 51: -20 },
    },

    // â•â•â• PIPE â•â•â•
    {
        keywords: ["pipe", "tube", "cylinder", "hose", "syringe"],
        boost: { 32: 50, 33: 45 },
        penalize: { 9: -20, 11: -20 },
    },

    // â•â•â• CABLE / WIRE â•â•â•
    {
        keywords: ["cable", "wire", "plug", "power cord", "electrical",
            "switch", "socket"],
        boost: { 35: 50, 36: 50 },
        penalize: { 19: -20, 21: -20 },
    },

    // â•â•â• FOAM / INSULATION / RUBBER â•â•â•
    {
        keywords: ["bubble", "foam", "sponge", "styrofoam", "pillow",
            "quilt", "mattress", "rubber", "plastic bag", "trash bag", "tarp", "poncho", "shower curtain"],
        boost: { 38: 45, 39: 40, 37: 35 },
        penalize: { 6: -20 },
    },

    // â•â•â• POWDERS / CEMENT / PAINT â•â•â•
    {
        keywords: ["plaster", "stucco", "whiteboard", "envelope", "paper", "flour", "paintbrush", "paint", "paint can", "bucket", "pail"],
        boost: { 1: 30, 2: 35, 4: 35, 5: 35, 25: 35, 26: 35 },
        penalize: { 6: -20 },
    },
];



function adjustScore(scores, id, amount) {
    const idx = scores.findIndex((s) => s.id === id);
    if (idx >= 0) scores[idx].score += amount;
}

function applySpecialCases(features, scores, predictions) {
    const topLabels = predictions.map((pred) => pred.className.toLowerCase()).join(" ");
    const looksLikeGlass =
        features.achrR > 0.72 &&
        features.avgSat < 12 &&
        features.avgLight > 38 &&
        features.avgLight < 84 &&
        features.satStd < 14;
    const reflectiveNeutral =
        features.achrR > 0.68 &&
        features.avgSat < 10 &&
        features.lightStd > 10 &&
        features.avgLight > 42;

    if (looksLikeGlass || reflectiveNeutral || /window|glass|mirror|screen|shower curtain|bath towel/.test(topLabels)) {
        adjustScore(scores, 29, 70);
        adjustScore(scores, 27, 22);
        adjustScore(scores, 28, 18);
        adjustScore(scores, 1, -30);
        adjustScore(scores, 3, -25);
        adjustScore(scores, 17, -20);
        adjustScore(scores, 18, -20);
        adjustScore(scores, 56, -35);
    }

    const looksLikeSmoothMetalFrame =
        features.achrR > 0.55 &&
        features.avgSat < 16 &&
        features.smooth > 0.52 &&
        features.avgLight > 45 &&
        features.avgLight < 78 &&
        /window screen|window shade|steel arch bridge|chain link|radiator|screen/.test(topLabels);

    if (looksLikeSmoothMetalFrame) {
        adjustScore(scores, 27, 45);
        adjustScore(scores, 31, 18);
        adjustScore(scores, 29, 10);
    }

    const looksLikePipe =
        features.smooth > 0.55 &&
        features.avgSat < 25 &&
        /pipe|tube|hose|syringe/.test(topLabels);

    if (looksLikePipe) {
        adjustScore(scores, 32, 40);
        adjustScore(scores, 33, 35);
    }
}

// â”€â”€â”€ Local Color Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function localAnalysis(px, S) {
    const hues = [], sats = [], lights = [];
    for (let y = 4; y < S - 4; y += 2) {
        for (let x = 4; x < S - 4; x += 2) {
            const i = (y * S + x) * 4;
            const hsl = rgb2hsl(px[i], px[i + 1], px[i + 2]);
            hues.push(hsl.h); sats.push(hsl.s); lights.push(hsl.l);
        }
    }
    const n = hues.length;
    const avgSat = avg(sats), avgLight = avg(lights), avgHue = circMean(hues);

    let achro = 0, tRed = 0, brown = 0, yel = 0, bg = 0, colr = 0, vl = 0, vd = 0;
    for (let i = 0; i < n; i++) {
        const h = hues[i], s = sats[i], l = lights[i];
        if (s < 14) achro++;
        if (l > 78) vl++;
        if (l < 20) vd++;
        if (s > 40) colr++;
        if ((h < 18 || h > 345) && s > 20 && l > 15 && l < 60) tRed++;
        if (h >= 18 && h <= 52 && s > 12 && l > 12 && l < 70) brown++;
        if (h >= 45 && h <= 68 && s > 15) yel++;
        if (h >= 150 && h <= 230 && s > 8) bg++;
    }

    let varS = 0, varC = 0;
    for (let y = 6; y < S - 6; y += 6) {
        for (let x = 6; x < S - 6; x += 6) {
            const ci = (y * S + x) * 4;
            const cg = (px[ci] + px[ci + 1] + px[ci + 2]) / 3;
            let lv = 0, nb = 0;
            for (let dy = -6; dy <= 6; dy += 6) {
                for (let dx = -6; dx <= 6; dx += 6) {
                    if (!dx && !dy) continue;
                    const ni = ((y + dy) * S + (x + dx)) * 4;
                    lv += ((px[ni] + px[ni + 1] + px[ni + 2]) / 3 - cg) ** 2; nb++;
                }
            }
            varS += Math.sqrt(lv / nb); varC++;
        }
    }

    return {
        avgHue, avgSat, avgLight,
        achrR: achro / n, tRedR: tRed / n, brownR: brown / n,
        yelR: yel / n, bgR: bg / n, colrR: colr / n,
        vlR: vl / n, vdR: vd / n,
        rough: Math.min((varC ? varS / varC : 0) / 45, 1),
        smooth: 1 - Math.min((varC ? varS / varC : 0) / 45, 1),
        satStd: std(sats), lightStd: std(lights),
    };
}

// â”€â”€â”€ Local Score Profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PROFILES = [
    { id: 1, s: (f) => (f.achrR > .55 ? 20 : 0) + (f.avgSat < 18 ? 10 : 0) + (f.avgLight > 40 && f.avgLight < 68 ? 10 : 0) + (f.smooth > .5 ? 8 : 0) - (f.brownR > .25 ? 25 : 0) - (f.tRedR > .1 ? 25 : 0) },
    { id: 2, s: (f) => (f.avgLight < 45 ? 15 : 0) + (f.tRedR > .12 && f.avgLight < 50 ? 15 : 0) + (f.achrR > .3 && f.avgLight < 40 ? 10 : 0) - (f.avgLight > 60 ? 20 : 0) },
    { id: 3, s: (f) => (f.achrR > .5 ? 15 : 0) + (f.avgLight > 48 && f.avgLight < 78 ? 10 : 0) + (f.avgSat < 18 ? 8 : 0) - (f.brownR > .3 ? 20 : 0) - (f.tRedR > .1 ? 20 : 0) },
    { id: 4, s: (f) => (f.tRedR > .35 ? 30 : f.tRedR > .2 ? 15 : f.tRedR > .1 ? 5 : -20) + (f.rough > .2 && f.rough < .7 ? 5 : 0) - (f.brownR > .45 ? 10 : 0) },
    { id: 5, s: (f) => (f.avgHue > 28 && f.avgHue < 58 ? 12 : 0) + (f.yelR > .2 ? 15 : 0) + (f.avgLight > 48 ? 8 : 0) - (f.tRedR > .15 ? 12 : 0) },
    { id: 6, s: (f) => (f.rough > .45 ? 12 : 0) + (f.avgSat < 35 ? 5 : 0) - (f.smooth > .6 ? 15 : 0) },
    { id: 7, s: (f) => (f.achrR > .6 ? 15 : 0) + (f.avgLight > 35 && f.avgLight < 62 ? 10 : 0) + (f.smooth > .45 ? 8 : 0) - (f.brownR > .2 ? 18 : 0) },
    { id: 8, s: (f) => (f.vlR > .45 ? 15 : 0) + (f.achrR > .6 ? 10 : 0) + (f.avgLight > 72 ? 8 : 0) - (f.avgLight < 65 ? 25 : 0) - (f.brownR > .1 ? 18 : 0) },
    { id: 9, s: (f) => (f.vlR > .6 ? 20 : 0) + (f.avgLight > 85 ? 10 : 0) + (f.achrR > .7 ? 8 : 0) - (f.avgLight < 75 ? 30 : 0) },
    { id: 10, s: (f) => (f.smooth > .5 ? 12 : 0) + (f.avgSat > 8 && f.avgSat < 65 ? 5 : 0) - (f.rough > .6 ? 12 : 0) },
    { id: 11, s: (f) => (f.smooth > .5 ? 12 : 0) + (f.avgSat < 35 ? 8 : 0) + (f.avgLight > 50 ? 5 : 0) - (f.rough > .6 ? 12 : 0) },
    { id: 12, s: (f) => (f.smooth > .6 ? 12 : 0) + (f.achrR > .5 ? 8 : 0) - (f.brownR > .2 ? 18 : 0) - (f.tRedR > .1 ? 12 : 0) },
    { id: 13, s: (f) => (f.colrR > .3 ? 22 : 0) + (f.avgSat > 35 ? 10 : 0) - (f.achrR > .6 ? 22 : 0) },
    { id: 14, s: (f) => (f.vdR > .4 ? 25 : 0) + (f.avgLight < 25 ? 15 : 0) - (f.avgLight > 35 ? 28 : 0) },
    { id: 15, s: (f) => (f.vlR > .55 ? 15 : 0) + (f.avgLight > 85 ? 10 : 0) + (f.achrR > .65 ? 8 : 0) - (f.avgLight < 75 ? 28 : 0) },
    { id: 16, s: (f) => (f.achrR > .5 ? 8 : 0) + (f.smooth > .5 ? 8 : 0) + (f.avgLight > 50 && f.avgLight < 82 ? 8 : 0) - (f.brownR > .2 ? 18 : 0) },
    { id: 17, s: (f) => (f.bgR > .15 ? 15 : 0) + (f.smooth > .6 ? 8 : 0) - (f.brownR > .2 ? 22 : 0) - (f.tRedR > .1 ? 22 : 0) },
    { id: 18, s: (f) => (f.avgLight > 60 ? 8 : 0) + (f.smooth > .45 ? 8 : 0) - (f.avgLight < 55 ? 15 : 0) },
    { id: 19, s: (f) => (f.smooth > .7 ? 12 : 0) + (f.satStd < 8 ? 10 : 0) + (f.lightStd < 8 ? 10 : 0) - (f.rough > .5 ? 12 : 0) },
    { id: 20, s: (f) => (f.brownR > .35 ? 12 : f.brownR > .2 ? 8 : -8) + (f.avgHue > 18 && f.avgHue < 52 ? 5 : 0) - (f.tRedR > .25 ? 8 : 0) - (f.achrR > .6 ? 12 : 0) },
    { id: 21, s: (f) => (f.rough > .3 ? 8 : 0) + (f.avgLight > 25 && f.avgLight < 72 ? 5 : 0) - (f.smooth > .7 ? 12 : 0) },
];

// â”€â”€â”€ Main Recognition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function recognizeMaterial(base64Image) {
    try {
        // Create image element
        const imgEl = await loadImage(base64Image);

        // Canvas for local analysis
        const S = 200;
        const canvas = document.createElement("canvas");
        canvas.width = S; canvas.height = S;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgEl, 0, 0, S, S);
        const px = ctx.getImageData(0, 0, S, S).data;

        // Local analysis
        const features = localAnalysis(px, S);
        const scores = materials.map((material) => {
            const profile = PROFILES.find((p) => p.id === material.id);
            return {
                id: material.id,
                name: material.nameEN,
                score: Math.max(0, profile ? profile.s(features) : 0),
            };
        });

        // â•â•â• MobileNet Neural Network â•â•â•
        let mlPreds = [];
        let usedML = false;

        try {
            const model = await getModel();
            if (model) {
                // Create 224x224 canvas for MobileNet
                const mlC = document.createElement("canvas");
                mlC.width = 224; mlC.height = 224;
                mlC.getContext("2d").drawImage(imgEl, 0, 0, 224, 224);

                mlPreds = await model.classify(mlC, 5);
                console.log("ðŸ§  MobileNet â†’", mlPreds.map((p) =>
                    `${p.className} (${Math.round(p.probability * 100)}%)`
                ));

                applyMLBoosts(mlPreds, scores);
                usedML = true;
            }
        } catch (err) {
            console.warn("MobileNet failed:", err.message);
        }

        applySpecialCases(features, scores, mlPreds);

        // Sort results
        scores.forEach((s) => (s.score = Math.max(0, s.score)));
        scores.sort((a, b) => b.score - a.score);

        const best = scores[0];
        const second = scores[1] || { score: 0 };
        const gap = best.score - second.score;

        const confidence = Math.min(0.96,
            Math.max(0.20,
                (best.score / 65) * 0.4 + Math.min(gap / 18, 0.35) + (usedML ? 0.15 : 0.05)
            )
        );

        const material = materials.find((m) => m.id === best.id);

        // Description
        const descParts = [];
        if (usedML && mlPreds.length > 0) {
            descParts.push(
                `Neural AI detected: ${mlPreds[0].className} (${Math.round(mlPreds[0].probability * 100)}%)`
            );
        }
        if (material?.id === 29) {
            descParts.push("neutral translucent surface");
            descParts.push("glass-like reflective texture");
        } else {
            descParts.push(colorDesc(features));
            descParts.push(texDesc(features));
        }

        return {
            matched: true,
            material,
            confidence: Math.round(confidence * 100) / 100,
            description: descParts.join(". ") + ".",
            engine: usedML ? "mobilenet-ai" : "local",
            topMatches: scores.slice(0, 3).map((s) => ({
                name: s.name,
                score: Math.round(s.score),
            })),
        };
    } catch (error) {
        console.error("Recognition error:", error);
        return {
            matched: false,
            material: null,
            confidence: 0,
            description: "Analysis failed. Try a well-lit, clear photo.",
        };
    }
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function colorDesc(f) {
    if (f.achrR > 0.5 && f.avgLight > 75) return "light/white surface";
    if (f.achrR > 0.5 && f.avgLight < 30) return "dark surface";
    if (f.achrR > 0.5) return "gray/neutral";
    if (f.tRedR > 0.2) return "red/terracotta tones";
    if (f.brownR > 0.25) return "brown/warm tones";
    if (f.yelR > 0.15) return "sandy/yellow";
    if (f.colrR > 0.3) return "vivid colors";
    return "mixed coloring";
}

function texDesc(f) {
    if (f.smooth > 0.65) return "smooth texture";
    if (f.rough > 0.5) return "rough texture";
    return "moderate texture";
}

function loadImage(base64) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = `data:image/jpeg;base64,${base64}`;
    });
}

function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = ((mx + mn) / 2) * 100;
    if (mx === mn) return { h: 0, s: 0, l };
    const d = mx - mn;
    const s = (l > 50 ? d / (2 - mx - mn) : d / (mx + mn)) * 100;
    let h;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    return { h: h % 360, s, l };
}

function avg(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function std(a) { const m = avg(a); return Math.sqrt(avg(a.map((v) => (v - m) ** 2))); }
function circMean(angles) {
    let sn = 0, cs = 0;
    for (const a of angles) { const r = a * Math.PI / 180; sn += Math.sin(r); cs += Math.cos(r); }
    let res = Math.atan2(sn / angles.length, cs / angles.length) * 180 / Math.PI;
    return res < 0 ? res + 360 : res;
}




