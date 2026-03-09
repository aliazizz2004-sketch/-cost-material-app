const fs = require('fs');

const file = 'c:/Users/Lenovo/Desktop/cost material/cost-material-app/data/materials.js';
let content = fs.readFileSync(file, 'utf8');

// Reliable Pexels direct CDN links that bypass all CORS/ORB problems natively
const IMG_MAP = {
    // Binding / Cement
    "Binding": "https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Structural / Steel
    "Structural": "https://images.pexels.com/photos/175051/pexels-photo-175051.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Masonry / Bloks / Bricks
    "Masonry": "https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Aggregate / Sand / Gravel
    "Aggregate": "https://images.pexels.com/photos/3482618/pexels-photo-3482618.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Concrete
    "Concrete": "https://images.pexels.com/photos/146059/pexels-photo-146059.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Finishing / Tiles / Stone
    "Finishing": "https://images.pexels.com/photos/260046/pexels-photo-260046.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Paint
    "Paint": "https://images.pexels.com/photos/196620/pexels-photo-196620.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Openings / Windows / Doors
    "Openings": "https://images.pexels.com/photos/2366838/pexels-photo-2366838.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Plumbing / Pipes
    "Plumbing": "https://images.pexels.com/photos/1350615/pexels-photo-1350615.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Electrical
    "Electrical": "https://images.pexels.com/photos/2312061/pexels-photo-2312061.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Insulation
    "Insulation": "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Roofing
    "Roofing": "https://images.pexels.com/photos/1107769/pexels-photo-1107769.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Wood
    "Wood": "https://images.pexels.com/photos/1261373/pexels-photo-1261373.jpeg?auto=compress&cs=tinysrgb&w=320",
    // Other / Generic
    "Default": "https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=320"
};

const lines = content.split('\n');
let currentCategory = "Default";
let result = [];
let replaced = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track the category of the current item being processed
    const catMatch = line.match(/categoryEN:\s*"([^"]+)"/);
    if (catMatch) {
        currentCategory = catMatch[1];
    }

    // Replace image URL with a categorized Pexels link
    if (line.includes('image: "https://')) {
        const url = IMG_MAP[currentCategory] || IMG_MAP["Default"];
        result.push(line.replace(/image:\s*"https:\/\/[^"]+"/, 'image: "' + url + '"'));
        replaced++;
    } else {
        result.push(line);
    }
}

fs.writeFileSync(file, result.join('\n'), 'utf8');
console.log('Fixed ' + replaced + ' image URLs using open Pexels category photos.');
