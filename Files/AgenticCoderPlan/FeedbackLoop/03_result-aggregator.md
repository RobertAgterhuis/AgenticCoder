# Result Aggregator

**Component**: FLS-03  
**Purpose**: Consolidate all execution outputs into unified result package  
**Status**: Design Complete  

---

## 🎯 Overview

The Result Aggregator collects outputs from all pipeline stages and creates a unified, deduplicated result package.

Key responsibilities:
1. **Gather** results from all systems
2. **Deduplicate** artifacts
3. **Organize** outputs hierarchically
4. **Generate** consolidated reports
5. **Maintain** lineage tracking

---

## 💻 Result Structure

### Unified Result Package
```typescript
interface ExecutionResult {
  // Metadata
  execution_id: string;
  plan_id: string;
  execution_timestamp: string;
  
  // Overall status
  success: boolean;
  overall_status: 'succeeded' | 'failed' | 'partial';
  
  // Results from each stage
  stage_results: {
    task_extraction: TaskExtractionResult;
    orchestration: OrchestrationResult;
    execution_bridge: ExecutionBridgeResult;
    validation: ValidationResult;
    bicep_resolver: BicepResolverResult;
  };
  
  // Consolidated outputs
  consolidated: {
    artifacts: Artifact[];
    errors: ErrorReport[];
    warnings: WarningReport[];
    
    // Summary statistics
    summary: {
      total_tasks: number;
      completed_tasks: number;
      failed_tasks: number;
      total_duration_ms: number;
      total_cost: number;
    };
  };
  
  // Lineage tracking
  lineage: ExecutionLineage;
}

interface TaskExtractionResult {
  success: boolean;
  
  tasks_extracted: number;
  tasks_by_phase: {
    [phase_id: string]: number;
  };
  
  dependencies_resolved: number;
  circular_dependencies: number;
  
  extraction_time_ms: number;
  
  output_files: string[];
}

interface OrchestrationResult {
  success: boolean;
  
  phases: {
    [phase_id: string]: {
      phase_number: number;
      tasks_completed: number;
      tasks_failed: number;
      duration_ms: number;
      status: 'success' | 'partial' | 'failed';
    }
  };
  
  total_orchestration_time_ms: number;
  
  state_transitions: number;
  
  output_files: string[];
}

interface ExecutionBridgeResult {
  success: boolean;
  
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  
  by_transport: {
    webhook?: { count: number; success_count: number };
    process?: { count: number; success_count: number };
    docker?: { count: number; success_count: number };
    api?: { count: number; success_count: number };
  };
  
  resource_outputs: Array<{
    resource_id: string;
    resource_type: string;
    created: boolean;
    output_data: any;
  }>;
  
  total_execution_time_ms: number;
  
  output_files: string[];
}

interface ValidationResult {
  success: boolean;
  
  validations_run: number;
  validations_passed: number;
  validations_failed: number;
  
  quality_score: number;                // 0-100
  
  gate_results: {
    schema: { passed: boolean; details: string };
    syntax: { passed: boolean; details: string };
    dependency: { passed: boolean; details: string };
    security: { passed: boolean; details: string };
    testing: { passed: boolean; details: string };
  };
  
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    gate: string;
    message: string;
  }>;
  
  output_files: string[];
}

interface BicepResolverResult {
  success: boolean;
  
  templates_processed: number;
  templates_transformed: number;
  
  transformations: Array<{
    original_resource: string;
    avm_module: string;
    success: boolean;
    properties_mapped: number;
    properties_unmapped: number;
  }>;
  
  cost_impact: {
    original_cost: number;
    optimized_cost: number;
    savings: number;
  };
  
  equivalence_score: number;            // 0-100
  
  output_files: string[];
}

interface Artifact {
  // Identification
  artifact_id: string;
  artifact_type: 'bicep' | 'json' | 'report' | 'log' | 'resource' | 'output';
  
  // Source
  source_stage: string;                 // Which system created this
  source_task_id?: string;
  
  // Content
  name: string;
  path: string;
  content: string | any;
  content_type: string;                 // 'application/json', 'text/plain', etc.
  size_bytes: number;
  
  // Metadata
  created_at: string;
  depends_on?: string[];                // Other artifact IDs it depends on
  
  // Deduplication
  content_hash: string;                 // SHA256 of content
  is_duplicate: boolean;
}

interface ExecutionLineage {
  // Task execution order
  execution_order: Array<{
    task_id: string;
    task_name: string;
    status: string;
    started_at: string;
    completed_at: string;
    produced_artifacts: string[];
  }>;
  
  // Artifact dependencies
  artifact_graph: {
    [artifact_id: string]: {
      artifact_name: string;
      depends_on: string[];
      dependents: string[];
    }
  };
  
  // Error causality
  error_chain?: Array<{
    error_id: string;
    task_id: string;
    caused_by?: string;
    caused: string[];
  }>;
}
```

---

## 🔄 Result Aggregation Process

### Aggregate Results
```typescript
class ResultAggregator {
  
  async aggregateResults(
    stageResults: {
      task_extraction: TaskExtractionResult;
      orchestration: OrchestrationResult;
      execution_bridge: ExecutionBridgeResult;
      validation: ValidationResult;
      bicep_resolver: BicepResolverResult;
    }
  ): Promise<ExecutionResult> {
    
    // Collect all artifacts
    const allArtifacts = [];
    const artifactsBySource = new Map<string, Artifact[]>();
    
    for (const [stage, result] of Object.entries(stageResults)) {
      const stageArtifacts = await this.loadArtifacts(stage, result);
      allArtifacts.push(...stageArtifacts);
      artifactsBySource.set(stage, stageArtifacts);
    }
    
    // Deduplicate artifacts
    const dedupedArtifacts = this.deduplicateArtifacts(allArtifacts);
    
    // Collect errors and warnings
    const errors = this.collectErrors(stageResults);
    const warnings = this.collectWarnings(stageResults);
    
    // Build lineage
    const lineage = this.buildLineage(stageResults, dedupedArtifacts);
    
    // Create result
    const result: ExecutionResult = {
      execution_id: getExecutionId(),
      plan_id: getPlanId(),
      execution_timestamp: new Date().toISOString(),
      
      success: errors.length === 0,
      overall_status: this.determineStatus(stageResults),
      
      stage_results: stageResults,
      
      consolidated: {
        artifacts: dedupedArtifacts,
        errors,
        warnings,
        summary: this.calculateSummary(stageResults)
      },
      
      lineage
    };
    
    return result;
  }
  
  private async loadArtifacts(
    stage: string,
    result: any
  ): Promise<Artifact[]> {
    
    const artifacts: Artifact[] = [];
    
    for (const outputFile of result.output_files || []) {
      const content = await readFile(outputFile);
      const hash = hashContent(content);
      
      artifacts.push({
        artifact_id: generateId(),
        artifact_type: this.inferType(outputFile),
        source_stage: stage,
        name: getBasename(outputFile),
        path: outputFile,
        content,
        content_type: this.getContentType(outputFile),
        size_bytes: content.length,
        created_at: new Date().toISOString(),
        content_hash: hash,
        is_duplicate: false
      });
    }
    
    return artifacts;
  }
  
  private deduplicateArtifacts(artifacts: Artifact[]): Artifact[] {
    const seen = new Map<string, Artifact>();
    const deduplicated: Artifact[] = [];
    
    for (const artifact of artifacts) {
      const existing = seen.get(artifact.content_hash);
      
      if (existing) {
        // Mark as duplicate
        artifact.is_duplicate = true;
        
        // Update existing artifact's metadata
        if (!existing.depends_on) existing.depends_on = [];
        existing.depends_on.push(artifact.artifact_id);
      } else {
        // New artifact
        artifact.is_duplicate = false;
        seen.set(artifact.content_hash, artifact);
        deduplicated.push(artifact);
      }
    }
    
    return deduplicated;
  }
  
  private collectErrors(stageResults: any): ErrorReport[] {
    const errors: ErrorReport[] = [];
    
    // Collect from validation
    for (const issue of stageResults.validation.issues || []) {
      if (issue.severity === 'error') {
        errors.push({
          error_id: generateId(),
          stage: 'validation',
          severity: 'error',
          message: issue.message,
          details: issue
        });
      }
    }
    
    // Check overall success flags
    for (const [stage, result] of Object.entries(stageResults)) {
      if (!result.success) {
        errors.push({
          error_id: generateId(),
          stage,
          severity: 'error',
          message: `Stage ${stage} failed`,
          details: result
        });
      }
    }
    
    return errors;
  }
  
  private determineStatus(
    stageResults: any
  ): 'succeeded' | 'failed' | 'partial' {
    
    const stages = Object.values(stageResults) as any[];
    const allSucceeded = stages.every(s => s.success);
    const anySucceeded = stages.some(s => s.success);
    
    if (allSucceeded) return 'succeeded';
    if (anySucceeded) return 'partial';
    return 'failed';
  }
  
  private calculateSummary(stageResults: any): any {
    return {
      total_tasks: stageResults.task_extraction.tasks_extracted,
      completed_tasks: this.countCompletedTasks(stageResults),
      failed_tasks: this.countFailedTasks(stageResults),
      total_duration_ms: this.calculateTotalDuration(stageResults),
      total_cost: stageResults.bicep_resolver.cost_impact?.original_cost || 0
    };
  }
  
  private buildLineage(
    stageResults: any,
    artifacts: Artifact[]
  ): ExecutionLineage {
    
    // Build execution order from orchestration results
    const executionOrder = this.buildExecutionOrder(stageResults.orchestration);
    
    // Build artifact dependency graph
    const artifactGraph = this.buildArtifactGraph(artifacts);
    
    return {
      execution_order: executionOrder,
      artifact_graph: artifactGraph
    };
  }
}

interface ErrorReport {
  error_id: string;
  stage: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface WarningReport {
  warning_id: string;
  stage: string;
  message: string;
  details?: any;
}
```

---

## 📋 Consolidated Reports

### Generate Comprehensive Report
```typescript
function generateConsolidatedReport(
  result: ExecutionResult,
  format: 'json' | 'markdown' | 'html'
): string {
  
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  
  if (format === 'markdown') {
    let report = `# Execution Report\n\n`;
    
    report += `**Status**: ${result.overall_status.toUpperCase()}\n`;
    report += `**Timestamp**: ${result.execution_timestamp}\n`;
    report += `**Execution ID**: ${result.execution_id}\n\n`;
    
    // Summary
    report += `## Summary\n`;
    report += `- Total Tasks: ${result.consolidated.summary.total_tasks}\n`;
    report += `- Completed: ${result.consolidated.summary.completed_tasks}\n`;
    report += `- Failed: ${result.consolidated.summary.failed_tasks}\n`;
    report += `- Duration: ${(result.consolidated.summary.total_duration_ms / 1000).toFixed(1)}s\n`;
    report += `- Cost: $${result.consolidated.summary.total_cost.toFixed(2)}\n\n`;
    
    // Stage Results
    report += `## Stage Results\n\n`;
    for (const [stage, result] of Object.entries(result.stage_results)) {
      report += `### ${stage}\n`;
      report += `**Status**: ${result.success ? 'SUCCESS' : 'FAILED'}\n`;
      report += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n`;
    }
    
    // Errors
    if (result.consolidated.errors.length > 0) {
      report += `## Errors\n`;
      for (const error of result.consolidated.errors) {
        report += `- **${error.stage}**: ${error.message}\n`;
      }
      report += `\n`;
    }
    
    // Artifacts
    report += `## Artifacts (${result.consolidated.artifacts.length})\n`;
    for (const artifact of result.consolidated.artifacts) {
      report += `- ${artifact.name} (${artifact.artifact_type}, ${artifact.size_bytes} bytes)\n`;
    }
    
    return report;
  }
  
  return '';
}
```

---

## 🔍 Artifact Analysis

### Analyze Artifacts
```typescript
function analyzeArtifacts(artifacts: Artifact[]): {
  total_count: number;
  by_type: { [type: string]: number };
  total_size_bytes: number;
  duplicates: Artifact[];
  orphans: Artifact[];
} {
  
  const analysis = {
    total_count: artifacts.length,
    by_type: {} as { [type: string]: number },
    total_size_bytes: 0,
    duplicates: [] as Artifact[],
    orphans: [] as Artifact[]
  };
  
  for (const artifact of artifacts) {
    // Count by type
    if (!analysis.by_type[artifact.artifact_type]) {
      analysis.by_type[artifact.artifact_type] = 0;
    }
    analysis.by_type[artifact.artifact_type]++;
    
    // Total size
    analysis.total_size_bytes += artifact.size_bytes;
    
    // Find duplicates
    if (artifact.is_duplicate) {
      analysis.duplicates.push(artifact);
    }
    
    // Find orphans (no dependents)
    if (!artifact.depends_on || artifact.depends_on.length === 0) {
      analysis.orphans.push(artifact);
    }
  }
  
  return analysis;
}
```

---

## 💾 Result Storage

### Save Consolidated Result
```typescript
async function saveConsolidatedResult(
  result: ExecutionResult,
  directory: string
): Promise<void> {
  
  // Save main result file
  await writeFile(
    `${directory}/execution-result.json`,
    JSON.stringify(result, null, 2)
  );
  
  // Save markdown report
  const markdown = generateConsolidatedReport(result, 'markdown');
  await writeFile(
    `${directory}/REPORT.md`,
    markdown
  );
  
  // Save artifacts
  for (const artifact of result.consolidated.artifacts) {
    const filename = artifact.path.split('/').pop()!;
    const content = typeof artifact.content === 'string'
      ? artifact.content
      : JSON.stringify(artifact.content, null, 2);
    
    await writeFile(
      `${directory}/artifacts/${filename}`,
      content
    );
  }
  
  // Save lineage diagram
  const lineageDiagram = generateLineageDiagram(result.lineage);
  await writeFile(
    `${directory}/LINEAGE.md`,
    lineageDiagram
  );
}
```

---

## 💡 Key Points

1. **Unified Package**: Single result containing all outputs
2. **Deduplication**: Eliminates duplicate artifacts intelligently
3. **Lineage Tracking**: Complete execution history and dependencies
4. **Error Consolidation**: All errors collected in one place
5. **Multiple Formats**: JSON, Markdown, HTML reports
6. **Artifact Analysis**: Insights into outputs and dependencies
7. **Storage**: Organized, searchable result directory

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
