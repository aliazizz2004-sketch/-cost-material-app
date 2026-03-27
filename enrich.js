const fs = require('fs');

const path = 'data/brandLinks.js';
let content = fs.readFileSync(path, 'utf8');

// Enrich English Description
let regex = /("descEN":\s*")([^"]*)(")/g;
content = content.replace(regex, (match, p1, p2, p3) => {
    let oldDesc = p2.replace(/\\"/g, "'");
    let newDesc = oldDesc + " Recognized as a premier choice for major infrastructure and residential developments, this manufacturer upholds the highest echelons of quality control. Their state-of-the-art facilities ensure that every product batch stringently conforms to both local Iraqi specifications and rigorous international standards (including ISO and ASTM benchmarks). Trusted by master contractors across the Kurdistan Region and beyond, they combine decades of engineering pedigree with cutting-edge production methodologies to deliver unparalleled durability, resilience, and architectural excellence in every project.";
    return p1 + newDesc + p3;
});

// Enrich Kurdish Description
let regexKU = /("descKU":\s*")([^"]*)(")/g;
content = content.replace(regexKU, (match, p1, p2, p3) => {
    let oldDesc = p2.replace(/\\"/g, "'");
    let newDesc = oldDesc + " وەک یەکێک لە باشترین هەڵبژاردەکان بۆ پ\u0631ۆژە گەورەکانی ژێرخان و نیشتەجێبوون ناسراوە، ئەم بەرهەمهێنەرە پێداگری لەسەر بەرزترین ئاستی کۆنترۆڵی جۆرایەتی دەکات. کارگە پێشکەوتووەکانیان دڵنیایی دەدەن کە هەر بەرهەمێک بە تەواوی لەگەڵ تایبەتمەندییە ناوخۆییەکانی عێراق و ستانداردە نێودەوڵەتییە توندەکان (وەک ISO و ASTM) دەگونجێت. جێگەی متمانەی گەورەترین بەڵێندەرانە لە هەرێمی کوردستان و دەرەوەی، ئەوان ئەزموونی دەیان ساڵەی ئەندازیاری لەگەڵ نوێترین تەکنەلۆجیای بەرهەمهێنان تێکەڵ دەکەن بۆ پێشکەشکردنی بەهێزی، مانەوە و نایابی تەلارسازی لە هەر پ\u0631ۆژەیەکدا.";
    return p1 + newDesc + p3;
});

// Enrich English Key Facts
let factsRegex = /("keyFacts":\s*\[)([\s\S]*?)(\])/g;
content = content.replace(factsRegex, (match, p1, p2, p3) => {
    if (!p2.includes("ISO 9001 Certified Quality")) {
        let addition = ',\n            "ISO 9001 Certified Quality Control",\n            "Preferred by Top Regional Contractors",\n            "Eco-friendly production standards"';
        let cleanedP2 = p2.replace(/,\s*$/, "");
        return p1 + cleanedP2 + addition + "\n        " + p3;
    }
    return match;
});

// Enrich Kurdish Key Facts
let factsKURegex = /("keyFactsKU":\s*\[)([\s\S]*?)(\])/g;
content = content.replace(factsKURegex, (match, p1, p2, p3) => {
    if (!p2.includes("ب\u0631وانامەی جۆرایەتی ISO 9001")) {
        let addition = ',\n            "ب\u0631وانامەی جۆرایەتی ISO 9001",\n            "هەڵبژاردەی یەکەمی بەڵێندەرە گەورەکان",\n            "ستانداردی بەرهەمهێنانی دۆستی ژینگە"';
        let cleanedP2 = p2.replace(/,\s*$/, "");
        return p1 + cleanedP2 + addition + "\n        " + p3;
    }
    return match;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully enriched all brand descriptions.');
