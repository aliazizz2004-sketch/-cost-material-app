const fs = require('fs');

function convertStyles(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // First, verify 'useTheme' and 'tc' are already imported/used inside the component,
    // if not, add them (SupplierDirectory and App.js might need them).
    if (!content.includes('const tc =')) {
        if (!content.includes('useTheme')) {
            content = content.replace(/(import .* from ['"]react-native['"];)/, "\nimport { useTheme } from '../contexts/ThemeContext';");
            content = content.replace(/import \{ colors, /g, 'import { colors, darkColors, ');
        }
    }
    
    // Convert const styles = StyleSheet.create to const getStyles = (colors) => StyleSheet.create
    let styleMatch = content.match(/const styles? = StyleSheet\.create\(\{/);
    if (!styleMatch) return; // No styles found

    content = content.replace(/const (styles?) = StyleSheet\.create\(\{/, "const getStyles = (colors) => StyleSheet.create({");
    
    // Replace standalone colors. with the dynamic argument colors.
    // It's already colors., so it automatically maps if the parameter is colors!
    
    // Now inject the hook inside the component
    // We need to find the component declaration. Like export default function MaterialCard
    let funcMatch = content.match(/function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
    if (!funcMatch) {
       // Look for export default function
       funcMatch = content.match(/export default function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
    }
    
    if (funcMatch) {
        let insertPos = funcMatch.index + funcMatch[0].length;
        let before = content.substring(0, insertPos);
        let after = content.substring(insertPos);
        
        let hookCode = \n    const { isDark } = useTheme();\n    const tc = isDark ? darkColors : colors;\n    const styles = React.useMemo(() => getStyles(tc), [tc]);;
        
        // Only inject if it doesn't already have it
        if (!after.substring(0, 200).includes('getStyles(tc)')) {
            content = before + hookCode + after;
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
}

['components/MaterialCard.js', 'components/ProjectManager.js', 'components/SupplierDirectory.js', 'App.js'].forEach(p => {
    try {
        convertStyles(p);
        console.log("Converted " + p);
    } catch(e) {
        console.log("Failed " + p, e.message);
    }
});
