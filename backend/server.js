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

// ── Hyper-Realistic Architectural Visualization Prompt Builder ──
// Implements Albedo accuracy, micro-texture mapping, ambient occlusion,
// and razor-sharp semantic masking for professional-grade AI wall visualization.
function buildEliteVisualizationPrompt(materialType, color, finish, lightingContext) {
  // Determine if this is a paint or a textured hard material
  const isPaint = materialType.toLowerCase().includes("paint");
  const isHardMaterial = !isPaint; // tiles, stone, marble, brick, etc.

  const materialSpecificInstructions = isPaint
    ? `PAINT APPLICATION RULES:
- Apply a deep-pigmented, high-fidelity paint coating in the exact color: ${color}.
- Use ALBEDO COLOR ACCURACY: render the true, physically-based color of ${color} independent of shadow regions. In lit areas the color should be vivid and clear. In shadowed areas the same hue must darken naturally without washing out or becoming gray.
- The paint must look like 1-2 coats of premium interior paint — smooth, uniform, with micro-texture from the underlying wall plaster still subtly visible.
- The color ${color} must NOT look faded, desaturated, washed-out, or chalky. It must appear as the true pigment color.
- Finish type: ${finish}. If matte — zero specular reflection, soft diffuse sheen. If satin — gentle, wide specular highlight from primary light sources. If gloss — sharp, narrow specular highlights mirroring window/lamp shapes.`
    : `HARD MATERIAL / TILE / STONE APPLICATION RULES:
- Render the ${materialType} in ${color} with FULL 8K MICRO-TEXTURE DETAIL.
- Each individual tile, stone slab, or brick unit must have:
  a) Realistic surface micro-texture: scratches, grain, crystalline structure, or kiln marks visible at close range.
  b) Accurate grout lines (for tiles/brick): 2-4mm wide, slightly recessed, with subtle color variation.
  c) 3D DEPTH MAPPING: the surface must have realistic bump/displacement — tiles sit slightly proud of grout, stone has natural relief.
- Apply correct perspective foreshortening: tile/pattern scale must reduce as the wall recedes into the distance (vanishing point correction).
- The material must NOT look like a flat sticker or 2D image overlay. It must appear physically embedded in the wall.`;

  return `ROLE: Act as a hyper-realistic architectural visualization AI with expert-level semantic segmentation and photorealistic texture mapping.

PRIMARY DIRECTIVE: Analyze the uploaded photograph of this interior space. Identify ONLY the vertical structural wall surfaces. Apply the following material exclusively to those surfaces.

TARGET MATERIAL: ${color} ${materialType} | Finish: ${finish}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SEMANTIC MASKING (CRITICAL — RAZOR-SHARP PRECISION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Identify and isolate ONLY the exposed vertical wall surfaces.
- EXCLUDE with absolute precision:
  • Floor (all materials: tile, carpet, wood, concrete)
  • Ceiling (flat or vaulted)
  • Baseboards, skirting boards, crown molding, cornices
  • Window frames, door frames, window sills
  • All furniture (sofas, tables, chairs, beds, shelves)
  • All plants, decorative objects, artwork, mirrors, TVs
  • All light fixtures (pendant lights, wall sconces, lamps)
  • All electrical outlets, switches, vents
- MASKING EDGE QUALITY: Use razor-sharp pixel-level edge detection. There must be ZERO color bleeding, ZERO halo effect, and ZERO soft fringe around ANY foreground object.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — MATERIAL APPLICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${materialSpecificInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — LIGHTING, SHADOWS & AMBIENT OCCLUSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- PRESERVE ALL ORIGINAL CAST SHADOWS: Every shadow cast by furniture or objects onto the wall must remain perfectly overlaid on the new material surface. The new material sits BEHIND the shadows.
- AMBIENT OCCLUSION: Maintain all original ambient occlusion — the soft, natural darkening that occurs in room corners, behind furniture edges, and under ceiling lines. This is critical for realism.
- ORIGINAL LIGHTING TEMPERATURE: Do not change the color temperature of the room lighting. A warm room must stay warm. A cool daylight room must stay cool.
- Lighting context analysis: ${lightingContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ABSOLUTE NEGATIVE CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- DO NOT alter, move, add, or remove any furniture, decor, or architectural elements.
- DO NOT change the floor material, ceiling, or room layout.
- DO NOT apply a "painterly", watercolor, impressionist, or artistic style. Output must be a photographic image.
- DO NOT blur the material texture. Every surface must be in sharp, crisp focus.
- DO NOT wash out the color. The material color must be rich, accurate, and physically-based.
- DO NOT create glowing halos around objects or at the ceiling line.
- DO NOT change the time of day or ambient light level.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output: A hyper-realistic 8K architectural photograph. The image must be indistinguishable from a real photo of the room with the new material installed. Photorealistic, hyperdetailed, sharp focus, accurate albedo, preserved ambient occlusion, seamless material integration.`;
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
  console.log(`--> Step 3: Elite rendering — ${color} ${materialType} [${finish} finish]...`);
  const originalImageUri = bufferToDataURI(imageBuffer, mimetype);
  
  // Build the elite architectural visualization prompt
  const elitePrompt = buildEliteVisualizationPrompt(materialType, color, finish, lightingContext);
  
  const negativePrompt = [
    // Layout changes
    "altered room layout", "moved furniture", "new furniture", "hallucinated decor",
    // Masking failures
    "color bleeding onto furniture", "color bleeding onto floor", "color bleeding onto ceiling",
    "color bleeding onto baseboard", "color bleeding onto door frame", "color bleeding onto window frame",
    "halo around objects", "glow around furniture edges", "soft fringe", "color spill",
    // Lighting changes
    "changed lighting temperature", "new light sources", "different time of day",
    "overexposed", "underexposed", "blown highlights",
    // Material quality issues
    "flat texture", "blurry texture", "blurry material", "low resolution texture", "pixelated",
    "washed out color", "desaturated", "faded paint", "chalky", "gray wash",
    "painterly", "watercolor", "impressionist", "artistic filter", "sketch",
    "cartoon", "CGI look", "plastic surface", "fake material",
    // General quality
    "artifacts", "distorted", "noisy", "low quality", "jpeg artifacts",
    "unrealistic rendering", "compositing seam", "visible mask edge"
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
