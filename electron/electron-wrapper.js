// Workaround for electron module resolution issue
// When running inside Electron, the APIs should be available through internal bindings

let electronAPI;

try {
  // First, try the normal require
  const electron = require('electron');

  // Check if we got the actual API or just the path string
  if (typeof electron === 'object' && electron.app) {
    // Success - we got the API
    electronAPI = electron;
  } else {
    // We got the path string - need to find another way
    console.log('Warning: require("electron") returned:', typeof electron);

    // When running inside Electron's main process, the APIs might be available differently
    // Try accessing through process or global
    if (process && process.type === 'browser') {
      // We're in the main process, APIs should be available
      // This shouldn't happen, but let's try...
      throw new Error('Cannot access Electron APIs - require("electron") returned a string path instead of the API object');
    }
  }
} catch (error) {
  console.error('Failed to load Electron:', error.message);
  process.exit(1);
}

module.exports = electronAPI;
