import fs from 'fs';

const genericImages = {
  metal: "https://images.unsplash.com/photo-1533036839356-9ac7f2d4499d?w=500&q=80",
  wood: "https://images.unsplash.com/photo-1510344498361-b5413efb07ca?w=500&q=80",
  pipe: "https://images.unsplash.com/photo-1621252178007-8e6ded5b4819?w=500&q=80",
  wire: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?w=500&q=80",
  tile: "https://images.unsplash.com/photo-1523413555809-0fb1d4edaf49?w=500&q=80",
  concrete: "https://images.unsplash.com/photo-1590240974836-586bc114948a?w=500&q=80",
  insulation: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&q=80",
  brick: "https://images.unsplash.com/photo-1504307651254-35680f356bfb?w=500&q=80",
  general: "https://images.unsplash.com/photo-1541888085994-b2586dbba27f?w=500&q=80"
};

let content = fs.readFileSync('data/materials.js', 'utf8');

// The regex will look for an object block, find the name and image URL.
// We'll replace the image string with a new one.

let newContent = content.replace(/nameEN:\s*["']([^"']+)["'][^}]*?image:\s*"([^"]+)"/g, (match, nameEN, imgUrl) => {
  if (imgUrl.includes('weserv')) {
    const lower = nameEN.toLowerCase();
    let selected = genericImages.general;
    if (lower.includes('steel') || lower.includes('metal') || lower.includes('mesh')) selected = genericImages.metal;
    else if (lower.includes('wood') || lower.includes('laminate')) selected = genericImages.wood;
    else if (lower.includes('pipe') || lower.includes('tank')) selected = genericImages.pipe;
    else if (lower.includes('wire') || lower.includes('cable') || lower.includes('electric')) selected = genericImages.wire;
    else if (lower.includes('tile') || lower.includes('mosaic') || lower.includes('ceramic')) selected = genericImages.tile;
    else if (lower.includes('concrete') || lower.includes('screed') || lower.includes('cement')) selected = genericImages.concrete;
    else if (lower.includes('insulation') || lower.includes('gypsum') || lower.includes('wool')) selected = genericImages.insulation;
    else if (lower.includes('brick') || lower.includes('paving')) selected = genericImages.brick;
    
    return match.replace(imgUrl, selected);
  }
  return match;
});

fs.writeFileSync('data/materials.js', newContent, 'utf8');
console.log('Fixed URLs replaced successfully.');
