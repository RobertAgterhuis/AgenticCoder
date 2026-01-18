/**
 * E2E Cleanup Helper
 * 
 * Provides utilities for cleaning up test artifacts.
 */

import * as fs from 'fs';
import * as path from 'path';

export class Cleanup {
  private paths: string[] = [];

  /**
   * Register a path for cleanup
   */
  register(filePath: string): void {
    if (!this.paths.includes(filePath)) {
      this.paths.push(filePath);
    }
  }

  /**
   * Clean all registered paths
   */
  cleanAll(): void {
    for (const p of this.paths) {
      this.cleanPath(p);
    }
    this.paths = [];
  }

  /**
   * Clean a specific path
   */
  private cleanPath(p: string): void {
    if (fs.existsSync(p)) {
      try {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
      } catch (e) {
        // Ignore cleanup errors
        console.warn(`Warning: Could not clean ${p}`);
      }
    }
  }

  /**
   * Clean a directory (static method)
   */
  static cleanDir(dir: string): void {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  /**
   * Create a clean directory (removes if exists, then creates)
   */
  static createCleanDir(dir: string): void {
    Cleanup.cleanDir(dir);
    fs.mkdirSync(dir, { recursive: true });
  }

  /**
   * Ensure a directory exists
   */
  static ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Create a new Cleanup instance
 */
export function createCleanup(): Cleanup {
  return new Cleanup();
}
