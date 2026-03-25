const fs = require('fs');

let path = 'App.js';
let app = fs.readFileSync(path, 'utf8');

// The blocks in Home View
app = app.replace(/<Text style=\{\[styles\.statLabel, isRTL && styles\.textRTL\]\}>/g, "<Text style={[styles.statLabel, isRTL && styles.textRTL, { color: tc.mediumGray }]}>");
app = app.replace(/<Text style=\{styles\.statValue\}>/g, "<Text style={[styles.statValue, { color: tc.primary }]}>");
app = app.replace(/style=\{styles\.statCard\}/g, "style={[styles.statCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}");
app = app.replace(/<Text style=\{\[styles\.sectionTitle, isRTL && styles\.textRTL\]\}>/g, "<Text style={[styles.sectionTitle, isRTL && styles.textRTL, { color: tc.primary }]}>");

// Replace gridCard backgrounds
app = app.replace(/style=\{styles\.gridCard\}/g, "style={[styles.gridCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}");
app = app.replace(/style=\{styles\.cardIconWrap\}/g, "style={[styles.cardIconWrap, { backgroundColor: tc.offWhite }]}");

// Overwrite titles / descs
app = app.replace(/<Text style=\{\[styles\.cardTitle, isRTL && styles\.textRTL\]\}>/g, "<Text style={[styles.cardTitle, isRTL && styles.textRTL, { color: tc.primary }]}>");
app = app.replace(/<Text style=\{\[styles\.cardDesc, isRTL && styles\.textRTL\]\}>/g, "<Text style={[styles.cardDesc, isRTL && styles.textRTL, { color: tc.mediumGray }]}>");

fs.writeFileSync(path, app, 'utf8');
console.log('App.js patched texts for dark mode.');
