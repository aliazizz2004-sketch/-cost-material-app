import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import materials from "../data/materials";
import { recognizeMaterial as recognizeMaterialLocally } from "./localRecognition";

const DEFAULT_GEMINI_API_KEY = "AIzaSyBp4scDjnWr8dLPMHnY0PBxMEU-D2n8qsY";
const API_KEY_STORAGE = "gemini_api_key_custom";
const GEMINI_MODELS = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];
let geminiBlockedUntil = 0;

export async function getApiKey() {
  try {
    let key = await AsyncStorage.getItem(API_KEY_STORAGE);
    if (key) {
      key = key.trim();
      // If the user accidentally pasted it twice (e.g. 78 chars instead of 39), slice it.
      if (key.startsWith("AIza") && key.length > 50) {
        key = key.substring(0, 39);
      }
    }
    return key || DEFAULT_GEMINI_API_KEY;
  } catch {
    return DEFAULT_GEMINI_API_KEY;
  }
}

export async function saveApiKey(key) {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  } catch (err) {
    console.error("Failed to save API key", err);
  }
}

export async function clearApiKey() {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
  } catch (err) {
    console.error("Failed to remove API key", err);
  }
}

function clampConfidence(value) {
  return Math.max(0, Math.min(Number(value) || 0, 1));
}

function buildCatalogReference() {
  return materials
    .map(
      (item) =>
        `${item.id} | ${item.nameEN} | ${item.nameKU} | ${item.categoryEN} | ${item.categoryKU} | ${item.descEN}`
    )
    .join("\n");
}

function getFallbackCopy() {
  return {
    noMatchEN: "The image was not clear enough to identify the material. Try again with a close, well-lit photo.",
    noMatchKU: "وێنەکە بە ئەندازەی پێویست \u0631وون نەبوو بۆ ناسینەوەی مادەکە. تکایە وێنەیەکی نزیکتر و \u0631وونتر دووبارە بگرە.",
    errorEN: "AI recognition is temporarily unavailable. Please check the connection and try again.",
    errorKU: "ناسینەوەی AI کاتێکەوە بەردەست نییە. تکایە پەیوەندییەکەت بپشکنە و دووبارە هەوڵبدەوە.",
  };
}

function normalizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" ? value : null;
}

function findCatalogMaterial(payload) {
  const requestedId = Number(payload?.materialId);
  if (requestedId) {
    const exactById = materials.find((item) => item.id === requestedId);
    if (exactById) return exactById;
  }

  const names = [payload?.materialNameEN, payload?.materialNameKU]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  for (const name of names) {
    const exact = materials.find(
      (item) => item.nameEN.toLowerCase() === name || item.nameKU.toLowerCase() === name
    );
    if (exact) return exact;

    const fuzzy = materials.find(
      (item) =>
        item.nameEN.toLowerCase().includes(name) ||
        name.includes(item.nameEN.toLowerCase()) ||
        item.nameKU.toLowerCase().includes(name) ||
        name.includes(item.nameKU.toLowerCase())
    );
    if (fuzzy) return fuzzy;
  }

  const category = String(payload?.categoryEN || payload?.categoryKU || "").toLowerCase();
  if (category) {
    return (
      materials.find(
        (item) =>
          item.categoryEN.toLowerCase().includes(category) ||
          category.includes(item.categoryEN.toLowerCase()) ||
          item.categoryKU.toLowerCase().includes(category) ||
          category.includes(item.categoryKU.toLowerCase())
      ) || null
    );
  }

  return null;
}

function deriveCatalogRecommendations(referenceMaterial, fallbackCategory) {
  const categoryPool = referenceMaterial
    ? materials.filter((item) => item.categoryEN === referenceMaterial.categoryEN && item.id !== referenceMaterial.id)
    : materials.filter((item) => {
      const en = String(fallbackCategory || "").toLowerCase();
      return en && item.categoryEN.toLowerCase().includes(en);
    });

  const sortedPool = [...categoryPool].sort((a, b) => a.basePrice - b.basePrice);
  const cheaperMaterial = referenceMaterial
    ? sortedPool.find((item) => item.basePrice < referenceMaterial.basePrice)
    : sortedPool[0] || null;
  const recommendedMaterial = cheaperMaterial || sortedPool[0] || null;

  return {
    cheaperAlternativeEN: cheaperMaterial
      ? {
        name: cheaperMaterial.nameEN,
        reason: referenceMaterial
          ? `Lower reference price than ${referenceMaterial.nameEN} while staying in the same category.`
          : "Lower-cost option from a similar construction category.",
        estimatedSavings: referenceMaterial
          ? `$${Math.max(referenceMaterial.basePrice - cheaperMaterial.basePrice, 0)} per reference unit`
          : "Lower-cost reference option",
      }
      : null,
    cheaperAlternativeKU: cheaperMaterial
      ? {
        name: cheaperMaterial.nameKU,
        reason: referenceMaterial
          ? `نرخی سەرچاوەی کەمتر هەیە لە ${referenceMaterial.nameKU} لە هەمان پۆلدا.`
          : "هەڵبژاردەیەکی هەرزانترە لە هەمان جۆری کاری بیناسازیدا.",
        estimatedSavings: referenceMaterial
          ? `${Math.max(referenceMaterial.basePrice - cheaperMaterial.basePrice, 0)} دۆلار بۆ یەکەی سەرچاوە`
          : "هەڵبژاردەیەکی سەرچاوەی هەرزانتر",
      }
      : null,
    recommendedOptionEN: recommendedMaterial
      ? {
        name: recommendedMaterial.nameEN,
        reason: referenceMaterial
          ? `Recommended as a practical alternative in the ${referenceMaterial.categoryEN} category.`
          : "Recommended as a practical material in the same general category.",
      }
      : null,
    recommendedOptionKU: recommendedMaterial
      ? {
        name: recommendedMaterial.nameKU,
        reason: referenceMaterial
          ? `وەک هەڵبژاردەیەکی گونجاو پێشنیار دەکرێت لە پۆلی ${referenceMaterial.categoryKU}.`
          : "وەک هەڵبژاردەیەکی گونجاو پێشنیار دەکرێت لە هەمان جۆری گشتی مادەکاندا.",
      }
      : null,
  };
}

function buildStructuredResult(payload, referenceMaterial, engine) {
  const derived = deriveCatalogRecommendations(referenceMaterial, payload.categoryEN);
  const confidence = clampConfidence(payload.confidence);
  const matched = Boolean(payload.matched || payload.materialNameEN || payload.materialNameKU || referenceMaterial);

  return {
    matched,
    material: referenceMaterial || null,
    materialNameEN: payload.materialNameEN || referenceMaterial?.nameEN || "",
    materialNameKU: payload.materialNameKU || referenceMaterial?.nameKU || payload.materialNameEN || "",
    categoryEN: payload.categoryEN || referenceMaterial?.categoryEN || "Construction Material",
    categoryKU: payload.categoryKU || referenceMaterial?.categoryKU || payload.categoryEN || "مادەی بیناسازی",
    confidence,
    description: payload.descriptionEN || referenceMaterial?.descEN || "",
    descriptionKU: payload.descriptionKU || referenceMaterial?.descKU || payload.descriptionEN || "",
    useCasesEN: normalizeList(payload.useCasesEN),
    useCasesKU: normalizeList(payload.useCasesKU),
    keyPropertiesEN: normalizeList(payload.keyPropertiesEN),
    keyPropertiesKU: normalizeList(payload.keyPropertiesKU),
    keyVisualIndicators: normalizeList(payload.keyVisualIndicatorsEN),
    keyVisualIndicatorsKU: normalizeList(payload.keyVisualIndicatorsKU),
    commonAlternatives: normalizeList(payload.commonAlternativesEN),
    commonAlternativesKU: normalizeList(payload.commonAlternativesKU),
    cheaperAlternativeEN: normalizeObject(payload.cheaperAlternativeEN) || derived.cheaperAlternativeEN,
    cheaperAlternativeKU: normalizeObject(payload.cheaperAlternativeKU) || derived.cheaperAlternativeKU,
    recommendedOptionEN: normalizeObject(payload.recommendedOptionEN) || derived.recommendedOptionEN,
    recommendedOptionKU: normalizeObject(payload.recommendedOptionKU) || derived.recommendedOptionKU,
    engine: "gemini-3.1-flash-lite-preview",
    topMatches: referenceMaterial
      ? [{ name: referenceMaterial.nameEN, score: Math.round(confidence * 100) }]
      : normalizeList(payload.topMatches),
  };
}

function buildLocalStructuredResult(localResult, fallback, reason) {
  const referenceMaterial = localResult?.material || null;
  const derived = deriveCatalogRecommendations(referenceMaterial, referenceMaterial?.categoryEN);

  return {
    matched: Boolean(localResult?.matched),
    material: referenceMaterial,
    materialNameEN: referenceMaterial?.nameEN || localResult?.materialNameEN || "",
    materialNameKU: referenceMaterial?.nameKU || localResult?.materialNameKU || localResult?.materialNameEN || "",
    categoryEN: referenceMaterial?.categoryEN || localResult?.categoryEN || "Construction Material",
    categoryKU: referenceMaterial?.categoryKU || localResult?.categoryKU || "مادەی بیناسازی",
    confidence: clampConfidence(localResult?.confidence),
    description: localResult?.description || referenceMaterial?.descEN || fallback.noMatchEN,
    descriptionKU: localResult?.descriptionKU || referenceMaterial?.descKU || fallback.noMatchKU,
    useCasesEN: referenceMaterial?.descEN ? [referenceMaterial.descEN] : [],
    useCasesKU: referenceMaterial?.descKU ? [referenceMaterial.descKU] : [],
    keyPropertiesEN: referenceMaterial ? [referenceMaterial.unitEN, `Reference price: $${referenceMaterial.basePrice}`] : [],
    keyPropertiesKU: referenceMaterial ? [referenceMaterial.unitKU, `نرخی سەرچاوە: ${referenceMaterial.basePrice} دۆلار`] : [],
    keyVisualIndicators: normalizeList(localResult?.keyVisualIndicators),
    keyVisualIndicatorsKU: normalizeList(localResult?.keyVisualIndicatorsKU),
    commonAlternatives: normalizeList(localResult?.commonAlternatives),
    commonAlternativesKU: normalizeList(localResult?.commonAlternativesKU),
    cheaperAlternativeEN: derived.cheaperAlternativeEN,
    cheaperAlternativeKU: derived.cheaperAlternativeKU,
    recommendedOptionEN: derived.recommendedOptionEN,
    recommendedOptionKU: derived.recommendedOptionKU,
    engine: localResult?.engine || reason || "local-fallback",
    topMatches: normalizeList(localResult?.topMatches),
  };
}

async function runFallbackRecognition(base64Image, fallback, reason) {
  if (Platform.OS === "web") {
    try {
      const localResult = await recognizeMaterialLocally(base64Image);
      return buildLocalStructuredResult(localResult, fallback, reason);
    } catch (error) {
      console.warn("[AI] local fallback failed:", error.message);
    }
  }

  return {
    matched: false,
    material: null,
    materialNameEN: "",
    materialNameKU: "",
    categoryEN: "Construction Material",
    categoryKU: "مادەی بیناسازی",
    confidence: 0,
    description: "API Key Error: The default Gemini API key is disabled by Google. Please open the AI Setup (Key icon) and enter your own valid Gemini API key to use real AI recognition.",
    descriptionKU: "هەڵەی کلیلی API: کلیلی بنەڕەتی Gemini لەلایەن Google وە ڕاگیراوە. تکایە لە ڕێکخستنی AI (ئایکۆنی کلیل) کلیلی تایبەت بە خۆت بنووسە بۆ بەکارهێنانی AI.",
    useCasesEN: [],
    useCasesKU: [],
    keyPropertiesEN: [],
    keyPropertiesKU: [],
    keyVisualIndicators: [],
    keyVisualIndicatorsKU: [],
    commonAlternatives: [],
    commonAlternativesKU: [],
    cheaperAlternativeEN: null,
    cheaperAlternativeKU: null,
    recommendedOptionEN: null,
    recommendedOptionKU: null,
    engine: "api_key_error",
    topMatches: [],
  };
}

function safeParseGeminiJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const candidates = [cleaned];
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    candidates.push(objectMatch[0]);
    candidates.push(
      objectMatch[0]
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
    );
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
    }
  }

  throw new Error("Could not parse Gemini JSON response");
}

async function callGemini(model, base64Image) {
  const apiKey = await getApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an EXPERT construction materials specialist and visual recognition AI with deep knowledge of Middle Eastern (especially Kurdistan/Iraq) construction practices.

Your task: Analyze the image and identify the construction material or building component with maximum accuracy.

═══════════════════════════════════════════════════════
🧠 EXPERT MATERIAL KNOWLEDGE BASE (use this to distinguish materials):
═══════════════════════════════════════════════════════

[BINDING MATERIALS]
• Cement (OPC/SRC/White): Gray or white fine powder in bags or mixed state. Bags labeled with brand names. Mixed = wet paste or set concrete. Gray = OPC/SRC. Pure white = White Cement. Finely ground, smooth texture. Key brands: Al-Jisr, Mass, Tasluja, Mawlawi.
• Gypsum Plaster (Bourk/Jabs): Bright white fine powder. Lighter and more brilliant white than cement. Bag or applied to walls as smooth white coating. Applied to interior ceilings/walls. Soft when dry, chalky surface.
• Tile Adhesive: White or gray granular powder in bags. Similar to cement but used in tiling contexts.

[STRUCTURAL MATERIALS]
• Steel Rebar (Deformed): Ribbed/patterned round steel bars, 8-32mm diameter. Dark gray metallic color. Surface has deformed ribs/ridges for bonding. Often in bundles.
• Steel I-Beam/H-Beam: Large structural steel in H or I cross-section. Smooth flat steel plates welded at right angles. Silvery-gray clean steel.
• Steel Angle Bar: L-shaped steel profile, two flat plates at 90°. Gray metallic.
• Steel Sheet (corrugated): Wavy/ribbed metallic sheets, often galvanized (shiny silver) or painted.

[MASONRY]
• Concrete Block (Hollow): Rectangular gray blocks with cylindrical or rectangular voids/holes. Coarse grainy surface. 20cm or 15cm thick. Made from cement+aggregate.
• Red Clay Brick: Rectangular fired clay units. Red-orange-brown color. Uniform smooth sides. Horizontal course patterns when laid.
• AAC Block (Ytong/Siporex): Very LIGHT gray blocks, almost white. Highly porous, bubbled texture visible on the surface or cut face. Lightweight — looks like solidified foam. Fine bubbles throughout.
• Fire Brick: Dense, pale yellow or cream-colored bricks. Smooth dense surface without pores. Heavier than regular brick.
• Natural Stone: Irregular or cut stone. Limestone = cream/beige with visible fossil layers. Granite = dark speckled. Travertine = natural holes and veins.

[AGGREGATE]
• Sand (Fine): Loose granular tan/yellow/beige particles. Very fine texture like beach sand. Piled or in bags.
• Gravel (Coarse): Larger mixed stones 5-20mm. Mixed gray, white, brown colors. Loose or piled.

[FINISHING MATERIALS]
• Ceramic Tiles: Smooth glazed rectangular tiles. Shiny surface with printed patterns or solid color. Sharp edges. Uniform size.
• Porcelain Tiles: Very smooth, dense, heavy tiles. Polished or matte high-end finish. Color through the full thickness. Harder than ceramic.
• Marble: Natural stone with flowing veins/patterns. Translucent depth. White, cream, gray, green, or black varieties. Highly polished or honed surface.
• Granite: Dark speckled stone (black, brown, gray). Very hard. Crystalline visibility. Salt-and-pepper or multicolor pattern.
• Travertine: Warm beige/cream stone with visible natural holes and wavy linear veins.
• Gypsum Board (Drywall): Large flat white boards with smooth paper face. Chalky white core visible at edges. Light weight. 1.2m x 2.4m or 1.2m x 3.0m panels.
• Paint: Roll or bucket of paint, OR painted surface. Interior = flat/matte finish. Exterior = satin/gloss.

[OPENINGS]
• Aluminum Window/Door Frame: Extruded aluminum profiles in silver, bronze, or white. Thin but rigid. Glass panels fitted in grooves. Anodized or powder-coated.
• UPVC Window Frame: Plastic (PVC) frames, usually white. Thicker profile than aluminum. Hollow internally. Double-glazed units common.
• Float Glass: Flat transparent clear glass. May have slight green or blue tint. Smooth reflective surface. Used in windows.
• Wooden Door: Flat rectangular panel, often with grooves/recesses for decoration. Painted or varnished wood or MDF. Handle/lock hole visible.
• Steel Security Door: Heavy metal door, often with decorative steel patterns. Multi-lock mechanism. Dark or painted finish.

[PLUMBING]
• PVC Pipe: White or gray cylindrical plastic pipes. Smooth surface. Lightweight. For drainage/water supply.
• PPR Pipe: Green or gray thermoplastic pipes. Slightly translucent. For hot water systems.
• Water Tank: Black or dark blue polyethylene barrel/tank. Rooftop placement common.

[ELECTRICAL]
• Electrical Cable: Flexible insulated wires/cables. Single or multi-core. PVC insulation in various colors.

[INSULATION]
• Waterproofing Membrane (Bitumen): Black rolled sheets. Thick rubbery bitumen material. Applied to roofs and foundations. Often torch-applied.
• EPS Foam: White expanded polystyrene foam boards. Very lightweight. Visible bead structure. White or cream color.
• XPS Board: Smooth-faced rigid insulation board. Pink, blue, or green color (extruded polystyrene). Denser than EPS. Tongue-and-groove edges often visible.
• Rock Wool: Fibrous wool-like material. Yellow, golden, or gray. Slightly springy. Used in rolls or boards.

[ROOFING]
• Sandwich Panel: Metal-faced composite panel with foam core. Silver/white/colored metal faces. Insulated.
• Corrugated Sheet: Wavy metal sheet. Galvanized (silver) or painted. Used for roofing warehouses.

[WOOD]
• Raw Wood/Timber: Natural grain, brown tones, varying from light pine to dark hardwood. Knots visible in natural wood.
• MDF/HDF/Plywood: Engineered wood. Smooth uniform surface. Edges show compressed layers.

═══════════════════════════════════════════════════════
📋 REFERENCE CATALOG (match your finding to catalog IDs for pricing):
═══════════════════════════════════════════════════════
${buildCatalogReference()}

═══════════════════════════════════════════════════════
⚠️ CRITICAL RULES:
═══════════════════════════════════════════════════════
1. Be VERY specific — do not confuse Glass with Concrete, Gypsum Board with Concrete Block, EPS Foam with AAC Block, etc.
2. Look carefully at texture, color, surface finish, shape, and context to distinguish similar materials.
3. Concrete Block = has large holes/voids. Brick = solid, fired red-orange. AAC = white/light gray with micro-bubbles.
4. Glass = transparent/reflective, smooth. Concrete = opaque, rough/gray aggregate texture.
5. Gypsum Board = flat white paper-faced board. Gypsum Plaster = powder or applied white coating.
6. If the material is NOT a construction material, set matched to false.
7. All Kurdish text must be written in Sorani Kurdish script.
8. Return ONLY strict JSON, no extra text.

Return EXACTLY this JSON shape:
{
  "matched": true,
  "materialId": 1,
  "materialNameEN": "Ordinary Portland Cement (OPC)",
  "materialNameKU": "سمێنتی ئاسایی پۆرتلاند",
  "categoryEN": "Binding",
  "categoryKU": "بەستن",
  "confidence": 0.92,
  "descriptionEN": "Short professional explanation of what this material is and its main use in construction.",
  "descriptionKU": "\u0631وونکردنەوەی پ\u0631ۆفیشناڵ بە کوردی دەربارەی مادەکە و بەکارھێنانی سەرەکی.",
  "useCasesEN": ["foundation concrete", "general masonry work", "mortar mixing"],
  "useCasesKU": ["کۆنکریتی بنە\u0631ەت", "کاری گشتی دیوارچینی", "تیکەڵكردنی ملاط"],
  "keyPropertiesEN": ["gray fine powder", "binding material", "requires water to set", "high compressive strength when cured"],
  "keyPropertiesKU": ["تۆزی ناسکی خۆڵەمێشی", "مادەی بەستەر", "پێویستی بە ئاو هەیە بۆ قایم بوون"],
  "keyVisualIndicatorsEN": ["fine gray or white powder", "paper bag packaging", "wet paste state or dry set"],
  "keyVisualIndicatorsKU": ["تۆزی ناسکی خۆڵەمێشی یان سپی", "جانتای کاغەزی", "حاڵەتی پاستای شل یان قایمبووی ووشک"],
  "commonAlternativesEN": [{"name": "Gypsum Plaster", "reason": "Used for interior finishing where structural strength is less critical"}],
  "commonAlternativesKU": [{"name": "جەبس", "reason": "بۆ کۆتایی ناوەوە بەکاردێت کاتێک هێزی سازەیی کەمتر پێویستە"}],
  "cheaperAlternativeEN": {"name": "Local gypsum plaster", "reason": "Lower cost for non-structural interior finishing", "estimatedSavings": "~25% cheaper per unit"},
  "cheaperAlternativeKU": {"name": "جەبسی خۆماڵی", "reason": "تێچووی کەمتر بۆ کۆتایی ناوەوەی غەیری سازەیی", "estimatedSavings": "نزیکەی ٢٥٪ هەرزانتر"},
  "recommendedOptionEN": {"name": "Sulfate Resistant Cement", "reason": "Recommended for foundations in sulfate-rich soil common in Kurdistan"},
  "recommendedOptionKU": {"name": "سمێنتی بەرگری لە سڵفات", "reason": "پێشنیار دەکرێت بۆ بنە\u0631ەت لە خاکی سڵفاتداری باو لە کوردستان"},
  "topMatches": [{"name": "Ordinary Portland Cement (OPC)", "score": 92}],
  "engine": "gemini-3.1-flash-lite-preview"
}`,
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image.replace(/^data:image\/[a-z]+;base64,/, ""),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Empty Gemini response");
  }

  return safeParseGeminiJson(text);
}

export async function recognizeMaterial(base64Image) {
  const fallback = getFallbackCopy();

  if (Date.now() < geminiBlockedUntil) {
    return runFallbackRecognition(base64Image, fallback, "quota-fallback");
  }

  for (const model of GEMINI_MODELS) {
    try {
      const payload = await callGemini(model, base64Image);
      const referenceMaterial = findCatalogMaterial(payload);
      return buildStructuredResult(payload, referenceMaterial, model);
    } catch (error) {
      const message = String(error.message || "");
      if (message.includes("HTTP 429")) {
        geminiBlockedUntil = Date.now() + 60000;
        return runFallbackRecognition(base64Image, fallback, "quota-fallback");
      }
      console.warn(`[AI] ${model} failed:`, message);
    }
  }

  return runFallbackRecognition(base64Image, fallback, "network-fallback");
}
