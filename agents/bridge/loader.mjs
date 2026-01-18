/**
 * Security Bridge Loader (CommonJS-compatible)
 * 
 * This loader allows CommonJS files in agents/core/ to import the ESM bridge.
 * It uses dynamic import to load the ESM bridge module.
 */

// Cached promise for loading the bridge
let bridgePromise = null;
let bridgeModule = null;

/**
 * Load the security bridge module asynchronously
 * @returns {Promise<object>} Security bridge module
 */
async function loadSecurityBridge() {
  if (bridgeModule) {
    return bridgeModule;
  }
  
  if (!bridgePromise) {
    bridgePromise = import('./security.js')
      .then(mod => {
        bridgeModule = mod.default || mod;
        return bridgeModule;
      })
      .catch(err => {
        console.warn('[BridgeLoader] Failed to load security bridge:', err.message);
        return null;
      });
  }
  
  return bridgePromise;
}

/**
 * Synchronous check if bridge is available (pre-loaded)
 * @returns {object|null} Bridge module or null
 */
function getSecurityBridgeSync() {
  return bridgeModule;
}

/**
 * Check if bridge is available
 * @returns {boolean} True if bridge has been loaded
 */
function isAvailable() {
  return bridgeModule !== null;
}

// Pre-load the bridge
loadSecurityBridge();

// Export for CommonJS compatibility
module.exports = {
  loadSecurityBridge,
  getSecurityBridgeSync,
  isAvailable
};

// Also export for ESM
export { loadSecurityBridge, getSecurityBridgeSync, isAvailable };
export default { loadSecurityBridge, getSecurityBridgeSync, isAvailable };
