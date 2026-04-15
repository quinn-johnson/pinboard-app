// Test the absolute simplest electron app
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron);
console.log('Chrome version:', process.versions.chrome);

// The issue: when we require('electron'), we get the npm package's export (a string path)
// But we need the actual Electron API

// Solution: The electron API should be available through a different mechanism
// Let's check if it's in the module cache or available globally

// Check module cache
const Module = require('module');
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function(request, parent) {
  if (request === 'electron') {
    console.log('Intercepted electron require!');
    console.log('Parent:', parent.filename);
    // Try to find the actual electron module
    try {
      // When running inside Electron, the APIs should be available through internal bindings
      // Let's try to access them directly
      const binding = process._linkedBinding || process.binding;
      if (binding) {
        console.log('Binding function available');
      }
    } catch (err) {
      console.log('Binding error:', err.message);
    }
  }
  return originalResolve(request, parent);
};

const electron = require('electron');
console.log('Electron type after intercept:', typeof electron);
