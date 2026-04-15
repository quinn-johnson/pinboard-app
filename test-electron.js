const electron = require('electron');
console.log('Electron:', electron);
console.log('Type:', typeof electron);
console.log('Keys:', Object.keys(electron || {}));

if (electron && electron.app) {
  console.log('SUCCESS: electron.app is available');
  electron.app.quit();
} else {
  console.log('FAILED: electron.app is NOT available');
  process.exit(1);
}
