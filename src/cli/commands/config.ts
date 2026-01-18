/**
 * Config Command - Manage AgenticCoder configuration
 * 
 * Provides CLI commands for:
 * - config show - Display current configuration
 * - config init - Initialize default configuration
 * - config validate - Validate configuration file
 * - config set - Set a configuration value
 * - config get - Get a configuration value
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { ConfigLoader, DEFAULT_CONFIG } from '../../config';

export const configCommand = new Command('config')
  .description('Manage AgenticCoder configuration');

// config show
configCommand
  .command('show')
  .description('Display current configuration')
  .option('--section <section>', 'Show specific section')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const loader = ConfigLoader.getInstance();
      const result = await loader.load();

      if (options.json) {
        const configObj = result.config as unknown as Record<string, unknown>;
        const output = options.section
          ? configObj[options.section]
          : result.config;
        console.log(JSON.stringify(output, null, 2));
        return;
      }

      console.log(chalk.bold('\nAgenticCoder Configuration'));
      console.log(chalk.gray(`Source: ${result.source}`));
      console.log('─'.repeat(40));

      if (result.warnings?.length) {
        result.warnings.forEach(w => console.log(chalk.yellow(`⚠ ${w}`)));
      }

      if (options.section) {
        const configObj = result.config as unknown as Record<string, unknown>;
        const section = configObj[options.section];
        if (section) {
          console.log(`\n${chalk.cyan(options.section)}:`);
          console.log(JSON.stringify(section, null, 2));
        } else {
          console.log(chalk.red(`Section '${options.section}' not found`));
        }
      } else {
        console.log(JSON.stringify(result.config, null, 2));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), message);
      process.exit(1);
    }
  });

// config init
configCommand
  .command('init')
  .description('Initialize default configuration')
  .option('--force', 'Overwrite existing config')
  .action(async (options) => {
    try {
      const loader = ConfigLoader.getInstance();
      const configPath = '.agenticcoder/config.json';

      if (fs.existsSync(configPath) && !options.force) {
        console.log(chalk.yellow('Config file already exists.'));
        console.log('Use --force to overwrite.');
        return;
      }

      await loader.save(DEFAULT_CONFIG);
      console.log(chalk.green('✓ Configuration initialized'));
      console.log(chalk.gray(`  Created: ${configPath}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), message);
      process.exit(1);
    }
  });

// config validate
configCommand
  .command('validate')
  .description('Validate configuration file')
  .action(async () => {
    try {
      const loader = ConfigLoader.getInstance();
      const result = await loader.validate();

      if (result.valid) {
        console.log(chalk.green('✓ Configuration is valid'));
      } else {
        console.log(chalk.red('✗ Configuration is invalid'));
        result.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), message);
      process.exit(1);
    }
  });

// config set
configCommand
  .command('set <path> <value>')
  .description('Set a configuration value (e.g., "logging.level" "debug")')
  .action(async (configPath: string, value: string) => {
    try {
      const loader = ConfigLoader.getInstance();
      const config = await loader.getConfig();

      // Parse path and set value
      const parts = configPath.split('.');
      let current: Record<string, unknown> = config as unknown as Record<string, unknown>;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      // Parse value (try JSON first for booleans, numbers, objects)
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      current[parts[parts.length - 1]] = parsedValue;

      await loader.save(config);
      console.log(chalk.green(`✓ Set ${configPath} = ${value}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), message);
      process.exit(1);
    }
  });

// config get
configCommand
  .command('get <path>')
  .description('Get a configuration value (e.g., "logging.level")')
  .action(async (configPath: string) => {
    try {
      const loader = ConfigLoader.getInstance();
      const config = await loader.getConfig();

      const parts = configPath.split('.');
      let current: unknown = config;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          console.log(chalk.yellow(`Path '${configPath}' not found`));
          return;
        }
      }

      if (typeof current === 'object') {
        console.log(JSON.stringify(current, null, 2));
      } else {
        console.log(current);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), message);
      process.exit(1);
    }
  });
