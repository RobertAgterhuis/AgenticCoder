/**
 * Central Configuration Types
 * @module config/types
 */

export interface AgenticConfig {
  version: string;
  project?: ProjectConfig;
  azure?: AzureConfig;
  mcp?: MCPConfig;
  security?: SecurityConfig;
  state?: StateConfig;
  logging?: LoggingConfig;
}

export interface ProjectConfig {
  name: string;
  description?: string;
}

export interface AzureConfig {
  defaultTenantId?: string;
  defaultSubscriptionId?: string;
  keyVault?: KeyVaultConfig;
  tenants?: TenantConfig[];
}

export interface KeyVaultConfig {
  vaultUri?: string;
  enabled: boolean;
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  subscriptions: SubscriptionConfig[];
}

export interface SubscriptionConfig {
  subscriptionId: string;
  name: string;
  isDefault?: boolean;
}

export interface MCPConfig {
  servers?: MCPServerGroups;
  transport?: 'stdio' | 'sse' | 'websocket';
  timeout?: number;
}

export interface MCPServerGroups {
  security?: MCPServerGroup;
  azure?: MCPServerGroup;
  official?: MCPServerGroup;
  data?: MCPServerGroup;
  testing?: MCPServerGroup;
  deployment?: MCPServerGroup;
  documentation?: MCPServerGroup;
}

export interface MCPServerGroup {
  [serverName: string]: MCPServerConfig;
}

export interface MCPServerConfig {
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface SecurityConfig {
  scanning?: ScanningConfig;
  audit?: AuditConfig;
}

export interface ScanningConfig {
  enabled: boolean;
  failOnSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditConfig {
  enabled: boolean;
  logPath: string;
}

export interface StateConfig {
  persistPath: string;
  cacheEnabled: boolean;
  cacheTTL?: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  outputPath?: string;
}

// Default configuration
export const DEFAULT_CONFIG: AgenticConfig = {
  version: '1.0.0',
  project: {
    name: 'AgenticCoder',
  },
  mcp: {
    transport: 'stdio',
    timeout: 30000,
    servers: {
      security: {
        gitguardian: { enabled: false },
        boostsecurity: { enabled: false },
        safedep: { enabled: false },
      },
      azure: {
        pricing: { enabled: false },
        resourcegraph: { enabled: false },
      },
    },
  },
  security: {
    scanning: {
      enabled: true,
      failOnSeverity: 'high',
    },
    audit: {
      enabled: true,
      logPath: '.agenticcoder/audit',
    },
  },
  state: {
    persistPath: '.agenticcoder/state',
    cacheEnabled: true,
    cacheTTL: 3600,
  },
  logging: {
    level: 'info',
    format: 'json',
  },
};

export const CONFIG_FILE_NAME = 'config.json';
export const CONFIG_DIR = '.agenticcoder';
export const CONFIG_PATH = `${CONFIG_DIR}/${CONFIG_FILE_NAME}`;
