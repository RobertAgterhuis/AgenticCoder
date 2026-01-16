/**
 * Health Monitor
 * 
 * Monitors health of MCP servers and reports status
 * @module mcp/health/HealthMonitor
 */

import { EventEmitter } from 'events';
import { MCPClientManager } from '../core/MCPClientManager';
import { ServerStatus, HealthCheckConfig, DEFAULT_HEALTH_CHECK_CONFIG } from '../types';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Server health status
 */
export interface ServerHealth {
  serverId: string;
  status: ServerStatus;
  lastCheck: Date | null;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  consecutiveFailures: number;
  latencyMs: number | null;
  errorMessage: string | null;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  serverId: string;
  healthy: boolean;
  latencyMs: number;
  timestamp: Date;
  error?: string;
}

/**
 * Aggregated health status
 */
export interface AggregatedHealth {
  totalServers: number;
  healthyServers: number;
  degradedServers: number;
  unhealthyServers: number;
  averageLatencyMs: number;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Health Monitor
 */
export class HealthMonitor extends EventEmitter {
  private config: HealthCheckConfig;
  private clientManager: MCPClientManager;
  private healthStatus: Map<string, ServerHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private running: boolean = false;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<HealthCheckConfig>
  ) {
    super();
    this.clientManager = clientManager;
    this.config = { ...DEFAULT_HEALTH_CHECK_CONFIG, ...config };
    this.logger = createLogger('HealthMonitor');
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.running) {
      this.logger.warn('Health monitor already running');
      return;
    }

    this.logger.info('Starting health monitor', {
      interval: this.config.intervalMs,
      timeout: this.config.timeoutMs,
    });

    this.running = true;

    // Initialize health status for all servers
    for (const serverId of this.clientManager.getServerIds()) {
      this.initializeServerHealth(serverId);
    }

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServers();
    }, this.config.intervalMs);

    // Perform initial check
    this.checkAllServers();

    this.emit('started');
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.logger.info('Stopping health monitor');
    this.running = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.emit('stopped');
  }

  /**
   * Check health of all servers
   */
  async checkAllServers(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    const serverIds = this.clientManager.getServerIds();
    
    await Promise.all(
      serverIds.map(async (serverId) => {
        const result = await this.checkServer(serverId);
        results.set(serverId, result);
      })
    );

    return results;
  }

  /**
   * Check health of a specific server
   */
  async checkServer(serverId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    let health = this.healthStatus.get(serverId);
    if (!health) {
      health = this.initializeServerHealth(serverId);
    }

    try {
      // Get tools as a health check (validates connection and protocol)
      await this.clientManager.getTools(serverId, true);
      
      const latencyMs = Date.now() - startTime;

      // Update health status
      health.status = 'connected';
      health.lastCheck = timestamp;
      health.lastSuccess = timestamp;
      health.latencyMs = latencyMs;
      health.consecutiveFailures = 0;
      health.errorMessage = null;

      const result: HealthCheckResult = {
        serverId,
        healthy: true,
        latencyMs,
        timestamp,
      };

      this.emit('healthCheck', result);
      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      // Update health status
      health.lastCheck = timestamp;
      health.lastFailure = timestamp;
      health.latencyMs = latencyMs;
      health.consecutiveFailures++;
      health.errorMessage = errorMessage;

      // Determine status based on consecutive failures
      if (health.consecutiveFailures >= this.config.unhealthyThreshold) {
        health.status = 'error';
      } else if (health.consecutiveFailures >= this.config.degradedThreshold) {
        health.status = 'degraded';
      }

      const result: HealthCheckResult = {
        serverId,
        healthy: false,
        latencyMs,
        timestamp,
        error: errorMessage,
      };

      this.logger.warn(`Health check failed for ${serverId}`, {
        consecutiveFailures: health.consecutiveFailures,
        error: errorMessage,
      });

      this.emit('healthCheck', result);
      this.emit('unhealthy', serverId, result);

      return result;
    }
  }

  /**
   * Get health status for a server
   */
  getServerHealth(serverId: string): ServerHealth | undefined {
    return this.healthStatus.get(serverId);
  }

  /**
   * Get health status for all servers
   */
  getAllServerHealth(): Map<string, ServerHealth> {
    return new Map(this.healthStatus);
  }

  /**
   * Get aggregated health status
   */
  getAggregatedHealth(): AggregatedHealth {
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const health of this.healthStatus.values()) {
      switch (health.status) {
        case 'connected':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'error':
        case 'disconnected':
          unhealthyCount++;
          break;
      }

      if (health.latencyMs !== null) {
        totalLatency += health.latencyMs;
        latencyCount++;
      }
    }

    const totalServers = this.healthStatus.size;
    const averageLatencyMs = latencyCount > 0 ? totalLatency / latencyCount : 0;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      totalServers,
      healthyServers: healthyCount,
      degradedServers: degradedCount,
      unhealthyServers: unhealthyCount,
      averageLatencyMs,
      overallStatus,
    };
  }

  /**
   * Check if a server is healthy
   */
  isServerHealthy(serverId: string): boolean {
    const health = this.healthStatus.get(serverId);
    return health?.status === 'connected';
  }

  /**
   * Get healthy servers
   */
  getHealthyServers(): string[] {
    const healthy: string[] = [];
    for (const [serverId, health] of this.healthStatus.entries()) {
      if (health.status === 'connected') {
        healthy.push(serverId);
      }
    }
    return healthy;
  }

  /**
   * Register a new server for monitoring
   */
  registerServer(serverId: string): void {
    if (!this.healthStatus.has(serverId)) {
      this.initializeServerHealth(serverId);
      
      if (this.running) {
        // Perform immediate health check
        this.checkServer(serverId);
      }
    }
  }

  /**
   * Unregister a server from monitoring
   */
  unregisterServer(serverId: string): void {
    this.healthStatus.delete(serverId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart if running to apply new interval
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  /**
   * Initialize health status for a server
   */
  private initializeServerHealth(serverId: string): ServerHealth {
    const health: ServerHealth = {
      serverId,
      status: 'disconnected',
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      latencyMs: null,
      errorMessage: null,
    };

    this.healthStatus.set(serverId, health);
    return health;
  }
}

/**
 * Create a health monitor
 */
export function createHealthMonitor(
  clientManager: MCPClientManager,
  config?: Partial<HealthCheckConfig>
): HealthMonitor {
  return new HealthMonitor(clientManager, config);
}
