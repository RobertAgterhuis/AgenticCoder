import { ReporterAgent } from '../agents/ReporterAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ReporterAgent', () => {
  let reporter;

  beforeEach(async () => {
    reporter = new ReporterAgent();
    await reporter.initialize();
  });

  afterEach(async () => {
    await reporter.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(reporter.id).toBe('reporter');
      expect(reporter.name).toBe('Progress Reporter');
      expect(reporter.state).toBe('ready');
    });

    it('should initialize caches', () => {
      expect(reporter.reportCache).toBeDefined();
      expect(reporter.reportCache.size).toBe(0);
      expect(reporter.dashboards).toBeDefined();
      expect(reporter.metricsHistory).toBeDefined();
    });

    it('should initialize bottlenecks array', () => {
      expect(Array.isArray(reporter.bottlenecks)).toBe(true);
    });

    it('should initialize recommendations array', () => {
      expect(Array.isArray(reporter.recommendations)).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive progress report', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            duration: 120,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        agents: [{ id: 'coordinator', name: 'Coordinator' }],
        phases: [{ number: 0, name: 'Initialization' }]
      };

      const result = await reporter.execute(input);

      expect(result.report).toBeDefined();
      expect(result.report.projectName).toBe('TestProject');
      expect(result.report.timestamp).toBeDefined();
    });

    it('should include executive summary in report', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.report.executive).toBeDefined();
      expect(result.report.executive).toHaveProperty('status');
      expect(result.report.executive).toHaveProperty('overallCompletion');
      expect(result.report.executive).toHaveProperty('completionRate');
    });

    it('should include timeline in report', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            duration: 60,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      const result = await reporter.execute(input);

      expect(result.report.timeline).toBeDefined();
      expect(result.report.timeline).toHaveProperty('totalEvents');
      expect(result.report.timeline).toHaveProperty('events');
    });

    it('should include agent progress', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        agents: [{ id: 'coordinator', name: 'Coordinator' }]
      };

      const result = await reporter.execute(input);

      expect(result.report.agentProgress).toBeDefined();
      expect(result.report.agentProgress.coordinator).toBeDefined();
      expect(result.report.agentProgress.coordinator).toHaveProperty('totalInvocations');
      expect(result.report.agentProgress.coordinator).toHaveProperty('successRate');
    });

    it('should include phase progress', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        phases: [{ number: 0, name: 'Initialization' }]
      };

      const result = await reporter.execute(input);

      expect(result.report.phaseProgress).toBeDefined();
      expect(result.report.phaseProgress.phase_0).toBeDefined();
      expect(result.report.phaseProgress.phase_0).toHaveProperty('status');
    });

    it('should calculate resource utilization', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            duration: 120,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      const result = await reporter.execute(input);

      expect(result.report.resourceUtilization).toBeDefined();
      expect(result.report.resourceUtilization).toHaveProperty('totalExecutionTime');
      expect(result.report.resourceUtilization).toHaveProperty('peakConcurrency');
    });

    it('should assess risks', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      const result = await reporter.execute(input);

      expect(result.report.riskAssessment).toBeDefined();
      expect(result.report.riskAssessment).toHaveProperty('totalRisks');
      expect(result.report.riskAssessment).toHaveProperty('risks');
    });

    it('should track budget', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            estimatedCost: 100,
            actualCost: 95,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      const result = await reporter.execute(input);

      expect(result.report.budget).toBeDefined();
      expect(result.report.budget).toHaveProperty('estimatedBudget');
      expect(result.report.budget).toHaveProperty('actualSpent');
      expect(result.report.budget).toHaveProperty('status');
    });

    it('should assess quality', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.report.quality).toBeDefined();
      expect(result.report.quality).toHaveProperty('overallQuality');
      expect(result.report.quality).toHaveProperty('testCoverage');
      expect(result.report.quality).toHaveProperty('defectDensity');
    });

    it('should generate stakeholder view', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.report.stakeholder).toBeDefined();
      expect(result.report.stakeholder.projectName).toBe('TestProject');
      expect(result.report.stakeholder).toHaveProperty('currentStatus');
    });
  });

  describe('Dashboard Creation', () => {
    it('should create interactive dashboard', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard).toBeDefined();
      expect(result.dashboard.title).toContain('TestProject');
      expect(result.dashboard).toHaveProperty('sections');
    });

    it('should include overview section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.overview).toBeDefined();
      expect(result.dashboard.sections.overview.metrics).toBeDefined();
    });

    it('should include progress section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.progress).toBeDefined();
      expect(result.dashboard.sections.progress).toHaveProperty('phaseCompletion');
      expect(result.dashboard.sections.progress).toHaveProperty('agentStatus');
    });

    it('should include resource section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.resources).toBeDefined();
    });

    it('should include risk section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.risks).toBeDefined();
      expect(result.dashboard.sections.risks).toHaveProperty('totalRisks');
    });

    it('should include budget section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.budget).toBeDefined();
    });

    it('should include quality section', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.dashboard.sections.quality).toBeDefined();
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate overall metrics', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            status: 'completed',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ]
      };

      const result = await reporter.execute(input);

      expect(result.metrics).toBeDefined();
      expect(result.metrics).toHaveProperty('overallCompletion');
      expect(result.metrics).toHaveProperty('successRate');
      expect(result.metrics).toHaveProperty('totalExecutions');
    });

    it('should track resource utilization metrics', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.metrics).toHaveProperty('resourceUtilization');
    });

    it('should include budget status in metrics', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.metrics).toHaveProperty('budgetStatus');
    });

    it('should include quality score in metrics', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.metrics).toHaveProperty('qualityScore');
    });

    it('should include risk level in metrics', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.metrics).toHaveProperty('riskLevel');
    });
  });

  describe('Bottleneck Identification', () => {
    it('should identify bottlenecks', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'slow-agent',
            status: 'completed',
            duration: 700,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        agents: [{ id: 'slow-agent', name: 'Slow Agent' }]
      };

      const result = await reporter.execute(input);

      expect(Array.isArray(result.bottlenecks)).toBe(true);
    });

    it('should identify slow agents as bottlenecks', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'slow-agent',
            status: 'completed',
            duration: 700,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        agents: [{ id: 'slow-agent', name: 'Slow Agent' }]
      };

      const result = await reporter.execute(input);
      const slowBottlenecks = result.bottlenecks.filter(b => b.type === 'slow-agent');

      expect(slowBottlenecks.length).toBeGreaterThan(0);
    });

    it('should identify high failure rates as bottlenecks', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          { agentId: 'failing-agent', status: 'failed', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
          { agentId: 'failing-agent', status: 'failed', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
          { agentId: 'failing-agent', status: 'completed', startTime: new Date().toISOString(), endTime: new Date().toISOString() }
        ],
        agents: [{ id: 'failing-agent', name: 'Failing Agent' }]
      };

      const result = await reporter.execute(input);
      const failureBottlenecks = result.bottlenecks.filter(b => b.type === 'high-failure-rate');

      expect(failureBottlenecks.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should recommend performance improvements for slow agents', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'slow-agent',
            status: 'completed',
            duration: 700,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        ],
        agents: [{ id: 'slow-agent', name: 'Slow Agent' }]
      };

      const result = await reporter.execute(input);
      const perfRecommendations = result.recommendations.filter(r => r.category === 'performance');

      expect(perfRecommendations.length).toBeGreaterThan(0);
    });

    it('should recommend quality improvements', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Report Caching', () => {
    it('should cache generated reports', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);
      const cached = reporter.getReport(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.report.projectName).toBe('TestProject');
    });

    it('should list cached reports', async () => {
      const input1 = { projectName: 'Project1', executionHistory: [] };
      const input2 = { projectName: 'Project2', executionHistory: [] };

      const result1 = await reporter.execute(input1);
      const result2 = await reporter.execute(input2);

      const list = reporter.listReports();
      expect(list.length).toBe(2);
      expect(list.map(r => r.projectName)).toContain('Project1');
      expect(list.map(r => r.projectName)).toContain('Project2');
    });

    it('should retrieve cached report by ID', async () => {
      const input = { projectName: 'TestProject', executionHistory: [] };

      const result = await reporter.execute(input);
      const cached = reporter.getReport(result.executionId);

      expect(cached.executionId).toBe(result.executionId);
    });
  });

  describe('Executive Summary', () => {
    it('should generate executive summary', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          { agentId: 'coordinator', status: 'completed', startTime: new Date().toISOString(), endTime: new Date().toISOString() }
        ]
      };

      const result = await reporter.execute(input);
      const summary = result.report.executive;

      expect(summary).toHaveProperty('status');
      expect(summary).toHaveProperty('overallCompletion');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('totalItems');
      expect(summary).toHaveProperty('highlights');
    });

    it('should calculate correct completion percentage', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          { agentId: 'coordinator', status: 'completed', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
          { agentId: 'planner', status: 'in-progress', startTime: new Date().toISOString(), endTime: new Date().toISOString() }
        ]
      };

      const result = await reporter.execute(input);
      const summary = result.report.executive;

      expect(summary.completionRate).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await reporter.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing projectName', async () => {
      expect(async () => {
        await reporter.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit report-generated event', async () => {
      const events = [];
      reporter.on('report-generated', (evt) => {
        events.push(evt);
      });

      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      await reporter.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('projectName');
      expect(events[0]).toHaveProperty('timestamp');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: []
      };

      const result = await reporter.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('projectName');
      expect(result.summary).toHaveProperty('overallCompletion');
      expect(result.summary).toHaveProperty('totalAgentsInvoked');
      expect(result.summary).toHaveProperty('phasesCompleted');
      expect(result.summary).toHaveProperty('criticalBlockers');
    });
  });

  describe('Timeline Tracking', () => {
    it('should track execution timeline', async () => {
      const startTime = new Date().toISOString();
      const endTime = new Date().toISOString();

      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            startTime,
            endTime,
            duration: 60
          }
        ]
      };

      const result = await reporter.execute(input);
      const timeline = result.report.timeline;

      expect(timeline).toHaveProperty('totalEvents');
      expect(timeline).toHaveProperty('earliestStart');
      expect(timeline).toHaveProperty('latestEnd');
      expect(timeline).toHaveProperty('events');
    });

    it('should sort timeline events chronologically', async () => {
      const input = {
        projectName: 'TestProject',
        executionHistory: [
          {
            agentId: 'coordinator',
            phase: 0,
            status: 'completed',
            startTime: new Date('2026-01-15T10:00:00').toISOString(),
            endTime: new Date('2026-01-15T10:01:00').toISOString(),
            duration: 60
          },
          {
            agentId: 'planner',
            phase: 1,
            status: 'completed',
            startTime: new Date('2026-01-15T10:01:00').toISOString(),
            endTime: new Date('2026-01-15T10:02:00').toISOString(),
            duration: 60
          }
        ]
      };

      const result = await reporter.execute(input);
      const events = result.report.timeline.events;

      expect(events[0].agent).toBe('coordinator');
      expect(events[1].agent).toBe('planner');
    });
  });
});
