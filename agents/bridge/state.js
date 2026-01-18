/**
 * State Management Bridge
 * Provides lazy-loaded access to state management utilities
 * from TypeScript compiled modules.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distPath = path.resolve(__dirname, '../../dist');

// Cached module reference
let stateModule = null;

/**
 * Gets the state management module from TypeScript distribution
 * @returns {object} State module exports
 */
export function getStateModule() {
  if (!stateModule) {
    try {
      // Try multiple possible locations
      const possiblePaths = [
        path.join(distPath, 'state/index.js'),
        path.join(distPath, 'core/state.js'),
        path.join(distPath, 'orchestration/state.js')
      ];
      
      for (const modulePath of possiblePaths) {
        try {
          stateModule = require(modulePath);
          break;
        } catch {
          continue;
        }
      }
      
      if (!stateModule) {
        throw new Error('State module not found in any expected location');
      }
    } catch (error) {
      console.error('[Bridge] Failed to load state module:', error.message);
      throw error;
    }
  }
  return stateModule;
}

/**
 * Creates a state manager instance
 * @param {object} config - Configuration options
 * @returns {object} State manager instance
 */
export function createStateManager(config = {}) {
  const state = getStateModule();
  if (state.createStateManager) {
    return state.createStateManager(config);
  }
  if (state.StateManager) {
    return new state.StateManager(config);
  }
  throw new Error('State manager creation not available');
}

/**
 * Creates an artifact manager for tracking generated artifacts
 * @param {object} config - Configuration options
 * @returns {object} Artifact manager instance
 */
export function createArtifactManager(config = {}) {
  const state = getStateModule();
  if (state.createArtifactManager) {
    return state.createArtifactManager(config);
  }
  if (state.ArtifactManager) {
    return new state.ArtifactManager(config);
  }
  // Return a mock artifact manager if not available
  return {
    track: () => {},
    get: () => null,
    list: () => [],
    clear: () => {}
  };
}

/**
 * Creates a checkpoint manager for state snapshots
 * @param {object} config - Configuration options
 * @returns {object} Checkpoint manager instance
 */
export function createCheckpointManager(config = {}) {
  const state = getStateModule();
  if (state.createCheckpointManager) {
    return state.createCheckpointManager(config);
  }
  if (state.CheckpointManager) {
    return new state.CheckpointManager(config);
  }
  // Return a mock checkpoint manager if not available
  return {
    save: () => ({ id: Date.now().toString() }),
    restore: () => ({}),
    list: () => [],
    delete: () => true
  };
}

/**
 * Gets state persistence utilities
 * @returns {object} Persistence utilities
 */
export function getPersistence() {
  const state = getStateModule();
  return state.persistence || state.Persistence || {};
}

/**
 * Gets state serialization utilities
 * @returns {object} Serialization utilities
 */
export function getSerialization() {
  const state = getStateModule();
  return state.serialization || state.Serialization || {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  };
}

/**
 * Checks if state module is available
 * @returns {boolean} True if state module can be loaded
 */
export function isAvailable() {
  try {
    getStateModule();
    return true;
  } catch {
    return false;
  }
}

export default {
  getStateModule,
  createStateManager,
  createArtifactManager,
  createCheckpointManager,
  getPersistence,
  getSerialization,
  isAvailable
};
