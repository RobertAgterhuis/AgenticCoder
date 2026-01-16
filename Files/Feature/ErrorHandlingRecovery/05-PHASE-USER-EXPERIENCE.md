# Phase 5: User Experience

**Phase ID:** F-EHR-P05  
**Feature:** ErrorHandlingRecovery  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (Escalation System)

---

## 🎯 Phase Objectives

Deze phase implementeert **User Experience** voor error handling:
- User-friendly error messages (geen stack traces)
- Actionable recovery suggestions
- Progress indication tijdens recovery
- Error dashboard en statistieken
- In-context help en troubleshooting guides

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── errors/
│   ├── presentation/
│   │   ├── ErrorPresenter.ts
│   │   ├── MessageFormatter.ts
│   │   ├── SuggestionEngine.ts
│   │   ├── ProgressReporter.ts
│   │   └── ErrorDashboard.ts
│   └── i18n/
│       └── error-messages.ts
```

---

## 🔧 Implementation Details

### 5.1 Error Messages i18n (`src/errors/i18n/error-messages.ts`)

```typescript
import { ErrorCode } from '../types/ErrorCode';

/**
 * User-friendly error message
 */
export interface UserMessage {
  title: string;
  description: string;
  suggestion?: string;
  learnMoreUrl?: string;
}

/**
 * Error message catalog
 */
export const ERROR_MESSAGES: Partial<Record<string, UserMessage>> = {
  // Transient errors (E1xxx)
  E1001: {
    title: 'Tijdelijk probleem',
    description: 'Er is een tijdelijk probleem opgetreden. Het systeem probeert automatisch opnieuw.',
    suggestion: 'Even geduld, dit lost zichzelf meestal op.',
  },
  E1002: {
    title: 'Verbinding onderbroken',
    description: 'De verbinding met de server is tijdelijk onderbroken.',
    suggestion: 'Controleer je internetverbinding en probeer opnieuw.',
  },
  E1003: {
    title: 'Service bezet',
    description: 'De service is momenteel druk bezet.',
    suggestion: 'Wacht even en probeer het later opnieuw.',
  },

  // Validation errors (E2xxx)
  E2001: {
    title: 'Validatiefout',
    description: 'De ingevoerde gegevens zijn niet geldig.',
    suggestion: 'Controleer de invoer en probeer opnieuw.',
  },
  E2002: {
    title: 'TypeScript fout',
    description: 'Er is een fout in de TypeScript code.',
    suggestion: 'Bekijk de foutdetails en corrigeer de code.',
    learnMoreUrl: 'https://www.typescriptlang.org/docs/handbook/',
  },
  E2003: {
    title: 'Bicep validatiefout',
    description: 'De Bicep template bevat fouten.',
    suggestion: 'Valideer de template met `az bicep build`.',
    learnMoreUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/',
  },
  E2004: {
    title: 'Schema fout',
    description: 'De data voldoet niet aan het verwachte schema.',
    suggestion: 'Controleer of alle verplichte velden zijn ingevuld.',
  },

  // Resource errors (E3xxx)
  E3001: {
    title: 'Bestand niet gevonden',
    description: 'Het gevraagde bestand bestaat niet.',
    suggestion: 'Controleer of het pad correct is.',
  },
  E3002: {
    title: 'Geen toegang',
    description: 'Je hebt geen toegang tot dit bestand of map.',
    suggestion: 'Vraag de beheerder om toegangsrechten.',
  },
  E3003: {
    title: 'Schijf vol',
    description: 'Er is onvoldoende schijfruimte beschikbaar.',
    suggestion: 'Maak schijfruimte vrij en probeer opnieuw.',
  },

  // Logic errors (E4xxx)
  E4001: {
    title: 'Onverwachte fout',
    description: 'Er is een onverwachte situatie opgetreden.',
    suggestion: 'Probeer opnieuw of neem contact op met support.',
  },
  E4002: {
    title: 'Ongeldige bewerking',
    description: 'Deze bewerking kan niet worden uitgevoerd in de huidige staat.',
    suggestion: 'Controleer of alle voorwaarden zijn vervuld.',
  },

  // External errors (E5xxx)
  E5001: {
    title: 'MCP Server fout',
    description: 'Er is een probleem met de MCP server.',
    suggestion: 'Controleer of de MCP server draait.',
  },
  E5002: {
    title: 'API fout',
    description: 'De externe API heeft een fout teruggegeven.',
    suggestion: 'Probeer later opnieuw of controleer je API credentials.',
  },
  E5003: {
    title: 'GitHub fout',
    description: 'Er is een probleem met GitHub.',
    suggestion: 'Controleer je GitHub token en repository toegang.',
  },
  E5004: {
    title: 'Azure fout',
    description: 'Er is een probleem met Azure.',
    suggestion: 'Controleer je Azure credentials en subscription.',
    learnMoreUrl: 'https://portal.azure.com/',
  },

  // Security errors (E6xxx)
  E6001: {
    title: 'Niet geautoriseerd',
    description: 'Je bent niet geautoriseerd voor deze actie.',
    suggestion: 'Log opnieuw in of vraag de juiste rechten aan.',
  },
  E6002: {
    title: 'Token verlopen',
    description: 'Je authenticatie token is verlopen.',
    suggestion: 'Log opnieuw in om door te gaan.',
  },

  // Critical errors (E7xxx)
  E7001: {
    title: 'Kritieke systeemfout',
    description: 'Er is een kritieke fout opgetreden.',
    suggestion: 'Neem contact op met de beheerder.',
  },

  // Configuration errors (E8xxx)
  E8001: {
    title: 'Configuratiefout',
    description: 'De configuratie is niet correct.',
    suggestion: 'Controleer de configuratiebestanden.',
  },
  E8002: {
    title: 'Ontbrekende configuratie',
    description: 'Een vereiste configuratie ontbreekt.',
    suggestion: 'Voeg de ontbrekende configuratie toe.',
  },
};

/**
 * Get user message for error code
 */
export function getUserMessage(code: string): UserMessage {
  return ERROR_MESSAGES[code] || {
    title: 'Fout opgetreden',
    description: 'Er is een onverwachte fout opgetreden.',
    suggestion: 'Probeer opnieuw of neem contact op met support.',
  };
}

/**
 * Supported languages
 */
export type SupportedLanguage = 'nl' | 'en';

/**
 * Get localized message
 */
export function getLocalizedMessage(
  code: string, 
  language: SupportedLanguage = 'nl'
): UserMessage {
  // For now, return Dutch messages
  // Can be extended with more languages
  return getUserMessage(code);
}
```

### 5.2 Message Formatter (`src/errors/presentation/MessageFormatter.ts`)

```typescript
import { ErrorContext } from '../ErrorContext';
import { ErrorSeverity } from '../types/ErrorSeverity';
import { getUserMessage, UserMessage } from '../i18n/error-messages';

/**
 * Message format options
 */
export interface FormatOptions {
  /** Include error code */
  includeCode?: boolean;
  
  /** Include timestamp */
  includeTimestamp?: boolean;
  
  /** Include technical details */
  includeTechnical?: boolean;
  
  /** Max length for description */
  maxLength?: number;
  
  /** Format style */
  style?: 'plain' | 'markdown' | 'html' | 'slack';
}

/**
 * Formatted message
 */
export interface FormattedMessage {
  title: string;
  body: string;
  severity: ErrorSeverity;
  emoji?: string;
  color?: string;
  raw: UserMessage;
}

/**
 * Message formatter
 */
export class MessageFormatter {
  private defaultOptions: FormatOptions = {
    includeCode: true,
    includeTimestamp: false,
    includeTechnical: false,
    maxLength: 500,
    style: 'plain',
  };

  /**
   * Format error for user display
   */
  format(
    errorContext: ErrorContext,
    options?: FormatOptions
  ): FormattedMessage {
    const opts = { ...this.defaultOptions, ...options };
    const userMessage = getUserMessage(errorContext.code);

    const emoji = this.getEmoji(errorContext.severity);
    const color = this.getColor(errorContext.severity);

    let body = userMessage.description;

    if (opts.includeCode) {
      body = `[${errorContext.code}] ${body}`;
    }

    if (userMessage.suggestion) {
      body += this.formatSuggestion(userMessage.suggestion, opts.style);
    }

    if (opts.includeTechnical && errorContext.technicalDetails) {
      body += this.formatTechnicalDetails(errorContext.technicalDetails, opts.style);
    }

    if (opts.maxLength && body.length > opts.maxLength) {
      body = body.substring(0, opts.maxLength - 3) + '...';
    }

    return {
      title: userMessage.title,
      body: this.applyStyle(body, opts.style),
      severity: errorContext.severity,
      emoji,
      color,
      raw: userMessage,
    };
  }

  /**
   * Format for terminal/CLI
   */
  formatForTerminal(errorContext: ErrorContext): string {
    const formatted = this.format(errorContext, { style: 'plain', includeTechnical: true });
    const emoji = formatted.emoji || '❌';
    
    return `
${emoji} ${formatted.title}
${'─'.repeat(40)}
${formatted.body}
`.trim();
  }

  /**
   * Format for Slack
   */
  formatForSlack(errorContext: ErrorContext): object {
    const formatted = this.format(errorContext, { style: 'markdown' });
    
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${formatted.emoji} ${formatted.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: formatted.body,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Code:* \`${errorContext.code}\` | *Severity:* ${errorContext.severity}`,
            },
          ],
        },
      ],
      attachments: [
        {
          color: formatted.color,
        },
      ],
    };
  }

  /**
   * Format for HTML
   */
  formatForHtml(errorContext: ErrorContext): string {
    const formatted = this.format(errorContext, { style: 'html' });
    
    return `
<div class="error-message error-${errorContext.severity}">
  <div class="error-header">
    <span class="error-emoji">${formatted.emoji}</span>
    <h3 class="error-title">${formatted.title}</h3>
  </div>
  <div class="error-body">${formatted.body}</div>
  <div class="error-meta">
    <span class="error-code">${errorContext.code}</span>
  </div>
</div>
    `.trim();
  }

  /**
   * Get emoji for severity
   */
  private getEmoji(severity: ErrorSeverity): string {
    const emojis: Record<ErrorSeverity, string> = {
      [ErrorSeverity.INFO]: 'ℹ️',
      [ErrorSeverity.WARNING]: '⚠️',
      [ErrorSeverity.ERROR]: '❌',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '🚨',
      [ErrorSeverity.FATAL]: '💀',
    };
    return emojis[severity] || '❓';
  }

  /**
   * Get color for severity
   */
  private getColor(severity: ErrorSeverity): string {
    const colors: Record<ErrorSeverity, string> = {
      [ErrorSeverity.INFO]: '#3498db',
      [ErrorSeverity.WARNING]: '#f39c12',
      [ErrorSeverity.ERROR]: '#e74c3c',
      [ErrorSeverity.HIGH]: '#c0392b',
      [ErrorSeverity.CRITICAL]: '#8e44ad',
      [ErrorSeverity.FATAL]: '#2c3e50',
    };
    return colors[severity] || '#95a5a6';
  }

  /**
   * Format suggestion
   */
  private formatSuggestion(suggestion: string, style?: string): string {
    switch (style) {
      case 'markdown':
        return `\n\n💡 *Suggestie:* ${suggestion}`;
      case 'html':
        return `<p class="suggestion">💡 <strong>Suggestie:</strong> ${suggestion}</p>`;
      case 'slack':
        return `\n\n:bulb: *Suggestie:* ${suggestion}`;
      default:
        return `\n\n💡 Suggestie: ${suggestion}`;
    }
  }

  /**
   * Format technical details
   */
  private formatTechnicalDetails(details: string, style?: string): string {
    switch (style) {
      case 'markdown':
        return `\n\n<details><summary>Technische details</summary>\n\n\`\`\`\n${details}\n\`\`\`\n</details>`;
      case 'html':
        return `<details><summary>Technische details</summary><pre>${details}</pre></details>`;
      default:
        return `\n\n---\nTechnische details:\n${details}`;
    }
  }

  /**
   * Apply style to text
   */
  private applyStyle(text: string, style?: string): string {
    return text;
  }
}

/**
 * Create message formatter
 */
export function createMessageFormatter(): MessageFormatter {
  return new MessageFormatter();
}
```

### 5.3 Suggestion Engine (`src/errors/presentation/SuggestionEngine.ts`)

```typescript
import { ErrorContext } from '../ErrorContext';
import { ErrorCategory } from '../types/ErrorCategory';
import { ErrorCode } from '../types/ErrorCode';

/**
 * Recovery suggestion
 */
export interface RecoverySuggestion {
  id: string;
  title: string;
  description: string;
  action?: SuggestionAction;
  confidence: number;
  category: 'automatic' | 'manual' | 'escalate';
}

/**
 * Suggestion action
 */
export interface SuggestionAction {
  type: 'retry' | 'configure' | 'command' | 'link' | 'escalate';
  label: string;
  payload?: unknown;
}

/**
 * Suggestion rule
 */
interface SuggestionRule {
  id: string;
  matches: (ctx: ErrorContext) => boolean;
  getSuggestions: (ctx: ErrorContext) => RecoverySuggestion[];
}

/**
 * Suggestion engine
 */
export class SuggestionEngine {
  private rules: SuggestionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize suggestion rules
   */
  private initializeRules(): void {
    // Network/connection errors
    this.addRule({
      id: 'network-retry',
      matches: (ctx) => ctx.category === ErrorCategory.TRANSIENT,
      getSuggestions: () => [
        {
          id: 'auto-retry',
          title: 'Automatisch opnieuw proberen',
          description: 'Het systeem probeert automatisch opnieuw na een korte wachttijd.',
          action: { type: 'retry', label: 'Nu opnieuw proberen' },
          confidence: 0.9,
          category: 'automatic',
        },
        {
          id: 'check-network',
          title: 'Controleer je netwerkverbinding',
          description: 'Zorg ervoor dat je een stabiele internetverbinding hebt.',
          confidence: 0.7,
          category: 'manual',
        },
      ],
    });

    // TypeScript validation errors
    this.addRule({
      id: 'typescript-fix',
      matches: (ctx) => ctx.code === 'E2002',
      getSuggestions: (ctx) => {
        const suggestions: RecoverySuggestion[] = [
          {
            id: 'view-errors',
            title: 'Bekijk TypeScript fouten',
            description: 'Open het Problems panel om alle fouten te zien.',
            action: { 
              type: 'command', 
              label: 'Open Problems', 
              payload: 'workbench.actions.view.problems' 
            },
            confidence: 0.95,
            category: 'manual',
          },
        ];

        // Add context-specific suggestions
        if (ctx.technicalDetails?.includes('Cannot find module')) {
          suggestions.push({
            id: 'install-deps',
            title: 'Installeer ontbrekende dependencies',
            description: 'Een of meer modules ontbreken. Installeer ze met npm.',
            action: { type: 'command', label: 'npm install', payload: 'npm install' },
            confidence: 0.85,
            category: 'manual',
          });
        }

        return suggestions;
      },
    });

    // Bicep validation errors
    this.addRule({
      id: 'bicep-fix',
      matches: (ctx) => ctx.code === 'E2003',
      getSuggestions: () => [
        {
          id: 'bicep-lint',
          title: 'Valideer Bicep template',
          description: 'Gebruik de Bicep linter om problemen op te sporen.',
          action: { 
            type: 'command', 
            label: 'Bicep Build', 
            payload: 'az bicep build --file ${file}' 
          },
          confidence: 0.9,
          category: 'manual',
        },
        {
          id: 'bicep-docs',
          title: 'Raadpleeg Bicep documentatie',
          description: 'Bekijk de officiële Microsoft Bicep documentatie.',
          action: { 
            type: 'link', 
            label: 'Open documentatie',
            payload: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/'
          },
          confidence: 0.7,
          category: 'manual',
        },
      ],
    });

    // File not found errors
    this.addRule({
      id: 'file-not-found',
      matches: (ctx) => ctx.code === 'E3001',
      getSuggestions: (ctx) => [
        {
          id: 'check-path',
          title: 'Controleer het bestandspad',
          description: 'Zorg ervoor dat het pad correct is gespeld.',
          confidence: 0.8,
          category: 'manual',
        },
        {
          id: 'create-file',
          title: 'Maak het bestand aan',
          description: 'Als het bestand nog niet bestaat, maak het aan.',
          action: { 
            type: 'command', 
            label: 'Create File',
            payload: 'workbench.action.files.newUntitledFile'
          },
          confidence: 0.6,
          category: 'manual',
        },
      ],
    });

    // Permission errors
    this.addRule({
      id: 'permission-denied',
      matches: (ctx) => ctx.code === 'E3002' || ctx.code === 'E6001',
      getSuggestions: () => [
        {
          id: 'check-permissions',
          title: 'Controleer je toegangsrechten',
          description: 'Vraag de beheerder om de juiste rechten.',
          confidence: 0.85,
          category: 'escalate',
        },
        {
          id: 'relogin',
          title: 'Log opnieuw in',
          description: 'Soms helpt het om opnieuw in te loggen.',
          action: { type: 'command', label: 'Sign Out & Sign In' },
          confidence: 0.6,
          category: 'manual',
        },
      ],
    });

    // MCP server errors
    this.addRule({
      id: 'mcp-error',
      matches: (ctx) => ctx.code === 'E5001',
      getSuggestions: () => [
        {
          id: 'check-mcp',
          title: 'Controleer MCP server status',
          description: 'Zorg ervoor dat de MCP server draait.',
          confidence: 0.9,
          category: 'manual',
        },
        {
          id: 'restart-mcp',
          title: 'Herstart de MCP server',
          description: 'Een herstart lost vaak MCP problemen op.',
          action: { type: 'command', label: 'Restart MCP Server' },
          confidence: 0.75,
          category: 'manual',
        },
      ],
    });

    // Configuration errors
    this.addRule({
      id: 'config-error',
      matches: (ctx) => ctx.category === ErrorCategory.CONFIGURATION,
      getSuggestions: () => [
        {
          id: 'check-config',
          title: 'Controleer de configuratie',
          description: 'Open de configuratiebestanden en controleer de instellingen.',
          action: { 
            type: 'command', 
            label: 'Open Settings',
            payload: 'workbench.action.openSettings'
          },
          confidence: 0.85,
          category: 'manual',
        },
      ],
    });

    // Critical errors - always escalate
    this.addRule({
      id: 'critical-escalate',
      matches: (ctx) => ctx.category === ErrorCategory.CRITICAL,
      getSuggestions: () => [
        {
          id: 'escalate-critical',
          title: 'Escaleer naar support',
          description: 'Dit is een kritieke fout die handmatige interventie vereist.',
          action: { type: 'escalate', label: 'Escaleer nu' },
          confidence: 1.0,
          category: 'escalate',
        },
      ],
    });
  }

  /**
   * Add suggestion rule
   */
  addRule(rule: SuggestionRule): void {
    this.rules.push(rule);
  }

  /**
   * Get suggestions for error
   */
  getSuggestions(errorContext: ErrorContext): RecoverySuggestion[] {
    const suggestions: RecoverySuggestion[] = [];

    for (const rule of this.rules) {
      if (rule.matches(errorContext)) {
        suggestions.push(...rule.getSuggestions(errorContext));
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Deduplicate by id
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  /**
   * Get top suggestion
   */
  getTopSuggestion(errorContext: ErrorContext): RecoverySuggestion | null {
    const suggestions = this.getSuggestions(errorContext);
    return suggestions.length > 0 ? suggestions[0] : null;
  }

  /**
   * Get automatic suggestions only
   */
  getAutomaticSuggestions(errorContext: ErrorContext): RecoverySuggestion[] {
    return this.getSuggestions(errorContext).filter(s => s.category === 'automatic');
  }
}

/**
 * Create suggestion engine
 */
export function createSuggestionEngine(): SuggestionEngine {
  return new SuggestionEngine();
}
```

### 5.4 Progress Reporter (`src/errors/presentation/ProgressReporter.ts`)

```typescript
import { EventEmitter } from 'events';

/**
 * Recovery step
 */
export interface RecoveryStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Recovery progress
 */
export interface RecoveryProgress {
  recoveryId: string;
  totalSteps: number;
  currentStep: number;
  steps: RecoveryStep[];
  overallProgress: number;
  status: 'preparing' | 'in-progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Progress event
 */
export type ProgressEvent = 
  | { type: 'started'; progress: RecoveryProgress }
  | { type: 'step-started'; step: RecoveryStep; progress: RecoveryProgress }
  | { type: 'step-progress'; step: RecoveryStep; progress: RecoveryProgress }
  | { type: 'step-completed'; step: RecoveryStep; progress: RecoveryProgress }
  | { type: 'step-failed'; step: RecoveryStep; progress: RecoveryProgress }
  | { type: 'completed'; progress: RecoveryProgress }
  | { type: 'failed'; progress: RecoveryProgress };

/**
 * Progress reporter
 */
export class ProgressReporter extends EventEmitter {
  private progress: RecoveryProgress | null = null;

  /**
   * Start recovery progress tracking
   */
  startRecovery(recoveryId: string, steps: Omit<RecoveryStep, 'status'>[]): RecoveryProgress {
    this.progress = {
      recoveryId,
      totalSteps: steps.length,
      currentStep: 0,
      steps: steps.map(s => ({ ...s, status: 'pending' })),
      overallProgress: 0,
      status: 'preparing',
      startedAt: new Date(),
    };

    this.emit('progress', { type: 'started', progress: this.progress });
    return this.progress;
  }

  /**
   * Start a step
   */
  startStep(stepId: string): void {
    if (!this.progress) return;

    const step = this.progress.steps.find(s => s.id === stepId);
    if (!step) return;

    step.status = 'in-progress';
    step.startedAt = new Date();
    step.progress = 0;

    this.progress.status = 'in-progress';
    this.progress.currentStep = this.progress.steps.indexOf(step);
    this.updateOverallProgress();

    this.emit('progress', { type: 'step-started', step, progress: this.progress });
  }

  /**
   * Update step progress
   */
  updateStepProgress(stepId: string, progress: number): void {
    if (!this.progress) return;

    const step = this.progress.steps.find(s => s.id === stepId);
    if (!step) return;

    step.progress = Math.min(100, Math.max(0, progress));
    this.updateOverallProgress();

    this.emit('progress', { type: 'step-progress', step, progress: this.progress });
  }

  /**
   * Complete a step
   */
  completeStep(stepId: string): void {
    if (!this.progress) return;

    const step = this.progress.steps.find(s => s.id === stepId);
    if (!step) return;

    step.status = 'completed';
    step.progress = 100;
    step.completedAt = new Date();
    this.updateOverallProgress();

    this.emit('progress', { type: 'step-completed', step, progress: this.progress });

    // Check if all done
    if (this.progress.steps.every(s => s.status === 'completed' || s.status === 'skipped')) {
      this.completeRecovery();
    }
  }

  /**
   * Fail a step
   */
  failStep(stepId: string, error: string): void {
    if (!this.progress) return;

    const step = this.progress.steps.find(s => s.id === stepId);
    if (!step) return;

    step.status = 'failed';
    step.error = error;
    step.completedAt = new Date();
    this.updateOverallProgress();

    this.emit('progress', { type: 'step-failed', step, progress: this.progress });
  }

  /**
   * Skip a step
   */
  skipStep(stepId: string): void {
    if (!this.progress) return;

    const step = this.progress.steps.find(s => s.id === stepId);
    if (!step) return;

    step.status = 'skipped';
    step.completedAt = new Date();
    this.updateOverallProgress();
  }

  /**
   * Complete recovery
   */
  completeRecovery(): void {
    if (!this.progress) return;

    this.progress.status = 'completed';
    this.progress.completedAt = new Date();
    this.progress.overallProgress = 100;

    this.emit('progress', { type: 'completed', progress: this.progress });
  }

  /**
   * Fail recovery
   */
  failRecovery(error: string): void {
    if (!this.progress) return;

    this.progress.status = 'failed';
    this.progress.completedAt = new Date();
    this.progress.error = error;

    this.emit('progress', { type: 'failed', progress: this.progress });
  }

  /**
   * Get current progress
   */
  getProgress(): RecoveryProgress | null {
    return this.progress;
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(): void {
    if (!this.progress) return;

    const completed = this.progress.steps.filter(
      s => s.status === 'completed' || s.status === 'skipped'
    ).length;

    const inProgress = this.progress.steps.find(s => s.status === 'in-progress');
    const inProgressContribution = inProgress ? (inProgress.progress || 0) / 100 : 0;

    this.progress.overallProgress = Math.round(
      ((completed + inProgressContribution) / this.progress.totalSteps) * 100
    );
  }

  /**
   * Format progress for display
   */
  formatProgress(): string {
    if (!this.progress) return 'No recovery in progress';

    const lines: string[] = [];
    lines.push(`Recovery: ${this.progress.status} (${this.progress.overallProgress}%)`);
    lines.push('');

    for (const step of this.progress.steps) {
      const icon = this.getStepIcon(step.status);
      const progress = step.progress !== undefined ? ` ${step.progress}%` : '';
      lines.push(`${icon} ${step.label}${progress}`);
      
      if (step.error) {
        lines.push(`   ⚠️ ${step.error}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get step icon
   */
  private getStepIcon(status: RecoveryStep['status']): string {
    const icons: Record<RecoveryStep['status'], string> = {
      pending: '○',
      'in-progress': '◐',
      completed: '●',
      failed: '✗',
      skipped: '⊘',
    };
    return icons[status];
  }
}

/**
 * Create progress reporter
 */
export function createProgressReporter(): ProgressReporter {
  return new ProgressReporter();
}
```

### 5.5 Error Presenter (`src/errors/presentation/ErrorPresenter.ts`)

```typescript
import { ErrorContext } from '../ErrorContext';
import { MessageFormatter, FormattedMessage } from './MessageFormatter';
import { SuggestionEngine, RecoverySuggestion } from './SuggestionEngine';
import { ProgressReporter, RecoveryProgress } from './ProgressReporter';

/**
 * Presentation context
 */
export interface PresentationContext {
  /** Where the error is shown */
  target: 'terminal' | 'ui' | 'notification' | 'log' | 'slack' | 'email';
  
  /** User preference for detail level */
  detailLevel: 'minimal' | 'normal' | 'detailed' | 'debug';
  
  /** Whether to include suggestions */
  includeSuggestions: boolean;
  
  /** Whether to include progress */
  includeProgress: boolean;
  
  /** Language preference */
  language: 'nl' | 'en';
}

/**
 * Error presentation
 */
export interface ErrorPresentation {
  message: FormattedMessage;
  suggestions: RecoverySuggestion[];
  progress?: RecoveryProgress;
  actions: PresentationAction[];
}

/**
 * Presentation action
 */
export interface PresentationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  payload?: unknown;
}

/**
 * Error presenter
 */
export class ErrorPresenter {
  private formatter: MessageFormatter;
  private suggestionEngine: SuggestionEngine;
  private progressReporter: ProgressReporter;

  constructor() {
    this.formatter = new MessageFormatter();
    this.suggestionEngine = new SuggestionEngine();
    this.progressReporter = new ProgressReporter();
  }

  /**
   * Present error to user
   */
  present(
    errorContext: ErrorContext,
    context?: Partial<PresentationContext>
  ): ErrorPresentation {
    const ctx: PresentationContext = {
      target: context?.target || 'ui',
      detailLevel: context?.detailLevel || 'normal',
      includeSuggestions: context?.includeSuggestions ?? true,
      includeProgress: context?.includeProgress ?? true,
      language: context?.language || 'nl',
    };

    // Format message
    const message = this.formatter.format(errorContext, {
      includeTechnical: ctx.detailLevel === 'detailed' || ctx.detailLevel === 'debug',
      includeCode: ctx.detailLevel !== 'minimal',
      style: this.getStyleForTarget(ctx.target),
    });

    // Get suggestions
    const suggestions = ctx.includeSuggestions
      ? this.suggestionEngine.getSuggestions(errorContext)
      : [];

    // Get progress if any
    const progress = ctx.includeProgress
      ? this.progressReporter.getProgress() || undefined
      : undefined;

    // Build actions
    const actions = this.buildActions(suggestions, errorContext);

    return { message, suggestions, progress, actions };
  }

  /**
   * Present for terminal
   */
  presentForTerminal(errorContext: ErrorContext): string {
    const presentation = this.present(errorContext, { target: 'terminal', detailLevel: 'detailed' });
    
    const lines: string[] = [];
    
    // Message
    lines.push(this.formatter.formatForTerminal(errorContext));
    
    // Suggestions
    if (presentation.suggestions.length > 0) {
      lines.push('');
      lines.push('💡 Mogelijke oplossingen:');
      presentation.suggestions.slice(0, 3).forEach((s, i) => {
        lines.push(`   ${i + 1}. ${s.title}`);
        if (s.description) {
          lines.push(`      ${s.description}`);
        }
      });
    }

    // Progress
    if (presentation.progress) {
      lines.push('');
      lines.push(this.progressReporter.formatProgress());
    }

    return lines.join('\n');
  }

  /**
   * Present for UI notification
   */
  presentForNotification(errorContext: ErrorContext): {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    actions: { label: string; action: string }[];
  } {
    const presentation = this.present(errorContext, { target: 'notification', detailLevel: 'minimal' });
    
    return {
      title: presentation.message.title,
      message: presentation.message.body,
      type: this.severityToNotificationType(errorContext.severity),
      actions: presentation.actions.slice(0, 2).map(a => ({
        label: a.label,
        action: a.action,
      })),
    };
  }

  /**
   * Get progress reporter
   */
  getProgressReporter(): ProgressReporter {
    return this.progressReporter;
  }

  /**
   * Get style for target
   */
  private getStyleForTarget(target: PresentationContext['target']): 'plain' | 'markdown' | 'html' | 'slack' {
    switch (target) {
      case 'slack':
        return 'slack';
      case 'email':
        return 'html';
      case 'terminal':
        return 'plain';
      default:
        return 'markdown';
    }
  }

  /**
   * Severity to notification type
   */
  private severityToNotificationType(severity: string): 'info' | 'warning' | 'error' {
    if (severity === 'info') return 'info';
    if (severity === 'warning') return 'warning';
    return 'error';
  }

  /**
   * Build actions from suggestions
   */
  private buildActions(
    suggestions: RecoverySuggestion[],
    errorContext: ErrorContext
  ): PresentationAction[] {
    const actions: PresentationAction[] = [];

    // Add suggestion actions
    for (const suggestion of suggestions.slice(0, 3)) {
      if (suggestion.action) {
        actions.push({
          id: suggestion.id,
          label: suggestion.action.label,
          type: suggestion.category === 'automatic' ? 'primary' : 'secondary',
          action: suggestion.action.type,
          payload: suggestion.action.payload,
        });
      }
    }

    // Always add dismiss
    actions.push({
      id: 'dismiss',
      label: 'Sluiten',
      type: 'secondary',
      action: 'dismiss',
    });

    return actions;
  }
}

/**
 * Create error presenter
 */
export function createErrorPresenter(): ErrorPresenter {
  return new ErrorPresenter();
}
```

### 5.6 Error Dashboard (`src/errors/presentation/ErrorDashboard.ts`)

```typescript
import { ErrorContext } from '../ErrorContext';
import { ErrorCategory } from '../types/ErrorCategory';
import { ErrorSeverity } from '../types/ErrorSeverity';

/**
 * Error statistics
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<string, number>;
  errorsByAgent: Record<string, number>;
  errorsOverTime: TimeSeriesData[];
  recoveryRate: number;
  avgRecoveryTime: number;
  topErrors: ErrorSummary[];
  recentErrors: ErrorSummary[];
}

/**
 * Time series data point
 */
export interface TimeSeriesData {
  timestamp: Date;
  count: number;
  recovered: number;
  failed: number;
}

/**
 * Error summary
 */
export interface ErrorSummary {
  code: string;
  message: string;
  count: number;
  lastOccurrence: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoveryRate: number;
}

/**
 * Dashboard filter
 */
export interface DashboardFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: ErrorCategory[];
  severities?: ErrorSeverity[];
  agents?: string[];
  codes?: string[];
}

/**
 * Error dashboard
 */
export class ErrorDashboard {
  private errors: Array<{
    context: ErrorContext;
    timestamp: Date;
    recovered: boolean;
    recoveryTime?: number;
  }> = [];

  /**
   * Record error
   */
  recordError(
    errorContext: ErrorContext,
    recovered: boolean = false,
    recoveryTime?: number
  ): void {
    this.errors.push({
      context: errorContext,
      timestamp: new Date(),
      recovered,
      recoveryTime,
    });

    // Prune old errors (keep last 10000)
    if (this.errors.length > 10000) {
      this.errors = this.errors.slice(-10000);
    }
  }

  /**
   * Mark error as recovered
   */
  markRecovered(errorId: string, recoveryTime: number): void {
    const error = this.errors.find(e => e.context.id === errorId);
    if (error) {
      error.recovered = true;
      error.recoveryTime = recoveryTime;
    }
  }

  /**
   * Get statistics
   */
  getStatistics(filter?: DashboardFilter): ErrorStatistics {
    const filtered = this.applyFilter(this.errors, filter);

    // Initialize counters
    const errorsByCategory = Object.values(ErrorCategory).reduce(
      (acc, cat) => ({ ...acc, [cat]: 0 }),
      {} as Record<ErrorCategory, number>
    );
    const errorsBySeverity = Object.values(ErrorSeverity).reduce(
      (acc, sev) => ({ ...acc, [sev]: 0 }),
      {} as Record<ErrorSeverity, number>
    );
    const errorsByCode: Record<string, number> = {};
    const errorsByAgent: Record<string, number> = {};

    // Count
    for (const error of filtered) {
      errorsByCategory[error.context.category]++;
      errorsBySeverity[error.context.severity]++;
      
      errorsByCode[error.context.code] = (errorsByCode[error.context.code] || 0) + 1;
      
      const agent = error.context.execution.agent || 'unknown';
      errorsByAgent[agent] = (errorsByAgent[agent] || 0) + 1;
    }

    // Calculate recovery stats
    const recoveredCount = filtered.filter(e => e.recovered).length;
    const recoveryRate = filtered.length > 0 
      ? (recoveredCount / filtered.length) * 100 
      : 0;

    const recoveryTimes = filtered
      .filter(e => e.recoveryTime !== undefined)
      .map(e => e.recoveryTime!);
    const avgRecoveryTime = recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;

    // Top errors
    const topErrors = this.getTopErrors(filtered, 5);

    // Recent errors
    const recentErrors = filtered
      .slice(-10)
      .reverse()
      .map(e => this.toSummary(e.context, filtered));

    // Time series (last 24 hours, hourly)
    const errorsOverTime = this.getTimeSeries(filtered, 24);

    return {
      totalErrors: filtered.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByCode,
      errorsByAgent,
      errorsOverTime,
      recoveryRate,
      avgRecoveryTime,
      topErrors,
      recentErrors,
    };
  }

  /**
   * Get error trends
   */
  getTrends(periodHours: number = 24): {
    increasing: ErrorSummary[];
    decreasing: ErrorSummary[];
    stable: ErrorSummary[];
  } {
    const now = Date.now();
    const halfPeriod = (periodHours * 60 * 60 * 1000) / 2;

    const firstHalf = this.errors.filter(
      e => e.timestamp.getTime() > now - periodHours * 60 * 60 * 1000 &&
           e.timestamp.getTime() <= now - halfPeriod
    );
    const secondHalf = this.errors.filter(
      e => e.timestamp.getTime() > now - halfPeriod
    );

    const firstCounts = this.countByCode(firstHalf);
    const secondCounts = this.countByCode(secondHalf);

    const allCodes = new Set([...Object.keys(firstCounts), ...Object.keys(secondCounts)]);
    
    const increasing: ErrorSummary[] = [];
    const decreasing: ErrorSummary[] = [];
    const stable: ErrorSummary[] = [];

    for (const code of allCodes) {
      const first = firstCounts[code] || 0;
      const second = secondCounts[code] || 0;
      const error = this.errors.find(e => e.context.code === code);
      
      if (!error) continue;

      const summary = this.toSummary(error.context, this.errors);
      
      if (second > first * 1.5) {
        increasing.push(summary);
      } else if (second < first * 0.5) {
        decreasing.push(summary);
      } else {
        stable.push(summary);
      }
    }

    return { increasing, decreasing, stable };
  }

  /**
   * Apply filter
   */
  private applyFilter(
    errors: typeof this.errors,
    filter?: DashboardFilter
  ): typeof this.errors {
    if (!filter) return errors;

    return errors.filter(e => {
      if (filter.startDate && e.timestamp < filter.startDate) return false;
      if (filter.endDate && e.timestamp > filter.endDate) return false;
      if (filter.categories && !filter.categories.includes(e.context.category)) return false;
      if (filter.severities && !filter.severities.includes(e.context.severity)) return false;
      if (filter.agents && !filter.agents.includes(e.context.execution.agent || '')) return false;
      if (filter.codes && !filter.codes.includes(e.context.code)) return false;
      return true;
    });
  }

  /**
   * Get top errors
   */
  private getTopErrors(
    errors: typeof this.errors,
    limit: number
  ): ErrorSummary[] {
    const counts = this.countByCode(errors);
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code]) => {
        const error = errors.find(e => e.context.code === code)!;
        return this.toSummary(error.context, errors);
      });
  }

  /**
   * Count by code
   */
  private countByCode(errors: typeof this.errors): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const error of errors) {
      counts[error.context.code] = (counts[error.context.code] || 0) + 1;
    }
    return counts;
  }

  /**
   * Convert to summary
   */
  private toSummary(
    context: ErrorContext,
    allErrors: typeof this.errors
  ): ErrorSummary {
    const matching = allErrors.filter(e => e.context.code === context.code);
    const recovered = matching.filter(e => e.recovered).length;

    return {
      code: context.code,
      message: context.message,
      count: matching.length,
      lastOccurrence: matching[matching.length - 1]?.timestamp || new Date(),
      severity: context.severity,
      category: context.category,
      recoveryRate: matching.length > 0 ? (recovered / matching.length) * 100 : 0,
    };
  }

  /**
   * Get time series
   */
  private getTimeSeries(
    errors: typeof this.errors,
    hours: number
  ): TimeSeriesData[] {
    const now = Date.now();
    const data: TimeSeriesData[] = [];

    for (let i = hours - 1; i >= 0; i--) {
      const startTime = now - (i + 1) * 60 * 60 * 1000;
      const endTime = now - i * 60 * 60 * 1000;

      const hourErrors = errors.filter(
        e => e.timestamp.getTime() > startTime && e.timestamp.getTime() <= endTime
      );

      data.push({
        timestamp: new Date(endTime),
        count: hourErrors.length,
        recovered: hourErrors.filter(e => e.recovered).length,
        failed: hourErrors.filter(e => !e.recovered).length,
      });
    }

    return data;
  }
}

/**
 * Create error dashboard
 */
export function createErrorDashboard(): ErrorDashboard {
  return new ErrorDashboard();
}
```

---

## 📋 Acceptance Criteria

- [ ] User-friendly messages displayed (no stack traces)
- [ ] Suggestions are relevant and actionable
- [ ] Progress reporting works during recovery
- [ ] Dashboard shows accurate statistics
- [ ] Multi-format output (terminal, UI, Slack)
- [ ] Error trends are calculated correctly
- [ ] i18n messages load properly

---

## 🔗 Navigation

← [04-PHASE-ESCALATION-SYSTEM.md](04-PHASE-ESCALATION-SYSTEM.md) | [00-OVERVIEW.md](00-OVERVIEW.md) →
