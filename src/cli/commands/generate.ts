/**
 * Generate Command
 * 
 * Runs code generation using AgenticCoder's code generation engine.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export const generateCommand = new Command('generate')
  .description('Generate code using AgenticCoder')
  .option('-s, --scenario <scenario>', 'Scenario ID (S01-S05)', 'S01')
  .option('-n, --name <name>', 'Project name for generated code')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--dry-run', 'Preview generation without writing files')
  .option('--no-security', 'Disable security scanning')
  .action(async (options) => {
    console.log(chalk.bold('\n🔧 AgenticCoder Code Generation\n'));
    
    const startTime = Date.now();
    
    console.log(chalk.gray(`  Scenario: ${options.scenario}`));
    console.log(chalk.gray(`  Output: ${options.output}`));
    console.log(chalk.gray(`  Dry Run: ${options.dryRun ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Security: ${options.security ? 'Enabled' : 'Disabled'}\n`));
    
    try {
      // Load project config if exists
      const configPath = path.resolve('.agentic', 'config.json');
      let projectConfig: Record<string, unknown> = {};
      
      if (fs.existsSync(configPath)) {
        projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(chalk.gray(`  Config: ${configPath}`));
      }
      
      // Determine project name
      const projectName = options.name || 
        (projectConfig.projectName as string) || 
        path.basename(process.cwd());
      
      console.log(chalk.gray(`  Project: ${projectName}\n`));
      
      // Try to load the code generation engine
      console.log(chalk.cyan('  ⏳ Loading code generation engine...'));
      
      let CodeGenerationEngine;
      try {
        // Try loading from dist first (TypeScript compiled)
        const distPath = path.resolve(__dirname, '../../../agents/core/generation/CodeGenerationEngine.js');
        if (fs.existsSync(distPath)) {
          CodeGenerationEngine = require(distPath);
        } else {
          // Fallback to direct import
          const modulePath = path.resolve(process.cwd(), 'agents/core/generation/CodeGenerationEngine.js');
          if (fs.existsSync(modulePath)) {
            CodeGenerationEngine = require(modulePath);
          }
        }
      } catch (e) {
        // Engine not available
      }
      
      if (CodeGenerationEngine) {
        console.log(chalk.green('  ✓ Code generation engine loaded'));
        
        const engine = new CodeGenerationEngine({
          outputRoot: options.output,
          dryRun: options.dryRun,
          securityEnabled: options.security
        });
        
        // Prepare generation config
        const genConfig = {
          projectName,
          scenario: options.scenario,
          requirements: {
            name: projectName,
            ...(projectConfig.requirements as Record<string, unknown> || {})
          },
          techStack: projectConfig.techStack || {}
        };
        
        console.log(chalk.cyan('  ⏳ Running code generation...'));
        
        const context = await engine.generate(genConfig);
        
        // Report results
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(chalk.bold.green(`\n✅ Generation complete in ${elapsed}s\n`));
        
        if (context.generatedFiles && context.generatedFiles.length > 0) {
          console.log(chalk.gray('Generated files:'));
          for (const file of context.generatedFiles.slice(0, 10)) {
            console.log(chalk.green(`  ✓ ${file.path}`));
          }
          if (context.generatedFiles.length > 10) {
            console.log(chalk.gray(`  ... and ${context.generatedFiles.length - 10} more`));
          }
        }
        
        if (context.warnings && context.warnings.length > 0) {
          console.log(chalk.yellow('\nWarnings:'));
          for (const warning of context.warnings) {
            console.log(chalk.yellow(`  ⚠ ${warning.message}`));
          }
        }
        
        if (context.errors && context.errors.length > 0) {
          console.log(chalk.red('\nErrors:'));
          for (const error of context.errors) {
            console.log(chalk.red(`  ✗ ${error.message}`));
          }
        }
        
      } else {
        // Fallback: show what would be generated
        console.log(chalk.yellow('  ⚠ Code generation engine not available'));
        console.log(chalk.gray('\n  In a full setup, this would generate:'));
        console.log(chalk.gray(`    - Project structure for scenario ${options.scenario}`));
        console.log(chalk.gray(`    - Configuration files`));
        console.log(chalk.gray(`    - Source code templates`));
        console.log(chalk.gray(`    - Test files\n`));
        
        if (!options.dryRun) {
          // Create basic output structure
          const outputDir = path.resolve(options.output, projectName);
          fs.mkdirSync(outputDir, { recursive: true });
          fs.mkdirSync(path.join(outputDir, 'src'), { recursive: true });
          fs.mkdirSync(path.join(outputDir, 'tests'), { recursive: true });
          
          // Create a placeholder file
          const placeholder = `// Generated by AgenticCoder
// Scenario: ${options.scenario}
// Project: ${projectName}
// Date: ${new Date().toISOString()}

export const config = {
  projectName: '${projectName}',
  scenario: '${options.scenario}',
};
`;
          fs.writeFileSync(path.join(outputDir, 'src', 'index.ts'), placeholder);
          
          console.log(chalk.green(`  ✓ Created ${outputDir}`));
          console.log(chalk.green(`  ✓ Created ${outputDir}/src/index.ts`));
        }
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(chalk.bold.green(`\n✅ Generation complete in ${elapsed}s\n`));
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Generation failed:'), (error as Error).message);
      process.exit(1);
    }
  });
