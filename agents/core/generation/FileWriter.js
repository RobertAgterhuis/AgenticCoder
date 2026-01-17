/**
 * FileWriter - Robust file writing service for generated code
 * 
 * Handles all disk operations for the Code Generation Engine including:
 * - Writing files with automatic directory creation
 * - Atomic write operations
 * - File existence checks
 * - Merge operations support
 */

const fs = require('fs').promises;
const path = require('path');

class FileWriter {
  /**
   * @param {string} outputRoot - Base directory for all file operations
   * @param {Object} options - Configuration options
   * @param {string} options.encoding - File encoding (default: 'utf-8')
   * @param {boolean} options.dryRun - If true, don't actually write files
   */
  constructor(outputRoot, options = {}) {
    this.outputRoot = path.resolve(outputRoot);
    this.encoding = options.encoding || 'utf-8';
    this.dryRun = options.dryRun || false;
    this.writtenFiles = [];
  }

  /**
   * Write a single file
   * @param {string} relativePath - Path relative to outputRoot
   * @param {string} content - File content
   * @param {Object} options - Write options
   * @param {boolean} options.overwrite - Allow overwriting existing files (default: true)
   * @returns {Promise<{success: boolean, path: string, error?: string}>}
   */
  async writeFile(relativePath, content, options = {}) {
    const { overwrite = true } = options;
    const fullPath = path.join(this.outputRoot, relativePath);
    
    try {
      // Check if file exists and overwrite is disabled
      if (!overwrite && await this.fileExists(relativePath)) {
        return {
          success: false,
          path: fullPath,
          error: `File already exists and overwrite is disabled: ${relativePath}`
        };
      }

      // Ensure directory exists
      await this.ensureDirectory(path.dirname(fullPath));

      // Write file (or simulate in dry-run mode)
      if (!this.dryRun) {
        await fs.writeFile(fullPath, content, { encoding: this.encoding });
      }

      // Track written file
      this.writtenFiles.push({
        path: relativePath,
        fullPath,
        size: Buffer.byteLength(content, this.encoding),
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        path: fullPath,
        dryRun: this.dryRun
      };
    } catch (error) {
      return {
        success: false,
        path: fullPath,
        error: error.message
      };
    }
  }

  /**
   * Write multiple files atomically (all or nothing)
   * @param {Array<{path: string, content: string}>} files - Files to write
   * @returns {Promise<{success: boolean, results: Array, errors: Array}>}
   */
  async writeFiles(files) {
    const results = [];
    const errors = [];
    const writtenPaths = [];

    try {
      for (const file of files) {
        const result = await this.writeFile(file.path, file.content, file.options);
        results.push(result);
        
        if (result.success) {
          writtenPaths.push(file.path);
        } else {
          errors.push(result);
          // Rollback on failure (unless dry-run)
          if (!this.dryRun) {
            await this.rollback(writtenPaths);
          }
          return {
            success: false,
            results,
            errors,
            rolledBack: writtenPaths
          };
        }
      }

      return {
        success: true,
        results,
        errors: [],
        filesWritten: writtenPaths.length
      };
    } catch (error) {
      // Rollback on unexpected error
      if (!this.dryRun) {
        await this.rollback(writtenPaths);
      }
      return {
        success: false,
        results,
        errors: [{ error: error.message }],
        rolledBack: writtenPaths
      };
    }
  }

  /**
   * Ensure directory exists, creating parent directories as needed
   * @param {string} dirPath - Absolute directory path
   */
  async ensureDirectory(dirPath) {
    if (this.dryRun) return;
    
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if file exists
   * @param {string} relativePath - Path relative to outputRoot
   * @returns {Promise<boolean>}
   */
  async fileExists(relativePath) {
    const fullPath = path.join(this.outputRoot, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read existing file content
   * @param {string} relativePath - Path relative to outputRoot
   * @returns {Promise<string|null>}
   */
  async readFile(relativePath) {
    const fullPath = path.join(this.outputRoot, relativePath);
    try {
      return await fs.readFile(fullPath, { encoding: this.encoding });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete file or directory
   * @param {string} relativePath - Path relative to outputRoot
   * @param {Object} options - Delete options
   * @param {boolean} options.recursive - Delete directories recursively
   * @returns {Promise<boolean>}
   */
  async delete(relativePath, options = {}) {
    if (this.dryRun) return true;
    
    const fullPath = path.join(this.outputRoot, relativePath);
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: options.recursive || false });
      } else {
        await fs.unlink(fullPath);
      }
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // Already doesn't exist
      }
      throw error;
    }
  }

  /**
   * Rollback written files (for atomic operations)
   * @param {Array<string>} paths - Relative paths to delete
   */
  async rollback(paths) {
    for (const relativePath of paths) {
      try {
        await this.delete(relativePath);
      } catch (error) {
        console.error(`Rollback failed for ${relativePath}:`, error.message);
      }
    }
  }

  /**
   * Get list of all files written during this session
   * @returns {Array<{path: string, fullPath: string, size: number, timestamp: string}>}
   */
  getWrittenFiles() {
    return [...this.writtenFiles];
  }

  /**
   * Clear the written files tracking
   */
  clearTracking() {
    this.writtenFiles = [];
  }

  /**
   * Get statistics about written files
   * @returns {{count: number, totalSize: number}}
   */
  getStats() {
    return {
      count: this.writtenFiles.length,
      totalSize: this.writtenFiles.reduce((sum, f) => sum + f.size, 0)
    };
  }
}

module.exports = FileWriter;
