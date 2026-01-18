/**
 * Code Generation Security Integration
 * @module security/integration/CodeGenIntegration
 * 
 * Provides security hooks for code generation workflow:
 * - Pre-generation checks (template variable validation)
 * - Post-generation validation (secret detection, dangerous patterns)
 * - Completion callbacks (audit logging)
 */

import { SecurityOrchestrator } from '../SecurityOrchestrator';
import { SecretDetector } from '../secrets/detection/SecretDetector';

/**
 * Security gate decision
 */
export interface SecurityGateDecision {
  /** Whether the operation is allowed to proceed */
  allowed: boolean;
  /** Reason if blocked */
  reason?: string;
  /** Non-blocking warnings */
  warnings: string[];
  /** Blocking issues */
  blockers: string[];
}

/**
 * Code generation hooks interface
 */
export interface CodeGenHooks {
  /**
   * Called before code generation starts
   */
  beforeGenerate: (
    template: string,
    variables: Record<string, unknown>
  ) => Promise<SecurityGateDecision>;

  /**
   * Called after each file is generated
   */
  afterGenerate: (
    filePath: string,
    content: string
  ) => Promise<SecurityGateDecision>;

  /**
   * Called when generation is complete
   */
  onComplete: (files: string[]) => Promise<void>;
}

/**
 * Dangerous patterns to check in generated code
 */
const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/g, name: 'eval() usage' },
  { pattern: /innerHTML\s*=/g, name: 'innerHTML assignment' },
  { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML' },
  { pattern: /exec\s*\(/g, name: 'exec() usage' },
  { pattern: /child_process/g, name: 'child_process import' },
  { pattern: /new\s+Function\s*\(/g, name: 'new Function() usage' },
  { pattern: /__proto__/g, name: '__proto__ access' },
  { pattern: /document\.write/g, name: 'document.write usage' },
];

/**
 * Create code generation security hooks
 * 
 * @example
 * ```typescript
 * const orchestrator = createSecurityOrchestrator(config);
 * await orchestrator.initialize();
 * 
 * const hooks = createCodeGenHooks(orchestrator);
 * 
 * // Before generating
 * const decision = await hooks.beforeGenerate(template, variables);
 * if (!decision.allowed) {
 *   throw new Error(`Blocked: ${decision.blockers.join(', ')}`);
 * }
 * 
 * // After generating each file
 * const validation = await hooks.afterGenerate(filePath, content);
 * if (!validation.allowed) {
 *   throw new Error(`Validation failed: ${validation.blockers.join(', ')}`);
 * }
 * 
 * // On completion
 * await hooks.onComplete(generatedFiles);
 * ```
 */
export function createCodeGenHooks(orchestrator: SecurityOrchestrator): CodeGenHooks {
  const secretDetector = new SecretDetector();

  return {
    /**
     * Pre-generation security check
     */
    async beforeGenerate(
      template: string,
      variables: Record<string, unknown>
    ): Promise<SecurityGateDecision> {
      const warnings: string[] = [];
      const blockers: string[] = [];

      // Check for secrets in template variables
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'string') {
          const detection = secretDetector.detect(value);
          
          if (detection.found) {
            if (detection.severity === 'critical' || detection.severity === 'high') {
              blockers.push(`Potential secret in variable "${key}": ${detection.matches[0]?.type}`);
            } else {
              warnings.push(`Variable "${key}" might contain sensitive data`);
            }
          }
        }
      }

      // Log the check
      try {
        const auditLogger = orchestrator.getAuditLogger();
        await auditLogger.log({
          eventType: 'security_scan',
          actor: { type: 'system', id: 'codegen-hooks' },
          action: 'pre_generation_check',
          resource: template,
          details: { 
            variableCount: Object.keys(variables).length,
            warnings: warnings.length,
            blockers: blockers.length,
          },
          result: blockers.length === 0 ? 'success' : 'blocked',
        });
      } catch {
        // Audit logger might not be configured
      }

      return {
        allowed: blockers.length === 0,
        reason: blockers.length > 0 ? 'Security policy violation' : undefined,
        warnings,
        blockers,
      };
    },

    /**
     * Post-generation file validation
     */
    async afterGenerate(
      filePath: string,
      content: string
    ): Promise<SecurityGateDecision> {
      const warnings: string[] = [];
      const blockers: string[] = [];

      // Detect secrets in generated content
      const detection = secretDetector.detect(content);
      if (detection.found) {
        for (const match of detection.matches) {
          if (match.severity === 'critical') {
            blockers.push(`${match.type} found in generated file: ${filePath}`);
          } else {
            warnings.push(`Potential ${match.type} in ${filePath} at line ${match.line}`);
          }
        }
      }

      // Check for dangerous patterns
      for (const { pattern, name } of DANGEROUS_PATTERNS) {
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0;
        if (pattern.test(content)) {
          warnings.push(`Potentially dangerous pattern (${name}) in: ${filePath}`);
        }
      }

      // Log the check
      try {
        const auditLogger = orchestrator.getAuditLogger();
        await auditLogger.log({
          eventType: 'code_generation',
          actor: { type: 'system', id: 'codegen-hooks' },
          action: 'post_generation_check',
          resource: filePath,
          details: {
            contentLength: content.length,
            warnings: warnings.length,
            blockers: blockers.length,
          },
          result: blockers.length === 0 ? 'success' : 'blocked',
        });
      } catch {
        // Audit logger might not be configured
      }

      return {
        allowed: blockers.length === 0,
        reason: blockers.length > 0 ? 'Security violations in generated code' : undefined,
        warnings,
        blockers,
      };
    },

    /**
     * Generation completion callback
     */
    async onComplete(files: string[]): Promise<void> {
      try {
        const auditLogger = orchestrator.getAuditLogger();
        await auditLogger.log({
          eventType: 'code_generation',
          actor: { type: 'system', id: 'codegen-hooks' },
          action: 'generation_complete',
          resource: `batch:${files.length}`,
          details: {
            filesGenerated: files.length,
            files: files.slice(0, 10), // Log first 10 files
          },
          result: 'success',
        });
      } catch {
        // Audit logger might not be configured
      }
    },
  };
}

export default createCodeGenHooks;
