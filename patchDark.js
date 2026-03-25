const fs = require('fs');

let appPath = 'App.js';
let app = fs.readFileSync(appPath, 'utf8');

// Add darkColors import
app = app.replace(/import \{ colors, spacing, typography, radius, shadows \} from "\.\/styles\/theme";/, 'import { colors, darkColors, spacing, typography, radius, shadows } from "./styles/theme";');

// Inside AppContent add const tc = isDark ? darkColors : colors;
let useThemeMatch = app.match(/const \{ isDark, toggleTheme \} = useTheme\(\);/);
if (useThemeMatch && !app.includes('const tc = isDark')) {
    app = app.replace('const { isDark, toggleTheme } = useTheme();', 'const { isDark, toggleTheme } = useTheme();\n  const tc = isDark ? darkColors : colors;');
}

// Replace styles.container with [styles.container, { backgroundColor: tc.offWhite }]
app = app.replace(/style=\{styles\.container\}/g, "style={[styles.container, { backgroundColor: tc.offWhite }]}");

// Overlays and headers
app = app.replace(/backgroundColor=\{colors\.primary\}/g, "backgroundColor={tc.primary}");
app = app.replace(/style=\{styles\.header\}/g, "style={[styles.header, { backgroundColor: tc.primary }]}");

// Material card backgrounds
let materialCardPath = 'components/MaterialCard.js';
let mc = fs.readFileSync(materialCardPath, 'utf8');

mc = mc.replace(/import \{ colors, spacing, radius, typography, shadows \} from "\.\.\/styles\/theme";/, 'import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";\nimport { useTheme } from "../contexts/ThemeContext";');

if (!mc.includes('const tc = isDark')) {
    mc = mc.replace(/const \{ lang, t, isRTL \} = useLanguage\(\);/, 'const { lang, t, isRTL } = useLanguage();\n    const { isDark } = useTheme();\n    const tc = isDark ? darkColors : colors;');
}

mc = mc.replace(/style=\{\[s\.cardInner, isRTL && s\.rowRTL\]\}/g, "style={[s.cardInner, isRTL && s.rowRTL, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}");
mc = mc.replace(/style=\{\[s\.modalSheet, \{ transform: \[\{ translateY: slideAnim \}\] \}\]\}/g, "style={[s.modalSheet, { transform: [{ translateY: slideAnim }] }, { backgroundColor: tc.offWhite }]}");
mc = mc.replace(/style=\{\[s\.nameText, isRTL && s\.textRTL\]\}/g, "style={[s.nameText, isRTL && s.textRTL, { color: tc.primary }]}");

fs.writeFileSync(materialCardPath, mc, 'utf8');
fs.writeFileSync(appPath, app, 'utf8');

// Similarly for ProjectManager.js
let pmPath = 'components/ProjectManager.js';
let pm = fs.readFileSync(pmPath, 'utf8');
pm = pm.replace(/import \{ colors, spacing, radius, typography, shadows \} from "\.\.\/styles\/theme";/, 'import { colors, darkColors, spacing, radius, typography, shadows } from "../styles/theme";\nimport { useTheme } from "../contexts/ThemeContext";');
if (!pm.includes('const tc = isDark')) {
    pm = pm.replace(/const \{ t, lang, isRTL \} = useLanguage\(\);/, 'const { t, lang, isRTL } = useLanguage();\n  const { isDark } = useTheme();\n  const tc = isDark ? darkColors : colors;');
}
pm = pm.replace(/style=\{s\.container\}/g, "style={[s.container, { backgroundColor: tc.offWhite }]}");
pm = pm.replace(/style=\{s\.header\}/g, "style={[s.header, { backgroundColor: tc.primary }]}");
pm = pm.replace(/style=\{\[s\.projectCard, /g, "style={[s.projectCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }, ");

fs.writeFileSync(pmPath, pm, 'utf8');

console.log('Done injecting tc');
