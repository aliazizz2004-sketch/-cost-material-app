const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Replicate = require("replicate");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Ensure you set these in your environment variables (.env) before running the server:
// REPLICATE_API_TOKEN
// GEMINI_API_KEY
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

// ── Elite 8K Architectural Visualization Prompt Builder ──
// ACT AS: An Elite 8K Architectural Visualization Engine and Photogrammetry Specialist.
// Sections: I. Semantic Segmentation | II. Material Synthesis & Fidelity (PBR)
//           III. Photometric Integration | IV. Quality Benchmark
function buildEliteVisualizationPrompt(materialType, color, finish, lightingContext) {
  // Build [TARGET_MATERIAL] as a single combined human-readable string
  // e.g. "Emerald Green Matte Paint" | "Glossy White Hexagon Tile" | "Industrial Gray HTC Concrete"
  const targetMaterial = `${color} ${finish} ${materialType}`.trim();

  // Determine category for section II branching
  const isPaint = materialType.toLowerCase().includes("paint");

  const sectionII_Material = isPaint
    ? `FOR PAINT — Albedo & Surface Physics:
- Apply a uniform, deep-pigment Albedo layer for "${targetMaterial}".
- Eliminate all graininess, noise, or texture artifacts on the paint surface.
- Color Vibrancy: The color must be vivid and "clean," NOT washed-out, chalky, desaturated, or gray. Use Albedo accuracy: render the true pigment color independently from shadow darkening.
- The color must react naturally to the room's ambient light — brighter in lit zones, darker in shadow zones, but always maintaining the same hue identity.
- PBR Surface Physics:
  • Matte finish → High roughness (0.95+), zero specular, soft omnidirectional light absorption, subtle plaster micro-texture still visible beneath paint.
  • Satin finish → Medium roughness (0.5–0.7), gentle wide-angle Fresnel specular highlights from primary light sources.
  • Gloss finish → Low roughness (0.1–0.2), sharp narrow Fresnel reflections mirroring windows and lamp shapes on the wall surface.`
    : `FOR TILES / HTC / STONE / BRICK — Micro-Texture & Displacement:
- Render "${targetMaterial}" with FULL 8K high-frequency surface detail. No flat, blurry, or sticker-like appearance.
- Each individual unit (tile, slab, brick) must have:
  a) Surface micro-texture: grain, crystalline structure, scratches, kiln marks, or natural veining visible at close range.
  b) Grout lines (tiles/brick): 2–4mm wide, slightly recessed, subtle color variation, realistic depth shadow inside grout channel.
  c) Displacement Mapping: realistic 3D relief — tiles sit slightly proud of grout; stone slabs have natural surface undulation.
- Procedural Texture Variety: Apply subtle randomized variation per tile/slab to prevent an artificial repeating-tile-pattern look.
- Perspective Foreshortening: tile/pattern scale and grout lines must decrease accurately as the wall recedes toward vanishing points.
- PBR Surface Physics:
  • Matte stone/concrete → High roughness, diffuse scattering, no specular.
  • Polished/Glossy tile → Low roughness, sharp Fresnel reflections of room light sources.
  • Satin/Honed → Medium roughness, soft broad highlight.`;

  return `ACT AS: An Elite 8K Architectural Visualization Engine and Photogrammetry Specialist.

MISSION: Perform a hyper-realistic, non-destructive surface replacement of all vertical wall planes within the provided image.
Target Material: [${targetMaterial}]
Lighting Context: ${lightingContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. SEMANTIC SEGMENTATION & OCCLUSION — THE "NO-BLEED" RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pixel-Perfect Masking: Identify all vertical wall plane boundaries with sub-pixel precision.

DO NOT MODIFY (absolutely preserve):
  • Ceiling (flat, vaulted, or coffered)
  • Flooring (all types: tile, wood, carpet, concrete, marble)
  • Baseboards and skirting boards
  • Crown molding and cornices
  • All window frames, door frames, and window sills

Foreground Preservation — Occluding Objects (100% untouched):
  • All furniture: sofas, chairs, tables, beds, shelves, cabinets
  • All plants and organic decor
  • Wall-mounted TVs, art frames, mirrors, clocks
  • All light fixtures: pendants, wall sconces, floor lamps, ceiling fixtures
  • All electrical outlets, switch plates, vents, radiators

Edge Quality — THE NO-BLEED RULE:
  The new material must appear to exist physically BEHIND all occluding objects.
  ZERO edge-blurring. ZERO color-halos. ZERO soft fringe. ZERO color spill onto objects.
  Use razor-sharp sub-pixel masking at every boundary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
II. MATERIAL SYNTHESIS & FIDELITY — THE "CLEAR" RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sectionII_Material}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
III. PHOTOMETRIC INTEGRATION — THE "REALISM" RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shadow Persistence (CRITICAL):
  Detect and preserve 100% of all original shadows cast onto the wall surfaces.
  The [${targetMaterial}] must sit UNDERNEATH these shadows — shadows are overlaid on top of the new material surface, not removed or relocated.

Ambient Occlusion — Corner Depth:
  Maintain the natural subtle darkening in room corners, where walls meet the ceiling, and behind furniture edges. This AO gradient is essential for preserving the 3D spatial depth of the room.

Global Illumination — Bounce Light:
  The new wall color [${targetMaterial}] must subtly influence nearby surfaces as it would in a real-world renovation:
  • A warm-colored wall will cast a faint warm bounce onto the adjacent ceiling and floor near the base.
  • A cool-toned wall will contribute cool-tinted ambient fill to nearby objects.
  • Keep bounce light subtle and physically plausible — not exaggerated.

Original Lighting Temperature:
  Do not alter the room's existing color temperature or luminance levels. Preserve all original light source intensities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IV. QUALITY BENCHMARK & ABSOLUTE CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output Standard: The result must be indistinguishable from a professional architectural photograph shot in a real renovated space.

ZERO TOLERANCE VIOLATIONS — DO NOT:
  ✗ Hallucinate any new objects, furniture, decor, or architectural features
  ✗ Alter or move any existing object in the scene
  ✗ Change the floor, ceiling, or room layout in any way
  ✗ Apply any painterly, watercolor, sketch, or artistic-filter effects
  ✗ Blur or soften the material texture — every surface must be in sharp crisp focus
  ✗ Wash out, desaturate, or gray-shift the material color
  ✗ Introduce new light sources or change the time of day
  ✗ Create compositing seams, visible mask edges, or transition artifacts
  ✗ Produce repetitive, tiled, or stamped pattern artifacts

Final Output: Hyper-realistic 8K architectural photograph. Photorealistic. Hyperdetailed. Sharp focus. Accurate albedo. Preserved shadows and ambient occlusion. Seamless integration. Professional grade.`;
}

/**
 * Helper to upload a buffer to a temporary public URL or let Replicate read it as data URI.
 * Replicate's API usually accepts Data URIs or public URLs.
 */
const bufferToDataURI = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

/**
 * Step 1: Wall Masking (Segmentation)
 * Uses Meta's Segment Anything Model (SAM) or a specific semantic segmentation model.
 * Since SAM requires point prompts, an automatic semantic segmentation model like
 * 'lucataco/segment-anything-2' or a specialized room segmentation model is preferred.
 */
async function generateWallMask(imageBuffer, mimetype) {
  console.log("--> Step 1: Generating wall mask via Replicate...");
  const imageUri = bufferToDataURI(imageBuffer, mimetype);
  
  // Example using a hypothetical architecture/room segmentation model on Replicate
  // (e.g., 'zylim0702/controlnet_aux:...' or similar semantic seg)
  // We'll use a placeholder model ID for "wall segmentation" which returns a B&W mask.
  const output = await replicate.run(
    "lucataco/segment-anything-2:4e1424a1b800fa5b661d9a56ebcaea7dedefbfce70d015c7e1ba7ebd1402e861",
    {
      input: {
        image: imageUri,
        // Hypothetical prompt if the model supports text-prompted segmentation (like GroundingDINO + SAM)
        text_prompt: "wall",
        return_mask_only: true
      }
    }
  );

  // output is usually a URL to the generated mask image
  console.log("Mask generated:", output);
  return output; // URL of the mask
}

/**
 * Step 2: Lighting & Context Analysis (Elite Wall Segmentation)
 * Uses Gemini 3.1 Flash Lite Preview to analyze lighting, surfaces, and wall geometry.
 */
async function analyzeLightingAndContext(imageBuffer, mimetype) {
  console.log("--> Step 2: Analyzing lighting, wall geometry, and context via Gemini 3.1 Flash Lite Preview...");
  
  const prompt = `ROLE: Act as an elite architectural visualization AI specializing in semantic segmentation.

Analyze this interior photo with extreme precision.

Return a strictly formatted JSON object with these keys:
- "lightingAndContext": string — describe lighting type (warm incandescent, natural daylight, soft diffused, directional), room mood, shadows direction, specular highlights present
- "wallDescription": string — precise description of the existing wall surface material, texture, and color
- "lightSources": string — list visible light sources (windows, lamps, overhead lights)
- "ambientOcclusion": string — describe shadow softness in corners and behind furniture
- "dominantFinish": string — one word: matte OR satin OR glossy (based on current wall finish)
- "wallGeometry": string — describe wall perspective, vanishing points, and how the wall recedes

Return ONLY valid JSON, no markdown.`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimetype,
    },
  };

  const result = await geminiModel.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  try {
    const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const fullContext = [
      parsed.lightingAndContext,
      `Wall geometry: ${parsed.wallGeometry || ""}`,
      `Light sources: ${parsed.lightSources || ""}`,
      `Ambient occlusion: ${parsed.ambientOcclusion || ""}`,
      `Current surface: ${parsed.wallDescription || ""}`
    ].filter(Boolean).join(" | ");
    console.log("Elite context analyzed:", fullContext);
    return fullContext;
  } catch (err) {
    console.error("Gemini parse error. Raw output:", responseText);
    return "natural soft lighting, modern room, perspective walls with vanishing point, subtle ambient occlusion in corners";
  }
}

/**
 * Step 3: Elite Photorealistic Rendering (Inpainting via ControlNet/SDXL)
 * Uses the elite architectural visualization prompt with precision masking.
 * 
 * KEY RENDERING PARAMETERS (from elite prompt specification):
 * - Model Type: Inpainting with ControlNet Segmentation
 * - Denoising Strength: exactly 0.65 (ensures wall changes without altering furniture)
 * - Mask Blur: 4 (sharp edges, no halo effect around foreground objects)
 */
async function renderNewMaterial(imageBuffer, mimetype, maskUrl, materialType, color, finish, lightingContext) {
  const targetMaterial = `${color} ${finish} ${materialType}`.trim();
  console.log(`--> Step 3: Elite 8K rendering — [${targetMaterial}]...`);
  const originalImageUri = bufferToDataURI(imageBuffer, mimetype);
  
  // Build the 8K Elite Architectural Visualization prompt (PBR + GI + AO + No-Bleed)
  const elitePrompt = buildEliteVisualizationPrompt(materialType, color, finish, lightingContext);
  
  const negativePrompt = [
    // Hallucinations & layout changes
    "hallucinated objects", "new furniture", "added decor", "altered room layout",
    "moved furniture", "changed architecture", "new windows", "new doors",
    // Masking / bleed failures (The NO-BLEED Rule)
    "color bleeding onto furniture", "color bleeding onto floor", "color bleeding onto ceiling",
    "color bleeding onto baseboard", "color bleeding onto trim", "color bleeding onto door frame",
    "color bleeding onto window frame", "halo effect", "glow around edges",
    "soft fringe", "color spill", "compositing seam", "visible mask edge", "hard compositing line",
    // Lighting & photometry failures
    "changed lighting temperature", "new light sources", "different time of day",
    "overexposed", "underexposed", "blown highlights", "crushed blacks",
    "missing shadows", "removed ambient occlusion", "flat corners",
    // Material quality failures (The CLEAR Rule)
    "flat texture", "blurry texture", "blurry material", "low resolution texture", "pixelated texture",
    "washed out color", "desaturated", "faded", "chalky", "gray wash", "muted color",
    "painterly effect", "watercolor", "impressionist", "oil painting", "sketch", "artistic filter",
    "cartoon", "CGI look", "plastic surface", "fake material", "tiled repetition", "pattern stamping",
    "low detail", "blurry grout", "missing grout lines",
    // General render quality
    "artifacts", "noise", "grain", "distortion", "jpeg artifacts",
    "unrealistic", "low quality", "8-bit look"
  ].join(", ");

  // Elite inpainting with ControlNet Segmentation pipeline on Replicate.
  const output = await replicate.run(
    "stability-ai/sdxl-inpainting:generic-version-hash-or-id",
    {
      input: {
        image: originalImageUri,
        mask: maskUrl,
        prompt: elitePrompt,
        negative_prompt: negativePrompt,
        // CRITICAL PARAMETERS from elite prompt specification:
        denoising_strength: 0.65,    // Exactly 0.65: changes wall fully without touching furniture
        mask_blur: 4,                // Low blur: sharp boundary, prevents halo effect
        controlnet_conditioning_scale: 0.85, // Strong geometry retention
        num_inference_steps: 35,
        guidance_scale: 8.0,
      }
    }
  );

  console.log("Elite rendering complete:", output);
  return Array.isArray(output) ? output[0] : output;
}

// --------------------------------------------------------------------------
// API Route
// --------------------------------------------------------------------------
app.post("/api/render-wall", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }

    // Elite prompt variables: materialType, color, finish
    const { materialName, materialType, color, finish } = req.body;
    const resolvedMaterialType = materialType || materialName || "paint";
    const resolvedColor = color || "neutral";
    const resolvedFinish = finish || "matte";

    if (!resolvedMaterialType) {
      return res.status(400).json({ error: "No material type provided." });
    }

    console.log(`\n--- Starting Elite Architectural Visualization Pipeline ---`);
    console.log(`Material: ${resolvedColor} ${resolvedMaterialType} [${resolvedFinish} finish]`);
    const imageBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    // STEP 1: Wall Masking (Semantic Segmentation)
    const maskUrl = await generateWallMask(imageBuffer, mimetype);

    // STEP 2: Elite Lighting & Context Analysis (Gemini 3.1 Flash Lite Preview)
    const lightingContext = await analyzeLightingAndContext(imageBuffer, mimetype);

    // STEP 3: Elite Photorealistic Rendering
    // Denoising Strength: 0.65 | Mask Blur: 4 (as per elite prompt specification)
    const finalImageUrl = await renderNewMaterial(
      imageBuffer, mimetype, maskUrl,
      resolvedMaterialType, resolvedColor, resolvedFinish,
      lightingContext
    );

    console.log("--- Elite Visualization Pipeline Complete ---");
    res.json({
      success: true,
      finalImageUrl,
      lightingContext,
      appliedMaterial: { type: resolvedMaterialType, color: resolvedColor, finish: resolvedFinish }
    });

  } catch (error) {
    console.error("Elite AR Pipeline Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during pipeline execution." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend AR Pipeline server running on http://localhost:${PORT}`);
});
