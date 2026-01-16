/**
 * Testing MCP Server Adapters
 * @module mcp/servers/testing
 */

export { PlaywrightAdapter, createPlaywrightAdapter } from './PlaywrightAdapter';
export type { PlaywrightAdapterConfig, ScreenshotResult, ElementResult, PageInfo } from './PlaywrightAdapter';

export { APIMaticAdapter, createAPIMaticAdapter } from './APIMaticAdapter';
export type { 
  APISpecFormat, 
  SDKLanguage, 
  DocFormat, 
  APIValidationResult, 
  APIValidationError, 
  APIValidationWarning 
} from './APIMaticAdapter';
