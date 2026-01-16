/**
 * DependencyResolver Test Suite
 * 
 * Comprehensive tests for all dependency resolver components.
 * 
 * @module task/dependency-resolver/tests
 */

import { describe, it, beforeEach, expect, vi } from 'vitest';

// Import all components
import {
  DependencyResolver,
  DependencyGraph,
  GraphNode,
  NodeStatus,
  EdgeType,
  CircularDetector,
  DetectionResult,
  CycleSeverity,
  TopologicalSorter,
  SortAlgorithm,
  SortStatus,
  ParallelBlocker,
  ExecutionBlock,
  BlockMode,
  ParallelStrategy,
  CriticalPathAnalyzer,
  TaskCriticality,
  ScheduleGenerator,
  ScheduleFormat,
  ScheduleStatus,
  ResolutionResult
} from './index.js';

// ============================================================================
// Test Data
// ============================================================================

const createSimpleTasks = () => [
  { id: 'task-1', title: 'Initialize', dependencies: [], duration: 1, agent: 'code-agent' },
  { id: 'task-2', title: 'Setup', dependencies: ['task-1'], duration: 2, agent: 'code-agent' },
  { id: 'task-3', title: 'Build', dependencies: ['task-2'], duration: 3, agent: 'code-agent' },
  { id: 'task-4', title: 'Test', dependencies: ['task-3'], duration: 2, agent: 'test-agent' }
];

const createParallelTasks = () => [
  { id: 'start', title: 'Start', dependencies: [], duration: 1, agent: 'orchestrator' },
  { id: 'api', title: 'Build API', dependencies: ['start'], duration: 4, agent: 'code-agent' },
  { id: 'ui', title: 'Build UI', dependencies: ['start'], duration: 3, agent: 'code-agent' },
  { id: 'db', title: 'Setup DB', dependencies: ['start'], duration: 2, agent: 'devops-agent' },
  { id: 'integrate', title: 'Integrate', dependencies: ['api', 'ui', 'db'], duration: 2, agent: 'code-agent' },
  { id: 'test', title: 'Test', dependencies: ['integrate'], duration: 3, agent: 'test-agent' }
];

const createCyclicTasks = () => [
  { id: 'A', title: 'Task A', dependencies: ['C'], duration: 1 },
  { id: 'B', title: 'Task B', dependencies: ['A'], duration: 1 },
  { id: 'C', title: 'Task C', dependencies: ['B'], duration: 1 }
];

const createComplexTasks = () => [
  { id: 'init', title: 'Initialize', dependencies: [], duration: 0.5, priority: 1, agent: 'orchestrator' },
  { id: 'plan', title: 'Create Plan', dependencies: ['init'], duration: 1, priority: 1, agent: 'architect-agent' },
  { id: 'design-api', title: 'Design API', dependencies: ['plan'], duration: 2, priority: 2, agent: 'architect-agent' },
  { id: 'design-ui', title: 'Design UI', dependencies: ['plan'], duration: 1.5, priority: 2, agent: 'architect-agent' },
  { id: 'impl-api', title: 'Implement API', dependencies: ['design-api'], duration: 6, priority: 3, agent: 'code-agent' },
  { id: 'impl-ui', title: 'Implement UI', dependencies: ['design-ui'], duration: 5, priority: 3, agent: 'code-agent' },
  { id: 'impl-db', title: 'Implement DB', dependencies: ['design-api'], duration: 3, priority: 3, agent: 'devops-agent' },
  { id: 'unit-tests', title: 'Unit Tests', dependencies: ['impl-api', 'impl-ui'], duration: 2, priority: 4, agent: 'test-agent' },
  { id: 'int-tests', title: 'Integration Tests', dependencies: ['unit-tests', 'impl-db'], duration: 3, priority: 4, agent: 'test-agent' },
  { id: 'docs', title: 'Documentation', dependencies: ['impl-api', 'impl-ui'], duration: 2, priority: 5, agent: 'docs-agent' },
  { id: 'deploy', title: 'Deploy', dependencies: ['int-tests', 'docs'], duration: 1, priority: 5, agent: 'devops-agent' }
];

// ============================================================================
// DependencyGraph Tests
// ============================================================================

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('construction', () => {
    it('should create empty graph', () => {
      expect(graph.nodeCount).toBe(0);
      expect(graph.edgeCount).toBe(0);
    });

    it('should build graph from tasks', () => {
      const tasks = createSimpleTasks();
      graph.buildFromTasks(tasks);

      expect(graph.nodeCount).toBe(4);
      expect(graph.edgeCount).toBe(3);
    });
  });

  describe('node management', () => {
    it('should add and retrieve nodes', () => {
      const task = { id: 'test', title: 'Test Task', duration: 1 };
      graph.addNode(task);

      const node = graph.getNode('test');
      expect(node).toBeDefined();
      expect(node.task.title).toBe('Test Task');
    });

    it('should not allow duplicate nodes', () => {
      graph.addNode({ id: 'test', title: 'First' });
      graph.addNode({ id: 'test', title: 'Second' });

      expect(graph.nodeCount).toBe(1);
    });

    it('should remove nodes correctly', () => {
      graph.buildFromTasks(createSimpleTasks());
      graph.removeNode('task-2');

      expect(graph.nodeCount).toBe(3);
      expect(graph.getNode('task-2')).toBeNull();
    });
  });

  describe('edge management', () => {
    it('should add edges correctly', () => {
      graph.addNode({ id: 'a' });
      graph.addNode({ id: 'b' });
      graph.addEdge('a', 'b', EdgeType.HARD);

      const nodeA = graph.getNode('a');
      const nodeB = graph.getNode('b');

      expect(nodeA.dependents.has('b')).toBe(true);
      expect(nodeB.dependencies.has('a')).toBe(true);
    });

    it('should handle edge types', () => {
      graph.addNode({ id: 'a' });
      graph.addNode({ id: 'b' });
      graph.addEdge('a', 'b', EdgeType.SOFT);

      const nodeA = graph.getNode('a');
      expect(nodeA.getEdgeType('b')).toBe(EdgeType.SOFT);
    });
  });

  describe('graph queries', () => {
    beforeEach(() => {
      graph.buildFromTasks(createSimpleTasks());
    });

    it('should find root nodes', () => {
      const roots = graph.getRootNodes();
      expect(roots.length).toBe(1);
      expect(roots[0].id).toBe('task-1');
    });

    it('should find leaf nodes', () => {
      const leaves = graph.getLeafNodes();
      expect(leaves.length).toBe(1);
      expect(leaves[0].id).toBe('task-4');
    });

    it('should calculate ancestors', () => {
      const ancestors = graph.getAncestors('task-4');
      expect(ancestors).toContain('task-1');
      expect(ancestors).toContain('task-2');
      expect(ancestors).toContain('task-3');
    });

    it('should calculate descendants', () => {
      const descendants = graph.getDescendants('task-1');
      expect(descendants).toContain('task-2');
      expect(descendants).toContain('task-3');
      expect(descendants).toContain('task-4');
    });

    it('should calculate depths', () => {
      graph.calculateDepths();
      
      expect(graph.getNode('task-1').depth).toBe(0);
      expect(graph.getNode('task-2').depth).toBe(1);
      expect(graph.getNode('task-3').depth).toBe(2);
      expect(graph.getNode('task-4').depth).toBe(3);
    });
  });

  describe('DAG validation', () => {
    it('should identify valid DAG', () => {
      graph.buildFromTasks(createSimpleTasks());
      expect(graph.isDAG()).toBe(true);
    });

    it('should identify cyclic graph', () => {
      graph.buildFromTasks(createCyclicTasks());
      expect(graph.isDAG()).toBe(false);
    });
  });
});

// ============================================================================
// CircularDetector Tests
// ============================================================================

describe('CircularDetector', () => {
  let detector;
  let graph;

  beforeEach(() => {
    detector = new CircularDetector();
    graph = new DependencyGraph();
  });

  describe('cycle detection', () => {
    it('should detect no cycles in acyclic graph', () => {
      graph.buildFromTasks(createSimpleTasks());
      const result = detector.detect(graph);

      expect(result.result).toBe(DetectionResult.NO_CYCLES);
      expect(result.hasCycles).toBe(false);
      expect(result.cycles.length).toBe(0);
    });

    it('should detect cycles in cyclic graph', () => {
      graph.buildFromTasks(createCyclicTasks());
      const result = detector.detect(graph);

      expect(result.result).toBe(DetectionResult.CYCLES_FOUND);
      expect(result.hasCycles).toBe(true);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('should return cycle path', () => {
      graph.buildFromTasks(createCyclicTasks());
      const result = detector.detect(graph);

      const cycle = result.cycles[0];
      expect(cycle.path.length).toBeGreaterThan(0);
      // Cycle should start and end at same node
      expect(cycle.path[0]).toBe(cycle.path[cycle.path.length - 1]);
    });
  });

  describe('cycle severity', () => {
    it('should assign severity to detected cycles', () => {
      graph.buildFromTasks(createCyclicTasks());
      const result = detector.detect(graph);

      const cycle = result.cycles[0];
      expect([
        CycleSeverity.CRITICAL,
        CycleSeverity.HIGH,
        CycleSeverity.MEDIUM,
        CycleSeverity.LOW
      ]).toContain(cycle.severity);
    });
  });

  describe('Tarjan algorithm', () => {
    it('should find strongly connected components', () => {
      graph.buildFromTasks(createCyclicTasks());
      const result = detector.detectWithTarjan(graph);

      expect(result.components.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TopologicalSorter Tests
// ============================================================================

describe('TopologicalSorter', () => {
  let sorter;
  let graph;

  beforeEach(() => {
    sorter = new TopologicalSorter();
    graph = new DependencyGraph();
  });

  describe('basic sorting', () => {
    it('should sort simple linear dependencies', () => {
      graph.buildFromTasks(createSimpleTasks());
      const result = sorter.sort(graph);

      expect(result.status).toBe(SortStatus.SUCCESS);
      expect(result.order).toEqual(['task-1', 'task-2', 'task-3', 'task-4']);
    });

    it('should handle parallel tasks', () => {
      graph.buildFromTasks(createParallelTasks());
      const result = sorter.sort(graph);

      expect(result.status).toBe(SortStatus.SUCCESS);
      
      // Verify ordering constraints
      const order = result.order;
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('api'));
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('ui'));
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('db'));
      expect(order.indexOf('api')).toBeLessThan(order.indexOf('integrate'));
      expect(order.indexOf('ui')).toBeLessThan(order.indexOf('integrate'));
      expect(order.indexOf('db')).toBeLessThan(order.indexOf('integrate'));
      expect(order.indexOf('integrate')).toBeLessThan(order.indexOf('test'));
    });
  });

  describe('algorithm variants', () => {
    it('should sort using Kahn algorithm', () => {
      graph.buildFromTasks(createSimpleTasks());
      const result = sorter.sort(graph, { algorithm: SortAlgorithm.KAHN });

      expect(result.status).toBe(SortStatus.SUCCESS);
      expect(result.algorithm).toBe(SortAlgorithm.KAHN);
    });

    it('should sort using DFS algorithm', () => {
      graph.buildFromTasks(createSimpleTasks());
      const result = sorter.sort(graph, { algorithm: SortAlgorithm.DFS });

      expect(result.status).toBe(SortStatus.SUCCESS);
      expect(result.algorithm).toBe(SortAlgorithm.DFS);
    });

    it('should sort with priority awareness', () => {
      graph.buildFromTasks(createComplexTasks());
      const result = sorter.sort(graph, { algorithm: SortAlgorithm.PRIORITY });

      expect(result.status).toBe(SortStatus.SUCCESS);
    });
  });

  describe('cycle handling', () => {
    it('should detect cycle during sort', () => {
      graph.buildFromTasks(createCyclicTasks());
      const result = sorter.sort(graph);

      expect(result.status).toBe(SortStatus.CYCLE_DETECTED);
      expect(result.order.length).toBe(0);
    });
  });

  describe('order verification', () => {
    it('should verify correct order', () => {
      graph.buildFromTasks(createSimpleTasks());
      const result = sorter.sort(graph);

      const verification = sorter.verifySortedOrder(graph, result.order);
      expect(verification.valid).toBe(true);
    });

    it('should reject incorrect order', () => {
      graph.buildFromTasks(createSimpleTasks());
      
      const badOrder = ['task-4', 'task-3', 'task-2', 'task-1'];
      const verification = sorter.verifySortedOrder(graph, badOrder);

      expect(verification.valid).toBe(false);
      expect(verification.violations.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// ParallelBlocker Tests
// ============================================================================

describe('ParallelBlocker', () => {
  let blocker;
  let graph;

  beforeEach(() => {
    blocker = new ParallelBlocker();
    graph = new DependencyGraph();
  });

  describe('block creation', () => {
    it('should create blocks for linear dependencies', () => {
      graph.buildFromTasks(createSimpleTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = blocker.createBlocks(graph, sortResult.order);

      expect(result.success).toBe(true);
      expect(result.blocks.length).toBe(4);  // All sequential
    });

    it('should identify parallel opportunities', () => {
      graph.buildFromTasks(createParallelTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = blocker.createBlocks(graph, sortResult.order);

      expect(result.success).toBe(true);
      // Should have fewer blocks than tasks due to parallelism
      expect(result.blocks.length).toBeLessThan(6);
      expect(result.maxParallelism).toBeGreaterThan(1);
    });
  });

  describe('strategies', () => {
    const setupGraph = () => {
      graph.buildFromTasks(createComplexTasks());
      const sorter = new TopologicalSorter();
      return sorter.sort(graph);
    };

    it('should use maximum parallelism strategy', () => {
      const sortResult = setupGraph();
      const result = blocker.createBlocks(graph, sortResult.order, {
        strategy: ParallelStrategy.MAXIMUM
      });

      expect(result.success).toBe(true);
      expect(result.maxParallelism).toBeGreaterThan(1);
    });

    it('should use resource-aware strategy', () => {
      const sortResult = setupGraph();
      const result = blocker.createBlocks(graph, sortResult.order, {
        strategy: ParallelStrategy.RESOURCE_AWARE,
        maxConcurrency: 2
      });

      expect(result.success).toBe(true);
      // Should respect concurrency limit
      for (const block of result.blocks) {
        expect(block.tasks.length).toBeLessThanOrEqual(2);
      }
    });

    it('should use agent-aware strategy', () => {
      const sortResult = setupGraph();
      const result = blocker.createBlocks(graph, sortResult.order, {
        strategy: ParallelStrategy.AGENT_AWARE
      });

      expect(result.success).toBe(true);
    });

    it('should use conservative strategy', () => {
      const sortResult = setupGraph();
      const result = blocker.createBlocks(graph, sortResult.order, {
        strategy: ParallelStrategy.CONSERVATIVE
      });

      expect(result.success).toBe(true);
      // Conservative should have more blocks (less parallelism)
    });
  });

  describe('block mode', () => {
    it('should identify parallel blocks', () => {
      graph.buildFromTasks(createParallelTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = blocker.createBlocks(graph, sortResult.order);

      const parallelBlocks = result.blocks.filter(b => b.mode === BlockMode.PARALLEL);
      expect(parallelBlocks.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CriticalPathAnalyzer Tests
// ============================================================================

describe('CriticalPathAnalyzer', () => {
  let analyzer;
  let graph;

  beforeEach(() => {
    analyzer = new CriticalPathAnalyzer();
    graph = new DependencyGraph();
  });

  describe('critical path analysis', () => {
    it('should find critical path in linear graph', () => {
      graph.buildFromTasks(createSimpleTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = analyzer.analyze(graph, sortResult.order);

      // In linear graph, all tasks are critical
      expect(result.criticalPath.length).toBe(4);
      expect(result.totalDuration).toBe(8);  // 1+2+3+2 = 8 hours
    });

    it('should find critical path in parallel graph', () => {
      graph.buildFromTasks(createParallelTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = analyzer.analyze(graph, sortResult.order);

      // Critical path: start -> api -> integrate -> test
      expect(result.totalDuration).toBe(10);  // 1+4+2+3 = 10 hours
      expect(result.criticalPath).toContain('start');
      expect(result.criticalPath).toContain('api');
      expect(result.criticalPath).toContain('integrate');
      expect(result.criticalPath).toContain('test');
    });

    it('should calculate slack correctly', () => {
      graph.buildFromTasks(createParallelTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = analyzer.analyze(graph, sortResult.order);

      // ui has slack (3 hours vs api's 4)
      const uiSlack = result.getTaskSlack('ui');
      expect(uiSlack).toBeGreaterThan(0);

      // db has slack (2 hours vs api's 4)
      const dbSlack = result.getTaskSlack('db');
      expect(dbSlack).toBeGreaterThan(0);

      // api is critical (no slack)
      const apiSlack = result.getTaskSlack('api');
      expect(apiSlack).toBeCloseTo(0, 0.01);
    });
  });

  describe('bottleneck identification', () => {
    it('should identify bottlenecks', () => {
      graph.buildFromTasks(createComplexTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = analyzer.analyze(graph, sortResult.order);

      // impl-api is likely a bottleneck (6 hours, on critical path)
      expect(result.bottlenecks.length).toBeGreaterThan(0);
    });
  });

  describe('near-critical paths', () => {
    it('should find near-critical paths', () => {
      graph.buildFromTasks(createComplexTasks());
      const sorter = new TopologicalSorter();
      const sortResult = sorter.sort(graph);

      const result = analyzer.analyze(graph, sortResult.order);

      // Should find paths with small slack
      expect(result.nearCriticalPaths).toBeDefined();
    });
  });
});

// ============================================================================
// ScheduleGenerator Tests
// ============================================================================

describe('ScheduleGenerator', () => {
  let generator;
  let graph;

  beforeEach(() => {
    generator = new ScheduleGenerator();
    graph = new DependencyGraph();
  });

  describe('schedule generation', () => {
    const setupComponents = () => {
      graph.buildFromTasks(createParallelTasks());
      const sorter = new TopologicalSorter();
      const blocker = new ParallelBlocker();
      const analyzer = new CriticalPathAnalyzer();

      const sortResult = sorter.sort(graph);
      const blockResult = blocker.createBlocks(graph, sortResult.order);
      const criticalPath = analyzer.analyze(graph, sortResult.order);

      return { sortResult, blockResult, criticalPath };
    };

    it('should generate valid schedule', () => {
      const { sortResult, blockResult, criticalPath } = setupComponents();

      const schedule = generator.generate(
        graph,
        sortResult.order,
        blockResult.blocks,
        criticalPath
      );

      expect(schedule.status).toBe(ScheduleStatus.VALID);
      expect(schedule.blocks.length).toBeGreaterThan(0);
    });

    it('should include critical path info', () => {
      const { sortResult, blockResult, criticalPath } = setupComponents();

      const schedule = generator.generate(
        graph,
        sortResult.order,
        blockResult.blocks,
        criticalPath
      );

      expect(schedule.criticalPath).toBeDefined();
      expect(schedule.criticalPath.path.length).toBeGreaterThan(0);
    });

    it('should calculate metadata', () => {
      const { sortResult, blockResult, criticalPath } = setupComponents();

      const schedule = generator.generate(
        graph,
        sortResult.order,
        blockResult.blocks,
        criticalPath
      );

      expect(schedule.metadata.totalHours).toBeGreaterThan(0);
      expect(schedule.metadata.totalTasks).toBe(6);
      expect(schedule.metadata.maxConcurrency).toBeGreaterThan(0);
    });

    it('should generate timeline', () => {
      const { sortResult, blockResult, criticalPath } = setupComponents();

      const schedule = generator.generate(
        graph,
        sortResult.order,
        blockResult.blocks,
        criticalPath
      );

      expect(schedule.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('export formats', () => {
    it('should export to JSON', () => {
      graph.buildFromTasks(createSimpleTasks());
      const sorter = new TopologicalSorter();
      const blocker = new ParallelBlocker();

      const sortResult = sorter.sort(graph);
      const blockResult = blocker.createBlocks(graph, sortResult.order);

      const schedule = generator.generate(graph, sortResult.order, blockResult.blocks);
      const json = generator.exportToFormat(schedule, ScheduleFormat.JSON);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should export to Markdown', () => {
      graph.buildFromTasks(createSimpleTasks());
      const sorter = new TopologicalSorter();
      const blocker = new ParallelBlocker();

      const sortResult = sorter.sort(graph);
      const blockResult = blocker.createBlocks(graph, sortResult.order);

      const schedule = generator.generate(graph, sortResult.order, blockResult.blocks);
      const markdown = generator.exportToFormat(schedule, ScheduleFormat.MARKDOWN);

      expect(markdown).toContain('# Execution Schedule');
      expect(markdown).toContain('## Summary');
    });
  });
});

// ============================================================================
// DependencyResolver Integration Tests
// ============================================================================

describe('DependencyResolver (Integration)', () => {
  let resolver;

  beforeEach(() => {
    resolver = new DependencyResolver();
  });

  describe('full resolution', () => {
    it('should resolve simple tasks', async () => {
      const tasks = createSimpleTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(true);
      expect(result.isValid()).toBe(true);
      expect(result.sortedOrder.length).toBe(4);
      expect(result.schedule).toBeDefined();
    });

    it('should resolve parallel tasks', async () => {
      const tasks = createParallelTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(true);
      expect(result.metrics.maxParallelism).toBeGreaterThan(1);
    });

    it('should resolve complex tasks', async () => {
      const tasks = createComplexTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(true);
      expect(result.sortedOrder.length).toBe(11);
      expect(result.criticalPath).toBeDefined();
    });

    it('should detect cycles', async () => {
      const tasks = createCyclicTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('circular_dependency');
    });
  });

  describe('convenience methods', () => {
    it('should return just execution order', async () => {
      const tasks = createSimpleTasks();
      const order = await resolver.resolveOrder(tasks);

      expect(order).toEqual(['task-1', 'task-2', 'task-3', 'task-4']);
    });

    it('should return just blocks', async () => {
      const tasks = createParallelTasks();
      const blocks = await resolver.resolveBlocks(tasks);

      expect(blocks).toBeDefined();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should return just schedule', async () => {
      const tasks = createSimpleTasks();
      const schedule = await resolver.resolveSchedule(tasks);

      expect(schedule).toBeDefined();
      expect(schedule.status).toBe(ScheduleStatus.VALID);
    });
  });

  describe('validation', () => {
    it('should validate tasks without full resolution', () => {
      const tasks = createSimpleTasks();
      const validation = resolver.validateTasks(tasks);

      expect(validation.valid).toBe(true);
      expect(validation.taskCount).toBe(4);
    });

    it('should catch invalid tasks', () => {
      const tasks = createCyclicTasks();
      const validation = resolver.validateTasks(tasks);

      expect(validation.valid).toBe(false);
      expect(validation.cycles.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should respect custom options', async () => {
      resolver.configure({
        parallelStrategy: ParallelStrategy.CONSERVATIVE,
        sortAlgorithm: SortAlgorithm.DFS
      });

      const tasks = createParallelTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(true);
    });

    it('should respect resource constraints', async () => {
      resolver.setResourceConstraints({
        'code-agent': { maxConcurrent: 1 }
      });

      const tasks = createComplexTasks();
      const result = await resolver.resolve(tasks);

      expect(result.success).toBe(true);
      // Should have warnings about constraint violations if exceeded
    });
  });

  describe('events', () => {
    it('should emit resolution events', async () => {
      const events = [];
      resolver.on('resolution:start', () => events.push('start'));
      resolver.on('step:graph-built', () => events.push('graph'));
      resolver.on('step:sorted', () => events.push('sorted'));
      resolver.on('step:blocks-created', () => events.push('blocks'));
      resolver.on('resolution:complete', () => events.push('complete'));

      const tasks = createSimpleTasks();
      await resolver.resolve(tasks);

      expect(events).toContain('start');
      expect(events).toContain('complete');
    });
  });

  describe('metrics', () => {
    it('should track resolution metrics', async () => {
      const tasks = createComplexTasks();
      const result = await resolver.resolve(tasks);

      expect(result.metrics.taskCount).toBe(11);
      expect(result.metrics.dependencyCount).toBeGreaterThan(0);
      expect(result.metrics.resolutionTimeMs).toBeGreaterThan(0);
    });

    it('should track resolver statistics', async () => {
      await resolver.resolve(createSimpleTasks());
      await resolver.resolve(createParallelTasks());

      const stats = resolver.getStats();
      expect(stats.resolutionsPerformed).toBe(2);
    });
  });

  describe('JSON output', () => {
    it('should produce valid JSON output', async () => {
      const tasks = createComplexTasks();
      const result = await resolver.resolve(tasks);

      const json = result.toJSON();

      expect(json.success).toBe(true);
      expect(json.sorted_order.length).toBe(11);
      expect(json.schedule).toBeDefined();
      expect(json.metrics).toBeDefined();
    });
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  let resolver;

  beforeEach(() => {
    resolver = new DependencyResolver();
  });

  it('should handle empty task list', async () => {
    const result = await resolver.resolve([]);

    expect(result.success).toBe(true);
    expect(result.sortedOrder.length).toBe(0);
  });

  it('should handle single task', async () => {
    const result = await resolver.resolve([
      { id: 'only', title: 'Only Task', dependencies: [] }
    ]);

    expect(result.success).toBe(true);
    expect(result.sortedOrder).toEqual(['only']);
  });

  it('should handle missing dependency reference', async () => {
    const tasks = [
      { id: 'task-1', title: 'Task 1', dependencies: ['non-existent'] }
    ];

    // Should handle gracefully or warn
    const result = await resolver.resolve(tasks);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle tasks with no duration', async () => {
    const tasks = [
      { id: 'task-1', title: 'Task 1', dependencies: [] },
      { id: 'task-2', title: 'Task 2', dependencies: ['task-1'] }
    ];

    const result = await resolver.resolve(tasks);
    expect(result.success).toBe(true);
  });

  it('should handle self-dependency', async () => {
    const tasks = [
      { id: 'task-1', title: 'Task 1', dependencies: ['task-1'] }
    ];

    const result = await resolver.resolve(tasks);
    expect(result.success).toBe(false);
  });
});
