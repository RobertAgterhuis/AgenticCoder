#!/usr/bin/env node
/**
 * AgenticCoder CLI
 * 
 * Main entry point for the AgenticCoder command-line interface.
 * Provides commands for configuration, security scanning, and code generation.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { 
  configCommand, 
  registerToolsCommands, 
  registerHealthCommands,
  initCommand,
  generateCommand,
  scanCommand,
  statusCommand,
  azureCommand
} from './commands';

const program = new Command();

program
  .name('agentic')
  .description('AgenticCoder - MCP-powered coding agent framework')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--debug', 'Enable debug mode');

// Add commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(scanCommand);
program.addCommand(statusCommand);
program.addCommand(configCommand);
program.addCommand(azureCommand);
registerToolsCommands(program);
registerHealthCommands(program);

// Default action - show help
program.action(() => {
  console.log(chalk.bold('\n🤖 AgenticCoder CLI\n'));
  console.log('Use --help to see available commands.\n');
  program.outputHelp();
});

// Error handling
program.showHelpAfterError();
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

// Parse arguments
program.parse();
