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
 * Step 2: Lighting & Context Analysis
 * Uses Gemini 3.1 Flash Lite Preview to get a highly descriptive context.
 */
async function analyzeLightingAndContext(imageBuffer, mimetype) {
  console.log("--> Step 2: Analyzing lighting and context via Gemini...");
  
  const prompt = `Analyze this interior photo and describe the lighting conditions, room style, and spatial perspective in extreme detail. 
Focus ONLY on the lighting (e.g., warm incandescent, natural daylight, soft shadows, hard directional light), the aesthetic style (modern, rustic, industrial), and the mood. 
Return ONLY a strictly formatted JSON object with a single key "lightingAndContext" containing your descriptive text string.`;

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
    console.log("Context analyzed:", parsed.lightingAndContext);
    return parsed.lightingAndContext;
  } catch (err) {
    console.error("Gemini parse error. Raw output:", responseText);
    return "natural soft lighting, standard modern room"; // Fallback
  }
}

/**
 * Step 3: Photorealistic Rendering (Inpainting via ControlNet/SDXL)
 * Replaces the masked area with the new material while retaining depth via ControlNet.
 */
async function renderNewMaterial(imageBuffer, mimetype, maskUrl, materialPrompt, lightingContext) {
  console.log("--> Step 3: Rendering new material using SDXL Inpainting + Depth Control...");
  const originalImageUri = bufferToDataURI(imageBuffer, mimetype);
  
  // Combine material with lighting conditions
  const combinedPrompt = `${materialPrompt}, perfectly integrated into the room, photorealistic, 8k resolution, highly detailed texture. Lighting and context: ${lightingContext}. Seamless edges, realistic reflections, preserving underlying wall architecture and geometry.`;
  const negativePrompt = "messy, unrealistic, cartoon, artifacts, distorted, noisy, glowing, uneven gaps, changing room structure, altering furniture";

  // Use an SDXL Inpainting + ControlNet pipeline on Replicate.
  // Model example: rossjillian/controlnet-sdxl-inpainting (or any similar specialized model)
  const output = await replicate.run(
    "stability-ai/sdxl-inpainting:generic-version-hash-or-id",
    {
      input: {
        image: originalImageUri,
        mask: maskUrl,
        prompt: combinedPrompt,
        negative_prompt: negativePrompt,
        controlnet_conditioning_scale: 0.8, // Retain original geometry (e.g. windows/baseboards)
        num_inference_steps: 30,
        guidance_scale: 7.5,
      }
    }
  );

  console.log("Rendering complete:", output);
  // Replicate models usually return an array of image URLs or a single URL.
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

    const { materialName } = req.body;
    if (!materialName) {
      return res.status(400).json({ error: "No material name provided." });
    }

    console.log(`\n--- Starting Advanced AR Pipeline for material: ${materialName} ---`);
    const imageBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    // STEP 1: Wall Masking
    const maskUrl = await generateWallMask(imageBuffer, mimetype);

    // STEP 2: Context Analysis
    const lightingContext = await analyzeLightingAndContext(imageBuffer, mimetype);

    // STEP 3: Photorealistic Rendering
    const finalImageUrl = await renderNewMaterial(imageBuffer, mimetype, maskUrl, materialName, lightingContext);

    console.log("--- Pipeline Complete ---");
    res.json({ success: true, finalImageUrl, lightingContext });

  } catch (error) {
    console.error("AR Pipeline Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during pipeline execution." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend AR Pipeline server running on http://localhost:${PORT}`);
});
