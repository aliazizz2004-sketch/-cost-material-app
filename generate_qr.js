const fs = require('fs');
const QRCode = require('qrcode');

const url = `exp://7_j1em0-ali01111-8081.exp.direct`;

console.log('Generating QR code for:', url);

// Generate image
QRCode.toFile('C:/Users/Lenovo/.gemini/antigravity/brain/8def2082-3bd7-431b-9048-40483ddf1b93/expo_qr.png', url, {
  color: {
    dark: '#000000',  // Blue dots
    light: '#FFFFFF' // Transparent background
  }
}, function (err) {
  if (err) throw err;
  console.log('done');
});
