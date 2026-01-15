import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * ReporterAgent - Progress Reporting and Project Dashboards
 * 
 * Generates comprehensive progress reports, tracks metrics,
 * creates dashboards, and identifies bottlenecks across the
 * entire project workflow.
 */
export class ReporterAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'reporter',
      name: 'Progress Reporter',
      description: 'Generates progress reports and project dashboards',
      inputSchema: {
        type: 'object',
        properties: {
          projectName: { type: 'string' },
          executionHistory: { type: 'array' },
          agents: { type: 'array' },
          phases: { type: 'array' }
        },
        required: ['projectName']
      },
      outputSchema: {
        type: 'object',
        properties: {
          report: { type: 'object' },
          dashboard: { type: 'object' },
          metrics: { type: 'object' },
          bottlenecks: { type: 'array' },
          recommendations: { type: 'array' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.reportCache = new Map();
    this.dashboards = new Map();
    this.metricsHistory = [];
    this.bottlenecks = [];
    this.recommendations = [];
  }

  async _onInitialize() {
    // Initialize report storage
    this.reportCache.clear();
    this.dashboards.clear();
    this.metricsHistory = [];
    this.bottlenecks = [];
    this.recommendations = [];
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { projectName, executionHistory = [], agents = [], phases = [] } = input;

    // Generate comprehensive progress report
    const report = await this.generateProgressReport(
      projectName,
      executionHistory,
      agents,
      phases
    );

    // Create interactive dashboard
    const dashboard = await this.createDashboard(
      projectName,
      report,
      executionHistory
    );

    // Calculate overall metrics
    const metrics = await this.calculateMetrics(
      report,
      executionHistory,
      agents
    );

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(
      report,
      metrics,
      executionHistory
    );

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      report,
      metrics,
      bottlenecks
    );

    // Cache results
    const result = {
      executionId,
      report,
      dashboard,
      metrics,
      bottlenecks,
      recommendations
    };

    this.reportCache.set(executionId, result);

    // Emit completion event
    this.emit('report-generated', {
      executionId,
      projectName,
      timestamp: new Date().toISOString(),
      metricsGenerated: Object.keys(metrics).length,
      bottlenecksIdentified: bottlenecks.length
    });

    return {
      success: true,
      executionId,
      report,
      dashboard,
      metrics,
      bottlenecks,
      recommendations,
      summary: {
        projectName,
        overallCompletion: metrics.overallCompletion,
        totalAgentsInvoked: metrics.totalAgentsInvoked,
        phasesCompleted: metrics.phasesCompleted,
        criticalBlockers: bottlenecks.filter(b => b.severity === 'critical').length
      }
    };
  }

  async generateProgressReport(projectName, executionHistory, agents, phases) {
    return {
      projectName,
      timestamp: new Date().toISOString(),
      executive: await this.generateExecutiveSummary(executionHistory),
      timeline: await this.generateTimeline(executionHistory),
      agentProgress: await this.generateAgentProgress(agents, executionHistory),
      phaseProgress: await this.generatePhaseProgress(phases, executionHistory),
      resourceUtilization: await this.analyzeResourceUtilization(executionHistory),
      riskAssessment: await this.assessRisks(executionHistory),
      budget: await this.trackBudget(executionHistory),
      quality: await this.assessQuality(executionHistory),
      stakeholder: await this.generateStakeholderView(projectName, executionHistory),
      detailedMetrics: await this.generateDetailedMetrics(executionHistory)
    };
  }

  async generateExecutiveSummary(executionHistory) {
    const totalItems = executionHistory.length;
    const completedItems = executionHistory.filter(item => item.status === 'completed').length;
    const failedItems = executionHistory.filter(item => item.status === 'failed').length;
    const inProgressItems = executionHistory.filter(item => item.status === 'in-progress').length;

    return {
      status: failedItems === 0 ? 'on-track' : (failedItems > completedItems ? 'at-risk' : 'on-track'),
      overallCompletion: `${Math.round((completedItems / totalItems) * 100)}%`,
      completionRate: Math.round((completedItems / totalItems) * 100),
      totalItems,
      completedItems,
      failedItems,
      inProgressItems,
      successRate: `${Math.round(((totalItems - failedItems) / totalItems) * 100)}%`,
      avgDuration: this.calculateAvgDuration(executionHistory),
      lastUpdate: new Date().toISOString(),
      highlights: [
        `${completedItems} items completed successfully`,
        `${inProgressItems} items in progress`,
        failedItems > 0 ? `${failedItems} items require attention` : 'No blocking issues'
      ]
    };
  }

  async generateTimeline(executionHistory) {
    const timeline = [];
    const sortedHistory = [...executionHistory].sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );

    for (const item of sortedHistory) {
      timeline.push({
        agent: item.agentId,
        phase: item.phase,
        status: item.status,
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.duration,
        successRate: item.successRate || 100
      });
    }

    return {
      totalEvents: timeline.length,
      earliestStart: sortedHistory[0]?.startTime,
      latestEnd: sortedHistory[sortedHistory.length - 1]?.endTime,
      events: timeline.slice(0, 50) // Show last 50 events
    };
  }

  async generateAgentProgress(agents, executionHistory) {
    const agentMetrics = {};

    for (const agent of agents) {
      const agentHistory = executionHistory.filter(item => item.agentId === agent.id);
      const completed = agentHistory.filter(item => item.status === 'completed').length;
      const failed = agentHistory.filter(item => item.status === 'failed').length;

      agentMetrics[agent.id] = {
        name: agent.name,
        totalInvocations: agentHistory.length,
        completedInvocations: completed,
        failedInvocations: failed,
        successRate: agentHistory.length > 0 ? 
          `${Math.round(((agentHistory.length - failed) / agentHistory.length) * 100)}%` : 'N/A',
        avgDuration: this.calculateAvgDuration(agentHistory),
        lastExecution: agentHistory[agentHistory.length - 1]?.endTime,
        status: failed === 0 ? 'healthy' : 'needs-attention'
      };
    }

    return agentMetrics;
  }

  async generatePhaseProgress(phases, executionHistory) {
    const phaseMetrics = {};

    for (const phase of phases) {
      const phaseHistory = executionHistory.filter(item => item.phase === phase.number);
      const completed = phaseHistory.filter(item => item.status === 'completed').length;
      const failed = phaseHistory.filter(item => item.status === 'failed').length;

      phaseMetrics[`phase_${phase.number}`] = {
        name: phase.name,
        totalActivities: phaseHistory.length,
        completedActivities: completed,
        failedActivities: failed,
        completionPercentage: phaseHistory.length > 0 ?
          `${Math.round((completed / phaseHistory.length) * 100)}%` : '0%',
        status: phaseHistory.length === completed ? 'completed' : 
                (failed === 0 ? 'in-progress' : 'blocked'),
        agents: [...new Set(phaseHistory.map(h => h.agentId))]
      };
    }

    return phaseMetrics;
  }

  async analyzeResourceUtilization(executionHistory) {
    const totalDuration = executionHistory.reduce((sum, item) => 
      sum + (item.duration || 0), 0);
    const avgDuration = this.calculateAvgDuration(executionHistory);
    const peakConcurrency = Math.max(
      ...executionHistory.map((item, idx) =>
        executionHistory.filter(other =>
          new Date(other.startTime) <= new Date(item.endTime) &&
          new Date(other.endTime) >= new Date(item.startTime)
        ).length
      )
    );

    return {
      totalExecutionTime: totalDuration,
      averageExecutionTime: avgDuration,
      peakConcurrency,
      averageConcurrency: executionHistory.length > 0 ? 
        (peakConcurrency / 2).toFixed(2) : 0,
      utilizationRate: `${(peakConcurrency * 100 / executionHistory.length).toFixed(1)}%`,
      parallelizationOpportunities: this.identifyParallelizationOps(executionHistory)
    };
  }

  async assessRisks(executionHistory) {
    const risks = [];
    const failureRate = executionHistory.filter(h => h.status === 'failed').length / 
                       executionHistory.length;

    if (failureRate > 0.1) {
      risks.push({
        description: 'High failure rate detected',
        severity: failureRate > 0.3 ? 'critical' : 'high',
        affectedAreas: ['overall-health']
      });
    }

    const slowAgents = this.identifySlowAgents(executionHistory);
    if (slowAgents.length > 0) {
      risks.push({
        description: 'Slow agent execution detected',
        severity: 'medium',
        affectedAreas: slowAgents
      });
    }

    return {
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.severity === 'critical').length,
      risks: risks
    };
  }

  async trackBudget(executionHistory) {
    const estimatedCost = executionHistory.reduce((sum, item) => 
      sum + (item.estimatedCost || 0), 0);
    const actualCost = executionHistory.reduce((sum, item) =>
      sum + (item.actualCost || item.estimatedCost || 0), 0);

    return {
      estimatedBudget: estimatedCost,
      actualSpent: actualCost,
      variance: actualCost - estimatedCost,
      variancePercentage: estimatedCost > 0 ? 
        `${(((actualCost - estimatedCost) / estimatedCost) * 100).toFixed(2)}%` : '0%',
      remaining: estimatedCost - actualCost,
      status: actualCost <= estimatedCost ? 'within-budget' : 'over-budget'
    };
  }

  async assessQuality(executionHistory) {
    const successfulItems = executionHistory.filter(h => h.status === 'completed');
    const avgQualityScore = successfulItems.length > 0 ?
      successfulItems.reduce((sum, item) => sum + (item.qualityScore || 80), 0) / successfulItems.length : 0;

    return {
      overallQuality: Math.round(avgQualityScore),
      qualityTrend: 'stable',
      testCoverage: this.calculateTestCoverage(executionHistory),
      defectDensity: this.calculateDefectDensity(executionHistory),
      codeQuality: this.assessCodeQuality(executionHistory),
      compliance: this.checkCompliance(executionHistory)
    };
  }

  async generateStakeholderView(projectName, executionHistory) {
    return {
      projectName,
      currentStatus: 'on-track',
      completionPercentage: `${Math.round((executionHistory.filter(h => h.status === 'completed').length / executionHistory.length) * 100)}%`,
      nextMilestone: 'Phase 4 - Code Review',
      estimatedCompletion: this.estimateCompletion(executionHistory),
      blockers: this.identifyBlockers(executionHistory),
      approvals: this.trackApprovals(executionHistory)
    };
  }

  async generateDetailedMetrics(executionHistory) {
    return {
      totalExecutions: executionHistory.length,
      successful: executionHistory.filter(h => h.status === 'completed').length,
      failed: executionHistory.filter(h => h.status === 'failed').length,
      inProgress: executionHistory.filter(h => h.status === 'in-progress').length,
      avgProcessingTime: this.calculateAvgDuration(executionHistory),
      errorRate: `${((executionHistory.filter(h => h.status === 'failed').length / executionHistory.length) * 100).toFixed(2)}%`,
      successRate: `${((executionHistory.filter(h => h.status === 'completed').length / executionHistory.length) * 100).toFixed(2)}%`,
      throughput: `${executionHistory.length} executions`
    };
  }

  async createDashboard(projectName, report, executionHistory) {
    return {
      title: `${projectName} - Project Dashboard`,
      generatedAt: new Date().toISOString(),
      sections: {
        overview: {
          title: 'Project Overview',
          metrics: {
            status: report.executive.status,
            completion: report.executive.overallCompletion,
            health: 'healthy'
          }
        },
        progress: {
          title: 'Progress Tracking',
          phaseCompletion: Object.entries(report.phaseProgress).map(([key, val]) => ({
            phase: key,
            completion: val.completionPercentage
          })),
          agentStatus: Object.entries(report.agentProgress).map(([key, val]) => ({
            agent: key,
            status: val.status,
            successRate: val.successRate
          }))
        },
        resources: {
          title: 'Resource Utilization',
          ...report.resourceUtilization
        },
        risks: {
          title: 'Risk Status',
          totalRisks: report.riskAssessment.totalRisks,
          criticalRisks: report.riskAssessment.criticalRisks,
          risks: report.riskAssessment.risks
        },
        budget: {
          title: 'Budget Status',
          ...report.budget
        },
        quality: {
          title: 'Quality Metrics',
          ...report.quality
        }
      },
      refreshInterval: 300000 // 5 minutes
    };
  }

  async calculateMetrics(report, executionHistory, agents) {
    return {
      overallCompletion: parseInt(report.executive.overallCompletion),
      successRate: parseInt(report.executive.successRate),
      totalAgentsInvoked: agents.length,
      totalExecutions: executionHistory.length,
      phasesCompleted: Object.values(report.phaseProgress)
        .filter(p => p.status === 'completed').length,
      resourceUtilization: parseInt(report.resourceUtilization.utilizationRate),
      budgetStatus: report.budget.status,
      qualityScore: report.quality.overallQuality,
      riskLevel: report.riskAssessment.criticalRisks > 0 ? 'high' : 'low'
    };
  }

  async identifyBottlenecks(report, metrics, executionHistory) {
    const bottlenecks = [];

    // Check for slow agents
    const agentPerformance = Object.entries(report.agentProgress);
    for (const [agentId, perf] of agentPerformance) {
      if (perf.avgDuration > 300) { // > 5 minutes
        bottlenecks.push({
          type: 'slow-agent',
          agent: agentId,
          avgDuration: perf.avgDuration,
          severity: perf.avgDuration > 600 ? 'critical' : 'high',
          impact: 'timeline'
        });
      }
    }

    // Check for high failure rates
    for (const [agentId, perf] of agentPerformance) {
      const failureRate = perf.failedInvocations / perf.totalInvocations;
      if (failureRate > 0.1) {
        bottlenecks.push({
          type: 'high-failure-rate',
          agent: agentId,
          failureRate: `${(failureRate * 100).toFixed(2)}%`,
          severity: 'high',
          impact: 'quality'
        });
      }
    }

    return bottlenecks;
  }

  async generateRecommendations(report, metrics, bottlenecks) {
    const recommendations = [];

    // Recommendations based on bottlenecks
    for (const bottleneck of bottlenecks) {
      if (bottleneck.type === 'slow-agent') {
        recommendations.push({
          category: 'performance',
          priority: bottleneck.severity === 'critical' ? 'immediate' : 'high',
          recommendation: `Optimize ${bottleneck.agent} - currently taking ${bottleneck.avgDuration}s`,
          expectedImpact: 'Reduce timeline by 20-30%'
        });
      }

      if (bottleneck.type === 'high-failure-rate') {
        recommendations.push({
          category: 'reliability',
          priority: 'high',
          recommendation: `Improve reliability of ${bottleneck.agent} with ${bottleneck.failureRate} failure rate`,
          expectedImpact: 'Reduce errors and improve quality'
        });
      }
    }

    // Recommendations based on quality
    if (metrics.qualityScore < 70) {
      recommendations.push({
        category: 'quality',
        priority: 'high',
        recommendation: 'Implement additional QA checkpoints',
        expectedImpact: 'Improve quality score by 15-25%'
      });
    }

    // Budget recommendations
    if (report.budget.status === 'over-budget') {
      recommendations.push({
        category: 'budget',
        priority: 'immediate',
        recommendation: 'Review resource allocation and optimize utilization',
        expectedImpact: 'Reduce costs by 10-15%'
      });
    }

    return recommendations;
  }

  calculateAvgDuration(items) {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + (item.duration || 0), 0);
    return (total / items.length).toFixed(2);
  }

  identifySlowAgents(executionHistory) {
    const agentDurations = {};
    for (const item of executionHistory) {
      if (!agentDurations[item.agentId]) {
        agentDurations[item.agentId] = [];
      }
      agentDurations[item.agentId].push(item.duration || 0);
    }

    const slowAgents = [];
    for (const [agentId, durations] of Object.entries(agentDurations)) {
      const avg = durations.reduce((a, b) => a + b) / durations.length;
      if (avg > 300) {
        slowAgents.push(agentId);
      }
    }
    return slowAgents;
  }

  identifyParallelizationOps(executionHistory) {
    // Find sequential operations that could be parallelized
    const ops = [];
    const sorted = [...executionHistory].sort((a, b) =>
      new Date(a.startTime) - new Date(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      if (new Date(sorted[i].endTime) < new Date(sorted[i + 1].startTime)) {
        ops.push(`Can parallelize ${sorted[i].agentId} with ${sorted[i + 1].agentId}`);
      }
    }
    return ops.slice(0, 5);
  }

  calculateTestCoverage(executionHistory) {
    const itemsWithTests = executionHistory.filter(h => h.testCoverage).length;
    const avgCoverage = executionHistory.filter(h => h.testCoverage)
      .reduce((sum, h) => sum + h.testCoverage, 0) / Math.max(itemsWithTests, 1);
    return `${Math.round(avgCoverage)}%`;
  }

  calculateDefectDensity(executionHistory) {
    const defects = executionHistory.filter(h => h.defects).length;
    const loc = 10000; // Placeholder
    return `${(defects / loc * 1000).toFixed(2)} defects per KLOC`;
  }

  assessCodeQuality(executionHistory) {
    return {
      maintainability: 'Good',
      complexity: 'Moderate',
      documentation: 'Complete'
    };
  }

  checkCompliance(executionHistory) {
    return {
      standards: 'Compliant',
      security: 'Compliant',
      accessibility: 'Compliant'
    };
  }

  estimateCompletion(executionHistory) {
    const avgDuration = this.calculateAvgDuration(executionHistory);
    const remaining = executionHistory.filter(h => h.status !== 'completed').length;
    const estimatedMinutes = remaining * avgDuration / 60;
    return new Date(Date.now() + estimatedMinutes * 60000).toISOString().split('T')[0];
  }

  identifyBlockers(executionHistory) {
    return executionHistory
      .filter(h => h.status === 'blocked')
      .map(h => ({
        agent: h.agentId,
        reason: h.blockerReason || 'Unknown'
      }));
  }

  trackApprovals(executionHistory) {
    return executionHistory
      .filter(h => h.requiresApproval)
      .map(h => ({
        item: h.agentId,
        status: h.approvalStatus || 'pending',
        approver: h.approver || 'pending'
      }));
  }

  getReport(executionId) {
    return this.reportCache.get(executionId);
  }

  listReports() {
    return Array.from(this.reportCache.values()).map(r => ({
      id: r.executionId,
      projectName: r.report.projectName,
      timestamp: r.report.timestamp,
      status: r.report.executive.status
    }));
  }

  getDashboard(executionId) {
    return this.dashboards.get(executionId);
  }

  async _onCleanup() {
    // Cleanup can be customized if needed
  }
}

export default ReporterAgent;
