console.log('Running in Electron:', process.versions.electron);

// Try to access electron APIs through process.electronBinding
if (typeof process.electronBinding === 'function') {
  console.log('electronBinding is available');
  try {
    const app = process.electronBinding('app');
    console.log('Got app:', app);
  } catch (err) {
    console.log('electronBinding error:', err.message);
  }
}

// Try accessing through global
if (typeof global._linkedBinding === 'function') {
  console.log('_linkedBinding is available');
}

// Check what's available on process
console.log('process keys:', Object.keys(process).filter(k => k.includes('electron') || k.includes('Electron')));

// The correct way - check module paths
console.log('Module paths:', require.main.paths);

// Try to manually construct the path to electron
const path = require('path');
const electronModulePath = path.join(__dirname, 'node_modules', 'electron', 'electron.js');
console.log('Looking for electron.js:', electronModulePath);
const fs = require('fs');
console.log('electron.js exists:', fs.existsSync(electronModulePath));

// List files in electron module
const electronDir = path.join(__dirname, 'node_modules', 'electron');
console.log('Files in electron dir:', fs.readdirSync(electronDir).slice(0, 15));
