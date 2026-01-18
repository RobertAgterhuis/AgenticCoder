/**
 * Security Integration Module
 * @module security/integration
 * 
 * Provides integration hooks for:
 * - Code generation workflow
 * - Pre/post generation security checks
 * - Audit logging callbacks
 * - MCP security server bridge
 */

export {
  CodeGenHooks,
  SecurityGateDecision,
  createCodeGenHooks,
} from './CodeGenIntegration';

export {
  MCPSecurityBridge,
  MCPSecurityBridgeConfig,
  SecretScanResult,
  NormalizedCodeScanResult,
  NormalizedDepScanResult,
  FullScanResult,
  createMCPSecurityBridge,
} from './MCPIntegration';
