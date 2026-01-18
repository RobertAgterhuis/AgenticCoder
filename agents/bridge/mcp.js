/**
 * MCP Module Bridge
 * Provides lazy-loaded access to MCP (Model Context Protocol) infrastructure
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
let mcpModule = null;

/**
 * Gets the full MCP module from TypeScript distribution
 * @returns {object} MCP module exports
 */
export function getMCPModule() {
  if (!mcpModule) {
    try {
      mcpModule = require(path.join(distPath, 'mcp/index.js'));
    } catch (error) {
      console.error('[Bridge] Failed to load MCP module:', error.message);
      throw error;
    }
  }
  return mcpModule;
}

/**
 * Creates MCP infrastructure with default configuration
 * @param {object} config - Configuration options
 * @returns {object} MCP infrastructure instance
 */
export function createMCPInfrastructure(config = {}) {
  const mcp = getMCPModule();
  if (mcp.createMCPInfrastructure) {
    return mcp.createMCPInfrastructure(config);
  }
  throw new Error('createMCPInfrastructure not available in MCP module');
}

/**
 * Gets MCP client manager for managing client connections
 * @returns {object} MCP client manager
 */
export function getMCPClientManager() {
  const mcp = getMCPModule();
  if (mcp.MCPClientManager) {
    return mcp.MCPClientManager;
  }
  throw new Error('MCPClientManager not available in MCP module');
}

/**
 * Gets server adapters for MCP protocol
 * @returns {object} Server adapters
 */
export function getServerAdapters() {
  const mcp = getMCPModule();
  if (mcp.ServerAdapters || mcp.adapters) {
    return mcp.ServerAdapters || mcp.adapters;
  }
  throw new Error('Server adapters not available in MCP module');
}

/**
 * Gets transport layer utilities
 * @returns {object} Transport utilities
 */
export function getTransport() {
  const mcp = getMCPModule();
  return mcp.transport || mcp.Transport || {};
}

/**
 * Gets MCP health monitoring utilities
 * @returns {object} Health module
 */
export function getHealth() {
  const mcp = getMCPModule();
  return mcp.health || mcp.Health || {};
}

/**
 * Gets MCP core utilities
 * @returns {object} Core module
 */
export function getCore() {
  const mcp = getMCPModule();
  return mcp.core || mcp.Core || mcp;
}

/**
 * Checks if MCP module is available
 * @returns {boolean} True if MCP module can be loaded
 */
export function isAvailable() {
  try {
    getMCPModule();
    return true;
  } catch {
    return false;
  }
}

export default {
  getMCPModule,
  createMCPInfrastructure,
  getMCPClientManager,
  getServerAdapters,
  getTransport,
  getHealth,
  getCore,
  isAvailable
};
