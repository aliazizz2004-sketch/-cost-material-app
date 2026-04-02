/**
 * Platform-Safe Local Recognition Engine v5.0
 * Works on Android, iOS, and Web.
 * No browser-only APIs (no window, document, canvas, Image).
 * Pure JavaScript color analysis from base64 pixel data.
 */

import { Platform } from "react-native";
import materials from "../data/materials";

// ─── Color Analysis (Platform-Safe) ─────────────────────────────────────────

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

/**
 * Decode a base64 JPEG/PNG to raw pixel bytes without browser APIs.
 * Works on RN using atob polyfill or the global Buffer if available.
 */
function decodeBase64ToBytes(b64) {
  // Strip data URI prefix if present
  const cleaned = b64.replace(/^data:image\/[a-z]+;base64,/, "");
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(cleaned, "base64");
    }
    // atob is available on RN >= 0.64 and web
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Sample RGB values from raw JPEG bytes heuristically.
 * We skip the JPEG header (~SOI, APP0, DQT, SOF markers) and sample
 * luminance-ish bytes every N bytes. This is approximate but good enough
 * for hue/saturation/brightness color analysis without a real JPEG decoder.
 */
function sampleColorsFromBytes(bytes) {
  if (!bytes || bytes.length < 100) return null;

  const samples = [];
  // Skip first 500 bytes (JPEG headers) and sample triples
  const step = Math.max(3, Math.floor((bytes.length - 500) / 600));
  for (let i = 500; i < bytes.length - 3; i += step) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    // Filter out JPEG artifact bytes (very common 0xFF markers)
    if (r === 0xFF || g === 0xFF || b === 0xFF) continue;
    if (r === 0 && g === 0 && b === 0) continue;
    samples.push({ r, g, b });
    if (samples.length >= 300) break;
  }
  return samples.length > 20 ? samples : null;
}

function analyzeColors(samples) {
  const hues = [], sats = [], lights = [];
  let achro = 0, tRed = 0, brown = 0, yel = 0, bg = 0, colr = 0, vl = 0, vd = 0;

  for (const { r, g, b } of samples) {
    const hsl = rgb2hsl(r, g, b);
    hues.push(hsl.h); sats.push(hsl.s); lights.push(hsl.l);

    const { h, s, l } = hsl;
    if (s < 14) achro++;
    if (l > 78) vl++;
    if (l < 20) vd++;
    if (s > 40) colr++;
    if ((h < 18 || h > 345) && s > 20 && l > 15 && l < 60) tRed++;
    if (h >= 18 && h <= 52 && s > 12 && l > 12 && l < 70) brown++;
    if (h >= 45 && h <= 68 && s > 15) yel++;
    if (h >= 150 && h <= 230 && s > 8) bg++;
  }

  const n = samples.length;
  const avgSat = avg(sats);
  const avgLight = avg(lights);
  const avgHue = avg(hues);
  const satStd = std(sats);
  const lightStd = std(lights);

  // Estimate smoothness from saturation variation (smooth = low satStd)
  const smooth = Math.max(0, 1 - satStd / 50);
  const rough = 1 - smooth;

  return {
    avgHue, avgSat, avgLight, satStd, lightStd,
    achrR: achro / n, tRedR: tRed / n, brownR: brown / n,
    yelR: yel / n, bgR: bg / n, colrR: colr / n,
    vlR: vl / n, vdR: vd / n,
    smooth, rough,
  };
}

// ─── Score Profiles per Material ID ─────────────────────────────────────────

const PROFILES = [
  { id: 1,  s: (f) => (f.achrR > .55 ? 20 : 0) + (f.avgSat < 18 ? 10 : 0) + (f.avgLight > 40 && f.avgLight < 68 ? 10 : 0) + (f.smooth > .5 ? 8 : 0) - (f.brownR > .25 ? 25 : 0) - (f.tRedR > .1 ? 25 : 0) },
  { id: 2,  s: (f) => (f.avgLight < 45 ? 15 : 0) + (f.tRedR > .12 && f.avgLight < 50 ? 15 : 0) + (f.achrR > .3 && f.avgLight < 40 ? 10 : 0) - (f.avgLight > 60 ? 20 : 0) },
  { id: 3,  s: (f) => (f.achrR > .5 ? 15 : 0) + (f.avgLight > 48 && f.avgLight < 78 ? 10 : 0) + (f.avgSat < 18 ? 8 : 0) - (f.brownR > .3 ? 20 : 0) - (f.tRedR > .1 ? 20 : 0) },
  { id: 4,  s: (f) => (f.tRedR > .35 ? 30 : f.tRedR > .2 ? 15 : f.tRedR > .1 ? 5 : -20) + (f.rough > .2 && f.rough < .7 ? 5 : 0) - (f.brownR > .45 ? 10 : 0) },
  { id: 5,  s: (f) => (f.avgHue > 28 && f.avgHue < 58 ? 12 : 0) + (f.yelR > .2 ? 15 : 0) + (f.avgLight > 48 ? 8 : 0) - (f.tRedR > .15 ? 12 : 0) },
  { id: 6,  s: (f) => (f.rough > .45 ? 12 : 0) + (f.avgSat < 35 ? 5 : 0) - (f.smooth > .6 ? 15 : 0) },
  { id: 7,  s: (f) => (f.achrR > .6 ? 15 : 0) + (f.avgLight > 35 && f.avgLight < 62 ? 10 : 0) + (f.smooth > .45 ? 8 : 0) - (f.brownR > .2 ? 18 : 0) },
  { id: 8,  s: (f) => (f.vlR > .45 ? 15 : 0) + (f.achrR > .6 ? 10 : 0) + (f.avgLight > 72 ? 8 : 0) - (f.avgLight < 65 ? 25 : 0) - (f.brownR > .1 ? 18 : 0) },
  { id: 9,  s: (f) => (f.vlR > .6 ? 20 : 0) + (f.avgLight > 85 ? 10 : 0) + (f.achrR > .7 ? 8 : 0) - (f.avgLight < 75 ? 30 : 0) },
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
  // Wood/MDF profiles — strongly reward brown + warm hues
  { id: 44, s: (f) => (f.brownR > .30 ? 40 : f.brownR > .18 ? 25 : 0) + (f.avgHue > 18 && f.avgHue < 55 ? 15 : 0) + (f.avgSat > 10 && f.avgSat < 60 ? 10 : 0) - (f.achrR > .6 ? 35 : 0) - (f.tRedR > .35 ? 10 : 0) },
  { id: 45, s: (f) => (f.brownR > .25 ? 35 : f.brownR > .12 ? 20 : 0) + (f.avgHue > 15 && f.avgHue < 50 ? 12 : 0) + (f.smooth > .4 ? 8 : 0) - (f.achrR > .65 ? 30 : 0) },
  { id: 46, s: (f) => (f.brownR > .20 ? 30 : 0) + (f.avgHue > 20 && f.avgHue < 50 ? 10 : 0) - (f.achrR > .7 ? 25 : 0) },
  // Glass — only if truly achromatic AND light
  { id: 29, s: (f) => (f.achrR > .75 && f.avgSat < 10 && f.avgLight > 55 ? 35 : 0) - (f.brownR > .15 ? 60 : 0) - (f.tRedR > .05 ? 40 : 0) - (f.yelR > .1 ? 40 : 0) },
];

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function recognizeMaterial(base64Image) {
  try {
    const bytes = decodeBase64ToBytes(base64Image);
    const samples = sampleColorsFromBytes(bytes);

    if (!samples) {
      return {
        matched: false, material: null, confidence: 0,
        description: "Could not decode image for analysis.",
        engine: "local-rn",
      };
    }

    const features = analyzeColors(samples);

    const scores = materials.map((material) => {
      const profile = PROFILES.find((p) => p.id === material.id);
      return {
        id: material.id,
        name: material.nameEN,
        score: Math.max(0, profile ? profile.s(features) : 0),
      };
    });

    scores.forEach((s) => (s.score = Math.max(0, s.score)));
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const second = scores[1] || { score: 0 };
    const gap = best.score - second.score;

    // Require a minimum score to avoid false positives (e.g. always returning "Natural Stone")
    const MIN_SCORE = 10;
    if (best.score < MIN_SCORE) {
      return {
        matched: false,
        material: null,
        confidence: 0,
        description: "Could not confidently identify the material from image colors alone. Try the AI scanner with a clearer photo.",
        engine: "local-rn",
        topMatches: scores.slice(0, 3).map((s) => ({ name: s.name, score: Math.round(s.score) })),
      };
    }

    const confidence = Math.min(0.82,
      Math.max(0.25,
        (best.score / 55) * 0.45 + Math.min(gap / 25, 0.25) + 0.05
      )
    );

    const material = materials.find((m) => m.id === best.id);

    return {
      matched: true,
      material,
      confidence: Math.round(confidence * 100) / 100,
      description: `Local color analysis: ${colorDesc(features)}, ${texDesc(features)}.`,
      engine: "local-rn",
      topMatches: scores.slice(0, 3).map((s) => ({
        name: s.name,
        score: Math.round(s.score),
      })),
    };
  } catch (error) {
    console.error("[localRecognition] error:", error.message);
    return {
      matched: false, material: null, confidence: 0,
      description: "Local analysis failed. Please try the AI recognizer.",
      engine: "local-rn",
    };
  }
}

function colorDesc(f) {
  if (f.achrR > 0.5 && f.avgLight > 75) return "light/white surface";
  if (f.achrR > 0.5 && f.avgLight < 30) return "dark surface";
  if (f.achrR > 0.5) return "gray/neutral";
  if (f.tRedR > 0.2) return "red/terracotta tones";
  if (f.brownR > 0.25) return "brown/warm tones (likely wood)";
  if (f.yelR > 0.15) return "sandy/yellow";
  if (f.colrR > 0.3) return "vivid colors";
  return "mixed coloring";
}

function texDesc(f) {
  if (f.smooth > 0.65) return "smooth texture";
  if (f.rough > 0.5) return "rough texture";
  return "moderate texture";
}
