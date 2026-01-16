/**
 * Security MCP Server Adapters
 * @module mcp/servers/security
 */

export { GitGuardianAdapter, createGitGuardianAdapter } from './GitGuardianAdapter';
export type { GitGuardianAdapterConfig, SecretFinding, ScanResult } from './GitGuardianAdapter';

export { BoostSecurityAdapter, createBoostSecurityAdapter } from './BoostSecurityAdapter';
export type { BoostSecurityAdapterConfig, VulnerabilityFinding, SASTResult } from './BoostSecurityAdapter';

export { SafeDepAdapter, createSafeDepAdapter } from './SafeDepAdapter';
export type { SafeDepAdapterConfig, DependencyVulnerability, DependencyInfo, DependencyAnalysisResult } from './SafeDepAdapter';
