// Test if we're running in electron
console.log('process.versions.electron:', process.versions.electron);
console.log('process.type:', process.type);

// Try different ways to get electron
try {
  // Method 1: Direct require
  delete require.cache[require.resolve('electron')];
  const electron1 = require('electron');
  console.log('Method 1 (direct require):', typeof electron1);

  // Method 2: Resolve from electron module
  const electronPath = require.resolve('electron');
  console.log('Electron resolve path:', electronPath);

  // Method 3: Check if running in main process
  if (process.type === 'browser') {
    console.log('Running in Electron main process');
    // In main process, electron APIs should be available
    const { app } = require('electron');
    if (app) {
      console.log('SUCCESS - app is available!');
      app.quit();
    }
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
