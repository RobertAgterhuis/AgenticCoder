/**
 * Markdownify MCP Server Adapter
 * 
 * Provides HTML to Markdown conversion via MCP
 * @module mcp/servers/documentation/MarkdownifyAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Markdownify adapter configuration
 */
export interface MarkdownifyAdapterConfig extends ServerAdapterConfig {
  // No additional config needed
}

/**
 * Conversion result
 */
export interface ConversionResult {
  markdown: string;
  title?: string;
  metadata?: Record<string, string>;
}

/**
 * Markdownify MCP Server Adapter
 */
export class MarkdownifyAdapter extends BaseServerAdapter {
  constructor(
    clientManager: MCPClientManager,
    config?: Partial<MarkdownifyAdapterConfig>
  ) {
    super(clientManager, config);
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'markdownify';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'markdownify',
      name: 'Markdownify Server',
      description: 'HTML to Markdown conversion',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/markdownify-mcp-server'],
      category: 'documentation',
      enabled: true,
      tags: ['documentation', 'markdown', 'conversion'],
    };
  }

  /**
   * Convert HTML to Markdown
   */
  async convert(html: string, options?: {
    includeTitle?: boolean;
    preserveLinks?: boolean;
    codeBlockStyle?: 'fenced' | 'indented';
  }): Promise<ConversionResult> {
    const response = await this.callTool('convert_html_to_markdown', {
      html,
      include_title: options?.includeTitle ?? true,
      preserve_links: options?.preserveLinks ?? true,
      code_block_style: options?.codeBlockStyle || 'fenced',
    });
    
    if (!response.success) {
      throw new Error(`Failed to convert: ${response.error?.message}`);
    }

    return response.result as ConversionResult;
  }

  /**
   * Convert URL to Markdown
   */
  async convertUrl(url: string, options?: {
    includeTitle?: boolean;
    preserveLinks?: boolean;
    selector?: string;
  }): Promise<ConversionResult> {
    const response = await this.callTool('convert_url_to_markdown', {
      url,
      include_title: options?.includeTitle ?? true,
      preserve_links: options?.preserveLinks ?? true,
      selector: options?.selector,
    });
    
    if (!response.success) {
      throw new Error(`Failed to convert URL: ${response.error?.message}`);
    }

    return response.result as ConversionResult;
  }

  /**
   * Extract main content from HTML
   */
  async extractContent(html: string): Promise<string> {
    const response = await this.callTool('extract_content', { html });
    
    if (!response.success) {
      throw new Error(`Failed to extract content: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Clean HTML before conversion
   */
  async cleanHtml(html: string, options?: {
    removeScripts?: boolean;
    removeStyles?: boolean;
    removeComments?: boolean;
  }): Promise<string> {
    const response = await this.callTool('clean_html', {
      html,
      remove_scripts: options?.removeScripts ?? true,
      remove_styles: options?.removeStyles ?? true,
      remove_comments: options?.removeComments ?? true,
    });
    
    if (!response.success) {
      throw new Error(`Failed to clean HTML: ${response.error?.message}`);
    }

    return response.result as string;
  }
}

/**
 * Create a Markdownify adapter
 */
export function createMarkdownifyAdapter(
  clientManager: MCPClientManager,
  config?: Partial<MarkdownifyAdapterConfig>
): MarkdownifyAdapter {
  return new MarkdownifyAdapter(clientManager, config);
}
