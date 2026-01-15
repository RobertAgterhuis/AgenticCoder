# Command Interface Specification

**Version**: 1.0  
**Date**: January 13, 2026

---

## Overview

De Command Interface biedt gebruikers volledige controle over het Self-Learning systeem via eenvoudige commando's.

---

## Command Syntax

```
@applyLearning
  --dry-run              # Preview changes without applying
  --manual               # Require manual approval
  --confidence <0-1.0>   # Minimum confidence threshold
  --max-changes <n>      # Maximum changes to apply
  --timeout <seconds>    # Operation timeout
  
@revertLearning <changeId>
  --force                # Force rollback
  --verify               # Verify after rollback
  
@viewLearningLog
  --filter <pattern>     # Filter by error pattern
  --limit <n>            # Show last n changes
  --from <date>          # From date (YYYY-MM-DD)
  --to <date>            # To date (YYYY-MM-DD)
  --status <SUCCESS|FAILED|ROLLED_BACK>
  
@viewLearningStats
  --period <days>        # Statistics period
  --detailed             # Detailed metrics
  --export <format>      # Export format (JSON, CSV)
  
@disableLearning
  --temporary <minutes>  # Disable for N minutes
  --permanent            # Disable permanently
  
@enableLearning
  --resume               # Resume learning
  
@getLearningReport
  --from <date>          # Report start date
  --to <date>            # Report end date
  --format <pdf|html>    # Report format
```

---

## Command Implementations

```typescript
class LearningCommandHandler {
  private applyEngine: ApplyEngine;
  private rollbackManager: RollbackManager;
  private auditTrail: AuditTrail;
  private dashboard: Dashboard;
  
  async handleApplyLearning(options: ApplyOptions): Promise<string> {
    console.log(`[Learning] Applying learning fixes with options:`, options);
    
    if (options.dryRun) {
      // Preview mode
      return await this.previewChanges(options);
    }
    
    if (options.manual) {
      // Wait for approval
      return `Waiting for manual approval. Use @approveLearning to approve.`;
    }
    
    // Get pending errors
    const pendingErrors = await this.getPendingErrors(options.confidence);
    
    if (pendingErrors.length === 0) {
      return 'No pending errors to fix.';
    }
    
    let applied = 0;
    const results = [];
    
    for (const error of pendingErrors.slice(0, options.maxChanges || 10)) {
      try {
        // Analyze error
        const analysis = await this.analyzeError(error);
        
        // Generate fix
        const fix = await this.generateFix(analysis);
        
        // Validate
        const validation = await this.validateFix(fix);
        if (!validation.approved) {
          results.push(`REJECTED: ${error.errorId} - ${validation.recommendations[0]}`);
          continue;
        }
        
        // Apply
        const result = await this.applyEngine.apply(fix);
        applied++;
        results.push(`APPLIED: ${error.errorId} - ${fix.proposedChange.target}`);
        
      } catch (error) {
        results.push(`ERROR: ${error.errorId} - ${error.message}`);
      }
    }
    
    return `Applied ${applied} fixes:\n${results.join('\n')}`;
  }
  
  async handleRevertLearning(changeId: string, force: boolean): Promise<string> {
    console.log(`[Learning] Reverting change ${changeId}`);
    
    const result = await this.rollbackManager.requestRollback({
      changeId,
      trigger: 'manual_request',
      reason: 'User requested rollback',
      initiatedBy: 'User'
    });
    
    if (result.success) {
      return `Successfully reverted ${changeId}`;
    } else {
      return `Failed to revert ${changeId}: ${result.error}`;
    }
  }
  
  async handleViewLearningLog(filter: LogFilter): Promise<string> {
    const records = await this.auditTrail.getAuditHistory({
      from: filter.from,
      to: filter.to,
      status: filter.status
    });
    
    let output = `Learning Log (${records.length} records):\n`;
    output += '─'.repeat(80) + '\n';
    
    for (const record of records.slice(0, filter.limit || 10)) {
      output += `Change: ${record.changeId}\n`;
      output += `Status: ${record.execution.status}\n`;
      output += `Applied: ${record.execution.appliedAt || 'Pending'}\n`;
      output += `Resolved: ${record.impact.errorsResolved} errors\n`;
      output += '─'.repeat(80) + '\n';
    }
    
    return output;
  }
  
  async handleViewLearningStats(options: StatsOptions): Promise<string> {
    const dashboard = await this.dashboard.generateDashboard();
    const metrics = dashboard.currentMetrics;
    
    let output = `Learning Statistics (Last ${options.period} days):\n`;
    output += '─'.repeat(80) + '\n';
    output += `Success Rate: ${(metrics.learning.successRate * 100).toFixed(1)}%\n`;
    output += `Changes Applied: ${metrics.learning.changesApplied}\n`;
    output += `Successful: ${metrics.learning.changesSuccessful}\n`;
    output += `Failed: ${metrics.learning.changesFailed}\n`;
    output += `Rolled Back: ${metrics.learning.changesRolledBack}\n`;
    output += '─'.repeat(80) + '\n';
    output += `Errors Resolved: ${metrics.fixes.errorsResolved}\n`;
    output += `New Errors: ${metrics.fixes.newErrorsIntroduced}\n`;
    output += `Fix Effectiveness: ${(metrics.fixes.fixEffectiveness * 100).toFixed(1)}%\n`;
    output += '─'.repeat(80) + '\n';
    output += `Average Confidence: ${(metrics.confidence.averageConfidence * 100).toFixed(1)}%\n`;
    output += `Accuracy Rate: ${(metrics.confidence.accuracyRate * 100).toFixed(1)}%\n`;
    output += '─'.repeat(80) + '\n';
    output += `System Error Rate: ${(metrics.system.errorRate * 100).toFixed(2)}%\n`;
    output += `Trend: ${metrics.system.errorRateTrend}\n`;
    output += `CPU Usage: ${metrics.system.cpuUsage}%\n`;
    output += `Memory Usage: ${metrics.system.memoryUsage}MB\n`;
    
    if (options.detailed) {
      output += '─'.repeat(80) + '\n';
      output += 'Detailed Metrics:\n';
      output += JSON.stringify(metrics, null, 2);
    }
    
    return output;
  }
  
  async handleDisableLearning(options: DisableOptions): Promise<string> {
    if (options.permanent) {
      // Disable permanently
      return 'Learning disabled permanently. Use @enableLearning to resume.';
    } else {
      // Disable temporarily
      const minutes = options.temporary || 60;
      return `Learning disabled for ${minutes} minutes. Will resume automatically.`;
    }
  }
  
  async handleEnableLearning(): Promise<string> {
    return 'Learning enabled.';
  }
  
  private async previewChanges(options: ApplyOptions): Promise<string> {
    const pendingErrors = await this.getPendingErrors(options.confidence);
    let output = `Dry Run Preview (${pendingErrors.length} changes):\n`;
    
    for (const error of pendingErrors.slice(0, 3)) {
      const fix = await this.generateFix(await this.analyzeError(error));
      output += `\nWould apply: ${fix.proposedChange.target}\n`;
      output += `Confidence: ${(fix.confidence * 100).toFixed(1)}%\n`;
    }
    
    return output;
  }
  
  private async getPendingErrors(minConfidence: number = 0.5): Promise<any[]> {
    return [];
  }
  
  private async analyzeError(error: any): Promise<any> {
    return {};
  }
  
  private async generateFix(analysis: any): Promise<any> {
    return {};
  }
  
  private async validateFix(fix: any): Promise<any> {
    return { approved: true, recommendations: [] };
  }
}

interface ApplyOptions {
  dryRun?: boolean;
  manual?: boolean;
  confidence?: number;
  maxChanges?: number;
  timeout?: number;
}

interface LogFilter {
  from?: Date;
  to?: Date;
  status?: string;
  limit?: number;
  filter?: string;
}

interface StatsOptions {
  period?: number;
  detailed?: boolean;
  export?: string;
}

interface DisableOptions {
  temporary?: number;
  permanent?: boolean;
}
```

---

## Command Examples

```
# Preview changes
@applyLearning --dry-run

# Apply with manual review
@applyLearning --manual

# Apply only high-confidence fixes
@applyLearning --confidence 0.8

# View recent changes
@viewLearningLog --limit 10

# View detailed statistics
@viewLearningStats --detailed

# Revert specific change
@revertLearning chg-2026-0113-001

# Disable learning temporarily
@disableLearning --temporary 30

# View report
@getLearningReport --from 2026-01-01 --to 2026-01-13 --format pdf
```

---

**Version**: 1.0  
**Status**: Ready for Implementation
