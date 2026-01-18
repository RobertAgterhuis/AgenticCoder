/**
 * Status Command
 * 
 * Shows the current status of an AgenticCoder project.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export const statusCommand = new Command('status')
  .description('Show AgenticCoder project status')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const targetDir = path.resolve(options.directory);
    
    if (!options.json) {
      console.log(chalk.bold('\n📊 AgenticCoder Project Status\n'));
    }
    
    const status = {
      project: {
        valid: false,
        name: '',
        version: '',
        template: ''
      },
      config: {
        exists: false,
        path: '',
        settings: {} as Record<string, unknown>
      },
      agents: {
        configured: 0,
        enabled: 0,
        list: [] as string[]
      },
      files: {
        total: 0,
        generated: 0,
        source: 0
      },
      security: {
        enabled: false,
        lastScan: null as string | null,
        issues: 0
      },
      mcp: {
        enabled: false,
        adapters: 0,
        tools: 0
      }
    };
    
    try {
      // Check for .agentic directory
      const agenticDir = path.join(targetDir, '.agentic');
      const configPath = path.join(agenticDir, 'config.json');
      
      if (fs.existsSync(configPath)) {
        status.config.exists = true;
        status.config.path = configPath;
        
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          status.project.valid = true;
          status.project.name = config.projectName || 'Unknown';
          status.project.version = config.version || '0.0.0';
          status.project.template = config.template || 'custom';
          status.config.settings = config.settings || {};
          
          // Check agents configuration
          if (config.agents) {
            const agentNames = Object.keys(config.agents);
            status.agents.configured = agentNames.length;
            status.agents.list = agentNames;
            status.agents.enabled = agentNames.filter(
              name => config.agents[name]?.enabled
            ).length;
          }
          
          // Check security settings
          if (config.settings?.securityEnabled !== false) {
            status.security.enabled = true;
          }
          
          // Check MCP settings
          if (config.settings?.mcpEnabled !== false) {
            status.mcp.enabled = true;
          }
        } catch (e) {
          // Invalid config
        }
      }
      
      // Count files
      const srcDir = path.join(targetDir, 'src');
      const generatedDir = path.join(targetDir, 'src', 'generated');
      
      if (fs.existsSync(srcDir)) {
        status.files.source = countFiles(srcDir);
      }
      
      if (fs.existsSync(generatedDir)) {
        status.files.generated = countFiles(generatedDir);
      }
      
      status.files.total = status.files.source;
      
      // Check for last scan results
      const scanReportPath = path.join(agenticDir, 'last-scan.json');
      if (fs.existsSync(scanReportPath)) {
        try {
          const scanReport = JSON.parse(fs.readFileSync(scanReportPath, 'utf-8'));
          status.security.lastScan = scanReport.timestamp;
          status.security.issues = scanReport.issues?.length || 0;
        } catch (e) {
          // Invalid scan report
        }
      }
      
      // Try to get MCP info
      try {
        const mcpConfigPath = path.join(targetDir, 'mcp.json');
        if (fs.existsSync(mcpConfigPath)) {
          const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
          status.mcp.adapters = mcpConfig.adapters?.length || 0;
          status.mcp.tools = mcpConfig.tools?.length || 0;
        }
      } catch (e) {
        // No MCP config
      }
      
      // Output
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        // Project Info
        if (status.project.valid) {
          console.log(chalk.green('  ✓ Valid AgenticCoder project\n'));
          console.log(chalk.bold('  Project'));
          console.log(chalk.gray(`    Name: ${status.project.name}`));
          console.log(chalk.gray(`    Version: ${status.project.version}`));
          console.log(chalk.gray(`    Template: ${status.project.template}`));
        } else {
          console.log(chalk.yellow('  ⚠ No AgenticCoder project found\n'));
          console.log(chalk.gray('  Run `agentic init` to initialize a project.\n'));
          return;
        }
        
        // Config
        console.log(chalk.bold('\n  Configuration'));
        console.log(chalk.gray(`    Path: ${status.config.path}`));
        
        // Agents
        console.log(chalk.bold('\n  Agents'));
        console.log(chalk.gray(`    Configured: ${status.agents.configured}`));
        console.log(chalk.gray(`    Enabled: ${status.agents.enabled}`));
        if (status.agents.list.length > 0) {
          console.log(chalk.gray(`    List: ${status.agents.list.join(', ')}`));
        }
        
        // Files
        console.log(chalk.bold('\n  Files'));
        console.log(chalk.gray(`    Source files: ${status.files.source}`));
        console.log(chalk.gray(`    Generated: ${status.files.generated}`));
        
        // Security
        console.log(chalk.bold('\n  Security'));
        console.log(chalk.gray(`    Enabled: ${status.security.enabled ? 'Yes' : 'No'}`));
        if (status.security.lastScan) {
          console.log(chalk.gray(`    Last Scan: ${status.security.lastScan}`));
          console.log(chalk.gray(`    Issues: ${status.security.issues}`));
        } else {
          console.log(chalk.gray('    Last Scan: Never'));
        }
        
        // MCP
        console.log(chalk.bold('\n  MCP Integration'));
        console.log(chalk.gray(`    Enabled: ${status.mcp.enabled ? 'Yes' : 'No'}`));
        if (status.mcp.adapters > 0) {
          console.log(chalk.gray(`    Adapters: ${status.mcp.adapters}`));
          console.log(chalk.gray(`    Tools: ${status.mcp.tools}`));
        }
        
        // Recommendations
        console.log(chalk.bold('\n  Recommendations'));
        if (!status.security.lastScan) {
          console.log(chalk.cyan('    • Run `agentic scan` to check for security issues'));
        }
        if (status.files.source === 0) {
          console.log(chalk.cyan('    • Run `agentic generate` to generate code'));
        }
        console.log('');
      }
      
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }));
      } else {
        console.error(chalk.red('\n❌ Status check failed:'), (error as Error).message);
      }
      process.exit(1);
    }
  });

/**
 * Count files in a directory recursively
 */
function countFiles(dir: string): number {
  let count = 0;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      if (entry.isDirectory()) {
        count += countFiles(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        count++;
      }
    }
  } catch (e) {
    // Directory not accessible
  }
  
  return count;
}
