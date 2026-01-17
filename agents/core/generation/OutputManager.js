/**
 * OutputManager.js
 * 
 * Manages generated output: file organization, conflict resolution,
 * backup creation, and cleanup operations.
 * 
 * @module agents/core/generation/OutputManager
 */

const fs = require('fs').promises;
const path = require('path');

class OutputManager {
  /**
   * Create an Output Manager
   * @param {FileWriter} fileWriter - The file writer instance
   * @param {Object} options - Configuration options
   */
  constructor(fileWriter, options = {}) {
    this.fileWriter = fileWriter;
    this.options = {
      baseOutputPath: options.baseOutputPath || 'output',
      backupPath: options.backupPath || '.output-backup',
      maxBackups: options.maxBackups || 5,
      createBackup: options.createBackup !== false,
    };
  }

  /**
   * Prepare output directory for a project
   * @param {string} projectName - Name of the project
   * @param {Object} options - Preparation options
   * @returns {Promise<string>} The output path
   */
  async prepareOutput(projectName, options = {}) {
    const outputPath = path.join(this.options.baseOutputPath, projectName);
    
    // Check if output directory exists
    const exists = await this.directoryExists(outputPath);
    
    if (exists) {
      if (options.clean) {
        // Create backup before cleaning
        if (this.options.createBackup && !options.skipBackup) {
          await this.createBackup(outputPath, projectName);
        }
        await this.deleteDirectory(outputPath);
      } else if (options.overwrite === false) {
        throw new Error(`Output directory already exists: ${outputPath}`);
      }
    }
    
    await this.fileWriter.ensureDirectory(outputPath);
    
    // Create standard subdirectories if specified
    if (options.structure) {
      await this.createStructure(outputPath, options.structure);
    }
    
    return outputPath;
  }

  /**
   * Create directory structure
   * @param {string} basePath - Base path for structure
   * @param {Array<string>} structure - Array of directory paths
   */
  async createStructure(basePath, structure) {
    for (const dir of structure) {
      const fullPath = path.join(basePath, dir);
      await this.fileWriter.ensureDirectory(fullPath);
    }
  }

  /**
   * Check for conflicts with existing files
   * @param {string} outputPath - Output directory path
   * @param {Array<Object>} files - Array of file objects
   * @returns {Promise<Object>} Conflict analysis result
   */
  async checkConflicts(outputPath, files) {
    const conflicts = {
      existing: [],
      modified: [],
      safe: [],
    };
    
    for (const file of files) {
      const fullPath = path.join(outputPath, file.path);
      const exists = await this.fileExists(fullPath);
      
      if (exists) {
        const existingContent = await fs.readFile(fullPath, 'utf-8');
        
        if (existingContent === file.content) {
          conflicts.safe.push(file.path);
        } else {
          conflicts.modified.push({
            path: file.path,
            existingSize: existingContent.length,
            newSize: file.content.length,
          });
        }
        conflicts.existing.push(file.path);
      } else {
        conflicts.safe.push(file.path);
      }
    }
    
    return {
      hasConflicts: conflicts.modified.length > 0,
      total: files.length,
      ...conflicts,
    };
  }

  /**
   * Write all generated files
   * @param {string} outputPath - Output directory path
   * @param {Array<Object>} files - Array of file objects
   * @param {Object} options - Write options
   * @returns {Promise<Object>} Write results
   */
  async writeOutput(outputPath, files, options = {}) {
    const results = {
      written: [],
      skipped: [],
      backed: [],
      errors: [],
      stats: {
        totalSize: 0,
        filesWritten: 0,
        filesSkipped: 0,
        errorsCount: 0,
      },
    };
    
    for (const file of files) {
      try {
        const fullPath = path.join(outputPath, file.path);
        const exists = await this.fileExists(fullPath);
        
        // Handle existing files
        if (exists) {
          if (options.skipExisting) {
            results.skipped.push(file.path);
            results.stats.filesSkipped++;
            continue;
          }
          
          if (options.backupExisting) {
            await this.backupFile(fullPath, outputPath);
            results.backed.push(file.path);
          }
        }
        
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        await this.fileWriter.ensureDirectory(dir);
        
        // Write file
        await this.fileWriter.writeFile(fullPath, file.content);
        
        results.written.push(file.path);
        results.stats.filesWritten++;
        results.stats.totalSize += file.content.length;
      } catch (error) {
        results.errors.push({ 
          path: file.path, 
          error: error.message,
          stack: error.stack,
        });
        results.stats.errorsCount++;
      }
    }
    
    return results;
  }

  /**
   * Write output with progress reporting
   * @param {string} outputPath - Output directory path
   * @param {Array<Object>} files - Array of file objects
   * @param {Function} onProgress - Progress callback
   * @param {Object} options - Write options
   * @returns {Promise<Object>} Write results
   */
  async writeOutputWithProgress(outputPath, files, onProgress, options = {}) {
    const results = {
      written: [],
      skipped: [],
      errors: [],
    };
    
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const fullPath = path.join(outputPath, file.path);
        const exists = await this.fileExists(fullPath);
        
        if (exists && options.skipExisting) {
          results.skipped.push(file.path);
        } else {
          const dir = path.dirname(fullPath);
          await this.fileWriter.ensureDirectory(dir);
          await this.fileWriter.writeFile(fullPath, file.content);
          results.written.push(file.path);
        }
        
        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total,
            file: file.path,
            percentage: Math.round(((i + 1) / total) * 100),
          });
        }
      } catch (error) {
        results.errors.push({ path: file.path, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Create a backup of a file
   * @param {string} filePath - Path to file to backup
   * @param {string} outputPath - Output directory (for relative path calculation)
   */
  async backupFile(filePath, outputPath) {
    const relativePath = path.relative(outputPath, filePath);
    const backupDir = path.join(this.options.backupPath, new Date().toISOString().replace(/[:.]/g, '-'));
    const backupPath = path.join(backupDir, relativePath);
    
    await this.fileWriter.ensureDirectory(path.dirname(backupPath));
    await fs.copyFile(filePath, backupPath);
  }

  /**
   * Create a backup of entire output directory
   * @param {string} outputPath - Path to output directory
   * @param {string} projectName - Name of project (for backup naming)
   */
  async createBackup(outputPath, projectName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.options.backupPath, `${projectName}-${timestamp}`);
    
    await this.copyDirectory(outputPath, backupDir);
    
    // Cleanup old backups
    await this.cleanupBackups(projectName);
    
    return backupDir;
  }

  /**
   * Cleanup old backups, keeping only maxBackups
   * @param {string} projectName - Project name to filter backups
   */
  async cleanupBackups(projectName) {
    try {
      const backupDir = this.options.backupPath;
      const entries = await fs.readdir(backupDir, { withFileTypes: true });
      
      const projectBackups = entries
        .filter(e => e.isDirectory() && e.name.startsWith(projectName))
        .map(e => ({
          name: e.name,
          path: path.join(backupDir, e.name),
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Newest first
      
      // Remove excess backups
      const toRemove = projectBackups.slice(this.options.maxBackups);
      for (const backup of toRemove) {
        await this.deleteDirectory(backup.path);
      }
    } catch (error) {
      // Backup directory might not exist yet
    }
  }

  /**
   * Generate output summary
   * @param {Object} results - Write results
   * @returns {Object} Summary object
   */
  generateSummary(results) {
    const summary = {
      totalFiles: results.written.length + results.skipped.length + results.errors.length,
      written: results.written.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      success: results.errors.length === 0,
      files: {
        written: results.written,
        skipped: results.skipped,
        failed: results.errors.map(e => e.path),
      },
    };
    
    if (results.stats) {
      summary.stats = {
        totalSize: this.formatSize(results.stats.totalSize),
        totalSizeBytes: results.stats.totalSize,
      };
    }
    
    return summary;
  }

  /**
   * Generate detailed manifest
   * @param {string} outputPath - Output directory path
   * @param {Array<Object>} files - Array of written files
   * @param {Object} context - Generation context
   * @returns {Object} Manifest object
   */
  generateManifest(outputPath, files, context) {
    return {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      project: {
        name: context.projectName,
        tech: context.tech,
        features: context.features,
      },
      output: {
        path: outputPath,
        fileCount: files.length,
      },
      files: files.map(f => ({
        path: f.path,
        generator: f.generator || 'unknown',
        size: f.content?.length || 0,
        hash: this.hashContent(f.content),
      })),
    };
  }

  /**
   * Write manifest file
   * @param {string} outputPath - Output directory path
   * @param {Object} manifest - Manifest object
   */
  async writeManifest(outputPath, manifest) {
    const manifestPath = path.join(outputPath, '.generation-manifest.json');
    await this.fileWriter.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Read existing manifest
   * @param {string} outputPath - Output directory path
   * @returns {Promise<Object|null>} Manifest object or null
   */
  async readManifest(outputPath) {
    try {
      const manifestPath = path.join(outputPath, '.generation-manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean output directory
   * @param {string} outputPath - Output directory path
   * @param {Object} options - Cleanup options
   */
  async cleanOutput(outputPath, options = {}) {
    if (options.preserveManifest) {
      const manifest = await this.readManifest(outputPath);
      await this.deleteDirectory(outputPath);
      await this.fileWriter.ensureDirectory(outputPath);
      if (manifest) {
        await this.writeManifest(outputPath, manifest);
      }
    } else {
      await this.deleteDirectory(outputPath);
    }
  }

  /**
   * List all files in output directory
   * @param {string} outputPath - Output directory path
   * @returns {Promise<Array<string>>} Array of file paths
   */
  async listOutputFiles(outputPath) {
    const files = [];
    
    async function walk(dir, base) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    }
    
    try {
      await walk(outputPath, '');
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  // Helper methods

  /**
   * Check if file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   * @param {string} dirPath - Path to check
   * @returns {Promise<boolean>}
   */
  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Delete directory recursively
   * @param {string} dirPath - Path to delete
   */
  async deleteDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source path
   * @param {string} dest - Destination path
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Simple hash for content comparison
   * @param {string} content - Content to hash
   * @returns {string} Hash string
   */
  hashContent(content) {
    if (!content) return '';
    
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

module.exports = OutputManager;
