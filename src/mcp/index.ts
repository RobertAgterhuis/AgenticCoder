/**
 * MCP (Model Context Protocol) Integration Module
 * 
 * Provides comprehensive MCP server integration for AgenticCoder
 * 
 * @module mcp
 */

// Types
export * from './types';

// Errors
export * from './errors/MCPError';

// Utils
export { Logger, createLogger, configureLogger } from './utils/Logger';

// Registry (NEW)
export { AdapterRegistry, getRegistry } from './registry';
export type {
  AdapterCategory,
  AdapterMetadata,
  AdapterRegistration,
  AdapterStatus,
  AdapterFactory,
  RegistryEvent,
  ToolRequest,
  ToolResult,
} from './registry';

// Transport
export { BaseTransport } from './transport/BaseTransport';
export { StdioTransport } from './transport/StdioTransport';
export { TransportFactory } from './transport/TransportFactory';

// Health
export {
  CircuitBreaker,
  createCircuitBreaker,
  RetryPolicy,
  createRetryPolicy,
  NO_RETRY,
  HealthMonitor,
  createHealthMonitor,
} from './health';
export type {
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  RetryStrategy,
  RetryPolicyConfig,
  RetryAttemptInfo,
  RetryResult,
  ServerHealth,
  HealthCheckResult,
  AggregatedHealth,
} from './health';

// Core
export {
  MCPConnectionPool,
  createConnectionPool,
  MCPClientManager,
  createClientManager,
  MCPServerRegistry,
  createServerRegistry,
  DEFAULT_SERVERS,
  MCPServiceRegistry,
  createServiceRegistry,
} from './core';
export type {
  PoolStats,
  MCPClientManagerConfig,
  ServerFilter,
  RegistryStats,
  ToolCapability,
  AgentRequirements,
  ServiceBinding,
} from './core';

// Config
export {
  MCPConfigManager,
  createMCPConfigManager,
} from './config';
export type {
  MCPConfigFile,
  MCPServerConfig,
  MCPDefaultConfig,
  ConfigValidationResult,
  ConfigError,
  ConfigWarning,
} from './config';

// Binding
export {
  AgentMCPBinder,
  createAgentMCPBinder,
} from './binding';
export type {
  AgentCapabilityProfile,
  BoundAgent,
} from './binding';

// Integration
export {
  MCPGateway,
  createMCPGateway,
} from './integration/MCPGateway';

// Server Adapters - Official
export {
  FilesystemAdapter,
  createFilesystemAdapter,
  GitAdapter,
  createGitAdapter,
  MemoryAdapter,
  createMemoryAdapter,
  FetchAdapter,
  createFetchAdapter,
  SequentialThinkingAdapter,
  createSequentialThinkingAdapter,
} from './servers/official';

// Server Adapters - Security
export {
  GitGuardianAdapter,
  createGitGuardianAdapter,
  BoostSecurityAdapter,
  createBoostSecurityAdapter,
  SafeDepAdapter,
  createSafeDepAdapter,
} from './servers/security';

// Server Adapters - Deployment
export {
  GitHubAdapter,
  createGitHubAdapter,
  DockerAdapter,
  createDockerAdapter,
  AzureAdapter,
  createAzureAdapter,
  AzureDevOpsAdapter,
  createAzureDevOpsAdapter,
} from './servers/deployment';

// Server Adapters - Data
export {
  SQLiteAdapter,
  createSQLiteAdapter,
  RedisAdapter,
  createRedisAdapter,
} from './servers/data';

// Server Adapters - Testing
export {
  PlaywrightAdapter,
  createPlaywrightAdapter,
  APIMaticAdapter,
  createAPIMaticAdapter,
} from './servers/testing';

// Server Adapters - Documentation
export {
  MarkdownifyAdapter,
  createMarkdownifyAdapter,
  GitMCPAdapter,
  createGitMCPAdapter,
} from './servers/documentation';

// Server Adapters - Azure (Local Python MCP Servers)
export {
  AzurePricingMCPAdapter,
  createAzurePricingMCPAdapter,
  AzureResourceGraphMCPAdapter,
  createAzureResourceGraphMCPAdapter,
  MicrosoftDocsMCPAdapter,
  createMicrosoftDocsMCPAdapter,
} from './servers/azure';

// Bridge for JavaScript agents
export {
  MCPBridge,
  createMCPBridge,
} from './bridge';

// Base adapter for custom implementations
export { BaseServerAdapter } from './servers/BaseServerAdapter';

/**
 * Create and initialize the complete MCP infrastructure
 */
export async function createMCPInfrastructure(config?: {
  enableDefaultServers?: boolean;
  autoInitialize?: boolean;
}) {
  const { createClientManager } = await import('./core/MCPClientManager');
  const { createServerRegistry, DEFAULT_SERVERS } = await import('./core/MCPServerRegistry');
  const { createServiceRegistry } = await import('./core/MCPServiceRegistry');
  const { createHealthMonitor } = await import('./health/HealthMonitor');

  const serverRegistry = createServerRegistry();
  const clientManager = createClientManager();
  const serviceRegistry = createServiceRegistry(clientManager, serverRegistry);
  const healthMonitor = createHealthMonitor(clientManager);

  // Register default servers if requested
  if (config?.enableDefaultServers !== false) {
    for (const server of DEFAULT_SERVERS) {
      serverRegistry.register(server);
    }
  }

  // Initialize if requested
  if (config?.autoInitialize !== false) {
    await clientManager.initialize();
    
    // Register enabled servers with client manager
    for (const server of serverRegistry.getEnabled()) {
      await clientManager.registerServer(server);
    }

    await serviceRegistry.initialize();
    healthMonitor.start();
  }

  return {
    serverRegistry,
    clientManager,
    serviceRegistry,
    healthMonitor,
    
    // Convenience methods
    async shutdown() {
      healthMonitor.stop();
      await serviceRegistry.shutdown();
      await clientManager.shutdown();
    },
  };
}

/**
 * Create a fully configured MCP Gateway with all adapters
 */
export async function createFullMCPGateway(options?: {
  configPath?: string;
  enabledCategories?: Array<'official' | 'security' | 'deployment' | 'data' | 'testing' | 'documentation'>;
}) {
  const { createMCPGateway } = await import('./integration/MCPGateway');
  const { createMCPConfigManager } = await import('./config/MCPConfigManager');
  const { createAgentMCPBinder } = await import('./binding/AgentMCPBinder');

  // Create and configure gateway
  const gateway = createMCPGateway();
  const configManager = createMCPConfigManager();
  
  // Load config if path provided
  if (options?.configPath) {
    await configManager.loadConfig(options.configPath);
  }

  // Initialize gateway
  await gateway.initialize();

  // Create agent binder
  const agentBinder = createAgentMCPBinder(gateway);

  return {
    gateway,
    configManager,
    agentBinder,

    // Convenience: Bind standard agents
    async bindCodeAgent(agentId: string) {
      const profile = (await import('./binding/AgentMCPBinder')).AgentMCPBinder.createStandardProfile(agentId, 'code');
      return agentBinder.bindAgent(agentId, profile);
    },

    async bindDevOpsAgent(agentId: string) {
      const profile = (await import('./binding/AgentMCPBinder')).AgentMCPBinder.createStandardProfile(agentId, 'devops');
      return agentBinder.bindAgent(agentId, profile);
    },

    async bindSecurityAgent(agentId: string) {
      const profile = (await import('./binding/AgentMCPBinder')).AgentMCPBinder.createStandardProfile(agentId, 'security');
      return agentBinder.bindAgent(agentId, profile);
    },

    async bindTestingAgent(agentId: string) {
      const profile = (await import('./binding/AgentMCPBinder')).AgentMCPBinder.createStandardProfile(agentId, 'testing');
      return agentBinder.bindAgent(agentId, profile);
    },

    async bindDocumentationAgent(agentId: string) {
      const profile = (await import('./binding/AgentMCPBinder')).AgentMCPBinder.createStandardProfile(agentId, 'documentation');
      return agentBinder.bindAgent(agentId, profile);
    },

    // Shutdown all
    async shutdown() {
      await gateway.shutdown();
    },
  };
}
