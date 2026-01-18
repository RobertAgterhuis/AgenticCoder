/**
 * AgenticCoder Bridge Layer
 * 
 * Provides JavaScript access to TypeScript modules compiled in dist/
 * @module agents/bridge
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Resolve dist path relative to project root
const distPath = path.resolve(__dirname, '../../dist');

/**
 * Lazy-load a TypeScript module from dist/
 * @param {string} modulePath - Path relative to dist/
 * @returns {any|null}
 */
export function loadTSModule(modulePath) {
  try {
    const fullPath = path.join(distPath, modulePath);
    return require(fullPath);
  } catch (error) {
    console.error(`[Bridge] Failed to load ${modulePath}:`, error.message);
    return null;
  }
}

/**
 * Async lazy-load a TypeScript module
 * @param {string} modulePath - Path relative to dist/
 * @returns {Promise<any|null>}
 */
export async function loadTSModuleAsync(modulePath) {
  try {
    const fullPath = path.join(distPath, modulePath);
    return require(fullPath);
  } catch (error) {
    console.error(`[Bridge] Failed to load ${modulePath}:`, error.message);
    return null;
  }
}

/**
 * Check if TypeScript modules are available (compiled to dist/)
 * @returns {boolean}
 */
export function isTypeScriptAvailable() {
  try {
    require.resolve(path.join(distPath, 'security/index.js'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the dist path
 * @returns {string}
 */
export function getDistPath() {
  return distPath;
}

// Lazy-loaded bridge modules
let _security = null;
let _mcp = null;
let _state = null;
let _errors = null;

/**
 * Get security bridge (lazy loaded)
 * @returns {Promise<Object>}
 */
export async function getSecurity() {
  if (!_security) {
    const mod = await import('./security.js');
    _security = mod.default || mod;
  }
  return _security;
}

/**
 * Get MCP bridge (lazy loaded)
 * @returns {Promise<Object>}
 */
export async function getMCP() {
  if (!_mcp) {
    const mod = await import('./mcp.js');
    _mcp = mod.default || mod;
  }
  return _mcp;
}

/**
 * Get state bridge (lazy loaded)
 * @returns {Promise<Object>}
 */
export async function getState() {
  if (!_state) {
    const mod = await import('./state.js');
    _state = mod.default || mod;
  }
  return _state;
}

/**
 * Get errors bridge (lazy loaded)
 * @returns {Promise<Object>}
 */
export async function getErrors() {
  if (!_errors) {
    const mod = await import('./errors.js');
    _errors = mod.default || mod;
  }
  return _errors;
}

// Default export with all bridges
export default {
  loadTSModule,
  loadTSModuleAsync,
  isTypeScriptAvailable,
  getDistPath,
  getSecurity,
  getMCP,
  getState,
  getErrors,
};
