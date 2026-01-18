/**
 * Tools CLI Commands
 * @module cli/commands/tools
 * 
 * Commands for listing and invoking MCP tools from the command line.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { AdapterRegistry } from '../../mcp/registry';

/**
 * Register tools commands
 */
export function registerToolsCommands(program: Command): void {
  const tools = program
    .command('tools')
    .description('Manage and invoke MCP tools');
    
  tools
    .command('list')
    .description('List available MCP tools')
    .option('-c, --category <category>', 'Filter by category')
    .option('-a, --adapter <adapter>', 'Filter by adapter')
    .option('--json', 'Output as JSON')
    .action(async (options: { category?: string; adapter?: string; json?: boolean }) => {
      try {
        const registry = AdapterRegistry.getInstance();
        await registry.initialize();
        
        let tools = registry.listTools();
        
        // Filter by category
        if (options.category) {
          const adapters = registry.listAdapters()
            .filter(a => a.category === options.category);
          const adapterIds = new Set(adapters.map(a => a.id));
          tools = tools.filter(t => adapterIds.has(t.adapter));
        }
        
        // Filter by adapter
        if (options.adapter) {
          tools = tools.filter(t => t.adapter === options.adapter);
        }
        
        if (options.json) {
          console.log(JSON.stringify(tools, null, 2));
          return;
        }
        
        if (tools.length === 0) {
          console.log(chalk.yellow('No tools found matching criteria'));
          return;
        }
        
        console.log(chalk.bold('\n📦 Available MCP Tools\n'));
        console.log(chalk.dim('─'.repeat(60)));
        
        // Group by adapter
        const grouped = new Map<string, typeof tools>();
        for (const tool of tools) {
          if (!grouped.has(tool.adapter)) {
            grouped.set(tool.adapter, []);
          }
          grouped.get(tool.adapter)!.push(tool);
        }
        
        for (const [adapter, adapterTools] of grouped) {
          console.log(chalk.cyan(`\n[${adapter}]`));
          for (const tool of adapterTools) {
            console.log(`  ${chalk.green('•')} ${chalk.white(tool.tool)}`);
            if (tool.description) {
              console.log(`    ${chalk.dim(tool.description)}`);
            }
          }
        }
        
        console.log(chalk.dim('\n─'.repeat(60)));
        console.log(chalk.dim(`Total: ${tools.length} tools from ${grouped.size} adapters`));
        
      } catch (error) {
        console.error(chalk.red('Error listing tools:'), error);
        process.exit(1);
      }
    });
    
  tools
    .command('adapters')
    .description('List registered adapters')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        const registry = AdapterRegistry.getInstance();
        await registry.initialize();
        
        const adapters = registry.listAdapters();
        
        if (options.json) {
          console.log(JSON.stringify(adapters, null, 2));
          return;
        }
        
        console.log(chalk.bold('\n🔌 Registered Adapters\n'));
        console.log(chalk.dim('─'.repeat(60)));
        
        // Group by category
        const grouped = new Map<string, typeof adapters>();
        for (const adapter of adapters) {
          if (!grouped.has(adapter.category)) {
            grouped.set(adapter.category, []);
          }
          grouped.get(adapter.category)!.push(adapter);
        }
        
        for (const [category, categoryAdapters] of grouped) {
          console.log(chalk.cyan(`\n[${category}]`));
          for (const adapter of categoryAdapters) {
            console.log(`  ${chalk.green('•')} ${chalk.white(adapter.name)} (${adapter.id})`);
            console.log(`    ${chalk.dim(`Tools: ${adapter.tools.join(', ')}`)}`);
          }
        }
        
        console.log(chalk.dim('\n─'.repeat(60)));
        console.log(chalk.dim(`Total: ${adapters.length} adapters`));
        
      } catch (error) {
        console.error(chalk.red('Error listing adapters:'), error);
        process.exit(1);
      }
    });
    
  tools
    .command('invoke <tool>')
    .description('Invoke an MCP tool')
    .option('-p, --params <json>', 'Tool parameters as JSON')
    .option('--json', 'Output as JSON')
    .action(async (toolName: string, options: { params?: string; json?: boolean }) => {
      try {
        const registry = AdapterRegistry.getInstance();
        await registry.initialize();
        
        if (!registry.hasTool(toolName)) {
          console.error(chalk.red(`Tool not found: ${toolName}`));
          console.log(chalk.dim('Use "agentic tools list" to see available tools'));
          process.exit(1);
        }
        
        let params: Record<string, unknown> = {};
        if (options.params) {
          try {
            params = JSON.parse(options.params);
          } catch (e) {
            console.error(chalk.red('Invalid JSON in --params'));
            process.exit(1);
          }
        }
        
        console.log(chalk.dim(`Invoking ${toolName}...`));
        
        const result = await registry.invokeTool({
          tool: toolName,
          params,
        });
        
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        
        if (result.success) {
          console.log(chalk.green('\n✅ Tool executed successfully\n'));
          console.log(chalk.bold('Result:'));
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(chalk.red('\n❌ Tool execution failed\n'));
          console.log(chalk.red('Error:'), result.error);
        }
        
      } catch (error) {
        console.error(chalk.red('Error invoking tool:'), error);
        process.exit(1);
      }
    });
    
  tools
    .command('categories')
    .description('List tool categories')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        const registry = AdapterRegistry.getInstance();
        await registry.initialize();
        
        const adapters = registry.listAdapters();
        
        // Count adapters per category
        const categoryCounts = new Map<string, number>();
        for (const adapter of adapters) {
          categoryCounts.set(
            adapter.category,
            (categoryCounts.get(adapter.category) || 0) + 1
          );
        }
        
        const categories = Array.from(categoryCounts.entries()).map(([name, count]) => ({
          name,
          adapterCount: count,
        }));
        
        if (options.json) {
          console.log(JSON.stringify(categories, null, 2));
          return;
        }
        
        console.log(chalk.bold('\n📂 Tool Categories\n'));
        console.log(chalk.dim('─'.repeat(40)));
        
        for (const cat of categories) {
          console.log(`  ${chalk.cyan('•')} ${chalk.white(cat.name)} ${chalk.dim(`(${cat.adapterCount} adapters)`)}`);
        }
        
        console.log(chalk.dim('\n─'.repeat(40)));
        
      } catch (error) {
        console.error(chalk.red('Error listing categories:'), error);
        process.exit(1);
      }
    });
}
