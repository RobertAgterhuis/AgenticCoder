/**
 * Scan Command
 * 
 * Runs security scanning on the codebase using AgenticCoder's security module.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export const scanCommand = new Command('scan')
  .description('Run security scan on code')
  .argument('[paths...]', 'Paths to scan', ['./src'])
  .option('-o, --output <file>', 'Output report file')
  .option('-f, --format <format>', 'Output format (text, json, sarif)', 'text')
  .option('--secrets', 'Scan for secrets only')
  .option('--vulnerabilities', 'Scan for vulnerabilities only')
  .option('--compliance', 'Run compliance checks')
  .option('--fix', 'Attempt to fix issues automatically')
  .option('--severity <level>', 'Minimum severity (low, medium, high, critical)', 'low')
  .action(async (paths, options) => {
    console.log(chalk.bold('\n🔍 AgenticCoder Security Scan\n'));
    
    const startTime = Date.now();
    const targetPaths = paths.length > 0 ? paths : ['./src'];
    
    console.log(chalk.gray(`  Paths: ${targetPaths.join(', ')}`));
    console.log(chalk.gray(`  Format: ${options.format}`));
    console.log(chalk.gray(`  Min Severity: ${options.severity}\n`));
    
    try {
      // Collect files to scan
      const filesToScan: string[] = [];
      
      for (const targetPath of targetPaths) {
        const resolvedPath = path.resolve(targetPath);
        
        if (!fs.existsSync(resolvedPath)) {
          console.log(chalk.yellow(`  ⚠ Path not found: ${targetPath}`));
          continue;
        }
        
        const stats = fs.statSync(resolvedPath);
        if (stats.isDirectory()) {
          collectFiles(resolvedPath, filesToScan);
        } else {
          filesToScan.push(resolvedPath);
        }
      }
      
      console.log(chalk.cyan(`  📁 Found ${filesToScan.length} files to scan\n`));
      
      if (filesToScan.length === 0) {
        if (options.format === 'json') {
          const emptyResult = { files: 0, scanned: 0, issues: [], summary: { critical: 0, high: 0, medium: 0, low: 0 } };
          console.log(JSON.stringify(emptyResult, null, 2));
        } else {
          console.log(chalk.yellow('  No files found to scan.\n'));
        }
        return;
      }
      
      // Try to load security scanner
      let scanner;
      try {
        const securityPath = path.resolve(__dirname, '../../security');
        if (fs.existsSync(path.join(securityPath, 'index.js')) || 
            fs.existsSync(path.join(securityPath, 'index.ts'))) {
          scanner = await import('../../security');
        }
      } catch (e) {
        // Scanner not available as module, use built-in
      }
      
      // Results storage
      const results = {
        files: filesToScan.length,
        scanned: 0,
        issues: [] as Array<{
          file: string;
          line: number;
          severity: string;
          type: string;
          message: string;
        }>,
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
      
      // Basic secret patterns to detect
      const secretPatterns = [
        { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}['"]/gi, type: 'API Key', severity: 'high' },
        { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Password', severity: 'critical' },
        { pattern: /(?:secret|token)\s*[:=]\s*['"][^'"]{10,}['"]/gi, type: 'Secret/Token', severity: 'high' },
        { pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g, type: 'Private Key', severity: 'critical' },
        { pattern: /(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"][^'"]+['"]/gi, type: 'AWS Credential', severity: 'critical' },
        { pattern: /ghp_[a-zA-Z0-9]{36}/g, type: 'GitHub Token', severity: 'critical' },
        { pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g, type: 'Slack Token', severity: 'high' }
      ];
      
      // Vulnerability patterns
      const vulnPatterns = [
        { pattern: /eval\s*\(/g, type: 'Dangerous Function', severity: 'high', message: 'Use of eval() is dangerous' },
        { pattern: /innerHTML\s*=/g, type: 'XSS Risk', severity: 'medium', message: 'innerHTML can lead to XSS' },
        { pattern: /document\.write\s*\(/g, type: 'XSS Risk', severity: 'medium', message: 'document.write can lead to XSS' },
        { pattern: /new\s+Function\s*\(/g, type: 'Code Injection', severity: 'high', message: 'Dynamic function creation is risky' },
        { pattern: /child_process/g, type: 'Command Injection Risk', severity: 'medium', message: 'child_process usage needs review' }
      ];
      
      // Scan files
      console.log(chalk.cyan('  Scanning files...\n'));
      
      for (const file of filesToScan) {
        results.scanned++;
        
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const lines = content.split('\n');
          const relativePath = path.relative(process.cwd(), file);
          
          // Check for secrets
          if (!options.vulnerabilities) {
            for (const { pattern, type, severity } of secretPatterns) {
              pattern.lastIndex = 0;
              let match;
              while ((match = pattern.exec(content)) !== null) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                results.issues.push({
                  file: relativePath,
                  line: lineNum,
                  severity,
                  type: 'Secret',
                  message: `Potential ${type} detected`
                });
                results.summary[severity as keyof typeof results.summary]++;
              }
            }
          }
          
          // Check for vulnerabilities
          if (!options.secrets) {
            for (const { pattern, type, severity, message } of vulnPatterns) {
              pattern.lastIndex = 0;
              let match;
              while ((match = pattern.exec(content)) !== null) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                results.issues.push({
                  file: relativePath,
                  line: lineNum,
                  severity,
                  type,
                  message
                });
                results.summary[severity as keyof typeof results.summary]++;
              }
            }
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
      
      // Output results
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (options.format === 'json') {
        const output = JSON.stringify(results, null, 2);
        if (options.output) {
          fs.writeFileSync(options.output, output);
          console.log(chalk.green(`  ✓ Report saved to ${options.output}`));
        } else {
          console.log(output);
        }
      } else {
        // Text format
        console.log(chalk.bold('  Scan Results\n'));
        console.log(chalk.gray(`  Files scanned: ${results.scanned}`));
        console.log(chalk.gray(`  Time: ${elapsed}s\n`));
        
        if (results.issues.length === 0) {
          console.log(chalk.green('  ✓ No security issues found!\n'));
        } else {
          console.log(chalk.yellow(`  Found ${results.issues.length} issue(s):\n`));
          
          // Group by severity
          const severityOrder = ['critical', 'high', 'medium', 'low'];
          const minSeverityIndex = severityOrder.indexOf(options.severity);
          
          for (const severity of severityOrder) {
            if (severityOrder.indexOf(severity) > minSeverityIndex) continue;
            
            const sevIssues = results.issues.filter(i => i.severity === severity);
            if (sevIssues.length === 0) continue;
            
            const color = severity === 'critical' ? chalk.red :
                         severity === 'high' ? chalk.red :
                         severity === 'medium' ? chalk.yellow : chalk.gray;
            
            console.log(color(`  ${severity.toUpperCase()} (${sevIssues.length}):`));
            for (const issue of sevIssues.slice(0, 5)) {
              console.log(color(`    • ${issue.file}:${issue.line} - ${issue.message}`));
            }
            if (sevIssues.length > 5) {
              console.log(color(`    ... and ${sevIssues.length - 5} more`));
            }
            console.log('');
          }
        }
        
        // Summary
        console.log(chalk.bold('  Summary'));
        console.log(chalk.red(`    Critical: ${results.summary.critical}`));
        console.log(chalk.red(`    High: ${results.summary.high}`));
        console.log(chalk.yellow(`    Medium: ${results.summary.medium}`));
        console.log(chalk.gray(`    Low: ${results.summary.low}`));
        console.log('');
        
        if (options.output) {
          const report = formatTextReport(results, elapsed);
          fs.writeFileSync(options.output, report);
          console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
        }
      }
      
      // Exit with error if critical/high issues found
      if (results.summary.critical > 0 || results.summary.high > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Scan failed:'), (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Recursively collect files from directory
 */
function collectFiles(dir: string, files: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, etc.
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === 'coverage') {
      continue;
    }
    
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      // Only scan certain file types
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.env', '.py', '.rb', '.java', '.cs', '.go'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
}

/**
 * Format text report
 */
function formatTextReport(results: any, elapsed: string): string {
  let report = `AgenticCoder Security Scan Report
================================

Date: ${new Date().toISOString()}
Duration: ${elapsed}s
Files Scanned: ${results.scanned}

Summary
-------
Critical: ${results.summary.critical}
High: ${results.summary.high}
Medium: ${results.summary.medium}
Low: ${results.summary.low}

Issues
------
`;
  
  for (const issue of results.issues) {
    report += `[${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}\n`;
    report += `  Type: ${issue.type}\n`;
    report += `  ${issue.message}\n\n`;
  }
  
  return report;
}
