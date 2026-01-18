/**
 * Documentation MCP Server Adapters
 * @module mcp/servers/documentation
 */

export { MarkdownifyAdapter, createMarkdownifyAdapter } from './MarkdownifyAdapter';
export type { MarkdownifyAdapterConfig, ConversionResult } from './MarkdownifyAdapter';

export { GitMCPAdapter, createGitMCPAdapter } from './GitMCPAdapter';
export type { RepositoryInfo, DocFileType } from './GitMCPAdapter';

export { DocumentationGeneratorAdapter, createDocumentationGeneratorAdapter } from './DocumentationGeneratorAdapter';
export type { DocConfig, DocResult } from './DocumentationGeneratorAdapter';
