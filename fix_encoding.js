const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Get the file content directly from git into a Buffer to preserve encoding safely
  const buffer = execSync('git show 85c1d4a:data/materials.js');
  
  // Convert buffer to string assuming utf8
  let content = buffer.toString('utf8');
  
  // Replace the weserv proxy links with direct wikimedia links
  content = content.replace(/https:\/\/images\.weserv\.nl\/\?url=([^&"']+)[^"']*/g, (match, url) => {
      // Decode URL if necessary, but simply prepending https:// works as it was upload.wikimedia...
      return 'https://' + url;
  });
  
  // Write back cleanly
  fs.writeFileSync('data/materials.js', content, 'utf8');
  console.log('Successfully restored materials.js with correct UTF-8 encoding');
} catch (e) {
  console.error("Error doing git show:", e);
}
