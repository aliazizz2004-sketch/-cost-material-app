const fs = require('fs');
try {
    const content = fs.readFileSync('c:/Users/Lenovo/Desktop/cost material/cost-material-app/expo_tunnel.log', 'utf16le');
    console.log(content);
} catch (e) {
    console.error(e);
}
