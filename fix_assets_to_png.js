/**
 * fix_assets_to_png.js
 * Converts JPEG-disguised-as-PNG files to real PNG format.
 * Uses Jimp v1+ API (fromFile / .write)
 * Run with: node fix_assets_to_png.js
 */
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, 'assets');

const FILES_TO_FIX = [
  'icon.png',
  'splash-icon.png',
  'android-icon-foreground.png',
  'android-icon-monochrome.png',
  'favicon.png',
];

async function fixFile(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filename} (not found)`);
    return;
  }

  const buf = fs.readFileSync(filePath);
  const hex = buf.slice(0, 4).toString('hex');
  const isJPEG = hex.startsWith('ffd8');
  const isPNG = hex.startsWith('89504e47');

  if (isPNG) {
    console.log(`✅ ${filename} is already a valid PNG.`);
    return;
  }

  if (!isJPEG) {
    console.log(`⚠️  ${filename} has unknown format: ${hex}`);
    return;
  }

  console.log(`🔄 Converting ${filename} from JPEG to PNG...`);

  try {
    // Rename as .jpg temporarily so Jimp reads it correctly
    const tmpPath = filePath.replace('.png', '_tmp.jpg');
    fs.copyFileSync(filePath, tmpPath);

    // Try Jimp v1 API
    let Jimp;
    try {
      ({ Jimp } = require('jimp'));
    } catch {
      Jimp = require('jimp');
    }

    let image;
    if (typeof Jimp.fromFile === 'function') {
      image = await Jimp.fromFile(tmpPath);
    } else if (typeof Jimp.read === 'function') {
      image = await Jimp.read(tmpPath);
    } else {
      throw new Error('Cannot find Jimp read method');
    }

    // Write as PNG
    if (typeof image.write === 'function') {
      await image.write(filePath);
    } else if (typeof image.writeAsync === 'function') {
      // force PNG mime type
      image.mime = 'image/png';
      await image.writeAsync(filePath);
    } else {
      throw new Error('Cannot find Jimp write method');
    }

    fs.unlinkSync(tmpPath);

    // Verify
    const newBuf = fs.readFileSync(filePath);
    const newHex = newBuf.slice(0, 4).toString('hex');
    if (newHex.startsWith('89504e47')) {
      console.log(`✅ ${filename} converted to real PNG!`);
    } else {
      console.log(`❌ ${filename} still not PNG (${newHex}), restoring original...`);
      fs.copyFileSync(tmpPath, filePath);
    }
  } catch (err) {
    console.error(`❌ Error converting ${filename}:`, err.message);
  }
}

(async () => {
  console.log('🖼️  Asset PNG Fixer\n');
  for (const file of FILES_TO_FIX) {
    await fixFile(file);
  }
  console.log('\n✅ Done!');
})();
