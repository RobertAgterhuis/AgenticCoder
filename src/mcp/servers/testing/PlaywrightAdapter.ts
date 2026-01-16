/**
 * Playwright MCP Server Adapter
 * 
 * Provides browser automation and E2E testing via MCP
 * @module mcp/servers/testing/PlaywrightAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Playwright adapter configuration
 */
export interface PlaywrightAdapterConfig extends ServerAdapterConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
}

/**
 * Screenshot result
 */
export interface ScreenshotResult {
  path: string;
  base64?: string;
  width: number;
  height: number;
}

/**
 * Element result
 */
export interface ElementResult {
  found: boolean;
  text?: string;
  attributes?: Record<string, string>;
  visible?: boolean;
  enabled?: boolean;
}

/**
 * Page info
 */
export interface PageInfo {
  url: string;
  title: string;
  content?: string;
}

/**
 * Playwright MCP Server Adapter
 */
export class PlaywrightAdapter extends BaseServerAdapter {
  private browser: 'chromium' | 'firefox' | 'webkit';
  private headless: boolean;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<PlaywrightAdapterConfig>
  ) {
    super(clientManager, config);
    this.browser = config?.browser || 'chromium';
    this.headless = config?.headless ?? true;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'playwright';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'playwright',
      name: 'Playwright Server',
      description: 'Browser automation and E2E testing',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/playwright-mcp-server'],
      category: 'testing',
      enabled: true,
      tags: ['testing', 'e2e', 'browser'],
      env: {
        PLAYWRIGHT_BROWSER: this.browser,
        PLAYWRIGHT_HEADLESS: this.headless ? 'true' : 'false',
      },
    };
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string, options?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  }): Promise<PageInfo> {
    const response = await this.callTool('navigate', {
      url,
      wait_until: options?.waitUntil || 'load',
      timeout: options?.timeout,
    });
    
    if (!response.success) {
      throw new Error(`Failed to navigate: ${response.error?.message}`);
    }

    return response.result as PageInfo;
  }

  /**
   * Click on an element
   */
  async click(selector: string, options?: {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    timeout?: number;
  }): Promise<void> {
    const response = await this.callTool('click', {
      selector,
      button: options?.button || 'left',
      click_count: options?.clickCount || 1,
      timeout: options?.timeout,
    });
    
    if (!response.success) {
      throw new Error(`Failed to click: ${response.error?.message}`);
    }
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string, options?: {
    delay?: number;
    timeout?: number;
  }): Promise<void> {
    const response = await this.callTool('type', {
      selector,
      text,
      delay: options?.delay,
      timeout: options?.timeout,
    });
    
    if (!response.success) {
      throw new Error(`Failed to type: ${response.error?.message}`);
    }
  }

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string): Promise<void> {
    const response = await this.callTool('fill', { selector, value });
    
    if (!response.success) {
      throw new Error(`Failed to fill: ${response.error?.message}`);
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: {
    path?: string;
    fullPage?: boolean;
    selector?: string;
  }): Promise<ScreenshotResult> {
    const response = await this.callTool('screenshot', {
      path: options?.path,
      full_page: options?.fullPage ?? false,
      selector: options?.selector,
    });
    
    if (!response.success) {
      throw new Error(`Failed to take screenshot: ${response.error?.message}`);
    }

    return response.result as ScreenshotResult;
  }

  /**
   * Get element info
   */
  async getElement(selector: string): Promise<ElementResult> {
    const response = await this.callTool('get_element', { selector });
    
    if (!response.success) {
      throw new Error(`Failed to get element: ${response.error?.message}`);
    }

    return response.result as ElementResult;
  }

  /**
   * Get page content
   */
  async getContent(): Promise<string> {
    const response = await this.callTool('get_content', {});
    
    if (!response.success) {
      throw new Error(`Failed to get content: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    const response = await this.callTool('get_url', {});
    
    if (!response.success) {
      throw new Error(`Failed to get URL: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Wait for an element
   */
  async waitForSelector(selector: string, options?: {
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
    timeout?: number;
  }): Promise<void> {
    const response = await this.callTool('wait_for_selector', {
      selector,
      state: options?.state || 'visible',
      timeout: options?.timeout,
    });
    
    if (!response.success) {
      throw new Error(`Failed to wait for selector: ${response.error?.message}`);
    }
  }

  /**
   * Evaluate JavaScript in the page
   */
  async evaluate<T = unknown>(script: string): Promise<T> {
    const response = await this.callTool('evaluate', { script });
    
    if (!response.success) {
      throw new Error(`Failed to evaluate: ${response.error?.message}`);
    }

    return response.result as T;
  }

  /**
   * Select option from dropdown
   */
  async select(selector: string, value: string | string[]): Promise<void> {
    const response = await this.callTool('select', {
      selector,
      value: Array.isArray(value) ? value : [value],
    });
    
    if (!response.success) {
      throw new Error(`Failed to select: ${response.error?.message}`);
    }
  }

  /**
   * Hover over an element
   */
  async hover(selector: string): Promise<void> {
    const response = await this.callTool('hover', { selector });
    
    if (!response.success) {
      throw new Error(`Failed to hover: ${response.error?.message}`);
    }
  }

  /**
   * Press a keyboard key
   */
  async press(key: string): Promise<void> {
    const response = await this.callTool('press', { key });
    
    if (!response.success) {
      throw new Error(`Failed to press key: ${response.error?.message}`);
    }
  }
}

/**
 * Create a Playwright adapter
 */
export function createPlaywrightAdapter(
  clientManager: MCPClientManager,
  config?: Partial<PlaywrightAdapterConfig>
): PlaywrightAdapter {
  return new PlaywrightAdapter(clientManager, config);
}
