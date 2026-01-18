/**
 * Security Bridge
 * 
 * Provides JavaScript access to TypeScript security modules
 * @module agents/bridge/security
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distPath = path.resolve(__dirname, '../../dist');

let _securityModule = null;
let _loadError = null;

/**
 * Get the security module (lazy loaded)
 * @returns {Object|null}
 */
export function getSecurityModule() {
  if (_securityModule) return _securityModule;
  if (_loadError) return null;
  
  try {
    _securityModule = require(path.join(distPath, 'security/index.js'));
    return _securityModule;
  } catch (error) {
    _loadError = error;
    console.warn('[SecurityBridge] TypeScript security module not available:', error.message);
    return null;
  }
}

/**
 * Create a SecurityGateway instance
 * @param {Object} options
 * @param {string} [options.keyVaultUrl] - Azure Key Vault URL
 * @param {string} [options.auditLogPath] - Path for audit logs
 * @param {string} [options.localSecretsPath] - Path for local secrets
 * @returns {Object}
 */
function createSecurityGateway(options = {}) {
  const mod = getSecurityModule();
  if (!mod || !mod.SecurityGateway) {
    console.warn('[SecurityBridge] SecurityGateway not available, using fallback');
    return createFallbackGateway();
  }
  
  return new mod.SecurityGateway({
    auditLogPath: options.auditLogPath || '.agentic/audit',
    keyVaultUrl: options.keyVaultUrl,
    localSecretsPath: options.localSecretsPath,
  });
}

/**
 * Create a SecurityOrchestrator instance
 * @param {Object} config - Security configuration
 * @returns {Object|null}
 */
function createSecurityOrchestrator(config) {
  const mod = getSecurityModule();
  if (!mod || !mod.createSecurityOrchestrator) {
    console.warn('[SecurityBridge] SecurityOrchestrator not available');
    return null;
  }
  
  return mod.createSecurityOrchestrator(config);
}

/**
 * Get default security configuration
 * @returns {Object}
 */
function getDefaultSecurityConfig() {
  const mod = getSecurityModule();
  if (!mod || !mod.createDefaultSecurityConfig) {
    return {
      enabled: false,
      scanning: { enabled: false },
      audit: { enabled: false },
      compliance: { enabled: false },
    };
  }
  
  return mod.createDefaultSecurityConfig();
}

/**
 * Create code generation hooks that integrate security scanning
 * @param {Object} orchestrator - SecurityOrchestrator instance
 * @returns {Object}
 */
function createCodeGenHooks(orchestrator) {
  const mod = getSecurityModule();
  if (!mod || !mod.createCodeGenHooks || !orchestrator) {
    return createFallbackHooks();
  }
  
  return mod.createCodeGenHooks(orchestrator);
}

/**
 * Get CodeSecurityScanner class
 * @returns {Function|null}
 */
function getCodeSecurityScanner() {
  const mod = getSecurityModule();
  return mod?.CodeSecurityScanner || null;
}

/**
 * Get SecretDetector class
 * @returns {Function|null}
 */
function getSecretDetector() {
  const mod = getSecurityModule();
  return mod?.SecretDetector || null;
}

/**
 * Get ComplianceChecker class
 * @returns {Function|null}
 */
function getComplianceChecker() {
  const mod = getSecurityModule();
  return mod?.ComplianceChecker || null;
}

/**
 * Get AuditLogger class
 * @returns {Function|null}
 */
function getAuditLogger() {
  const mod = getSecurityModule();
  return mod?.AuditLogger || null;
}

/**
 * Fallback gateway when TypeScript not available
 * @returns {Object}
 */
function createFallbackGateway() {
  return {
    async scanGeneratedCode(files) {
      console.warn('[SecurityBridge] Using fallback - no security scanning');
      return { summary: { passed: true, totalVulnerabilities: 0 }, results: [] };
    },
    async checkCompliance(files, frameworks) {
      console.warn('[SecurityBridge] Using fallback - no compliance checking');
      return { overallPassed: true, summary: [], results: [] };
    },
    async getSecret(name) {
      return process.env[name] || null;
    },
    async validateBeforeGeneration(content, filename) {
      return { allowed: true, issues: [] };
    },
    async auditLog(event) {
      console.log('[SecurityBridge] Audit (fallback):', event.type);
    },
  };
}

/**
 * Fallback hooks when TypeScript not available
 * @returns {Object}
 */
function createFallbackHooks() {
  return {
    async beforeGenerate(template, variables) {
      return { allowed: true, warnings: [], blockers: [] };
    },
    async afterGenerate(filePath, content) {
      return { allowed: true, warnings: [], blockers: [] };
    },
    async onComplete(files) {
      // No-op
    },
  };
}

/**
 * Check if security module is available
 * @returns {boolean}
 */
export function isAvailable() {
  return getSecurityModule() !== null;
}

/**
 * Reset cached module (useful for testing)
 */
export function reset() {
  _securityModule = null;
  _loadError = null;
}

// Export all functions
export {
  createSecurityGateway,
  createSecurityOrchestrator,
  getDefaultSecurityConfig,
  createCodeGenHooks,
  getCodeSecurityScanner,
  getSecretDetector,
  getComplianceChecker,
  getAuditLogger,
  createFallbackGateway,
  createFallbackHooks,
};

// Default export
export default {
  isAvailable,
  reset,
  getSecurityModule,
  createSecurityGateway,
  createSecurityOrchestrator,
  getDefaultSecurityConfig,
  createCodeGenHooks,
  getCodeSecurityScanner,
  getSecretDetector,
  getComplianceChecker,
  getAuditLogger,
  createFallbackGateway,
  createFallbackHooks,
};
