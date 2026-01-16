/**
 * Deployment MCP Server Adapters
 * @module mcp/servers/deployment
 */

export { GitHubAdapter, createGitHubAdapter } from './GitHubAdapter';
export type { GitHubAdapterConfig, Repository, Issue, PullRequest } from './GitHubAdapter';

export { DockerAdapter, createDockerAdapter } from './DockerAdapter';
export type { DockerAdapterConfig, Container, DockerImage, BuildResult } from './DockerAdapter';

export { AzureAdapter, createAzureAdapter } from './AzureAdapter';
export type { AzureResourceType, AzureRegion, AzureResource, AzureDeploymentResult } from './AzureAdapter';

export { AzureDevOpsAdapter, createAzureDevOpsAdapter } from './AzureDevOpsAdapter';
export type { 
  WorkItemType, 
  WorkItemState, 
  PipelineStatus, 
  WorkItem, 
  Pipeline, 
  PipelineRun 
} from './AzureDevOpsAdapter';
