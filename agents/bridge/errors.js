/**
 * Error Handling Bridge
 * Provides lazy-loaded access to error classification and handling utilities
 * from TypeScript compiled modules.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distPath = path.resolve(__dirname, '../../dist');

// Cached module reference
let errorsModule = null;

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  TRANSIENT: 'transient',
  PERMANENT: 'permanent',
  CONFIGURATION: 'configuration',
  VALIDATION: 'validation',
  SECURITY: 'security',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

/**
 * Gets the errors module from TypeScript distribution
 * @returns {object} Errors module exports
 */
export function getErrorsModule() {
  if (!errorsModule) {
    try {
      // Try multiple possible locations
      const possiblePaths = [
        path.join(distPath, 'errors/index.js'),
        path.join(distPath, 'core/errors.js'),
        path.join(distPath, 'utils/errors.js')
      ];
      
      for (const modulePath of possiblePaths) {
        try {
          errorsModule = require(modulePath);
          break;
        } catch {
          continue;
        }
      }
      
      if (!errorsModule) {
        // Return built-in error utilities if module not found
        errorsModule = createBuiltInErrorModule();
      }
    } catch (error) {
      console.error('[Bridge] Failed to load errors module:', error.message);
      errorsModule = createBuiltInErrorModule();
    }
  }
  return errorsModule;
}

/**
 * Creates built-in error module for fallback
 * @returns {object} Built-in error module
 */
function createBuiltInErrorModule() {
  return {
    classifyError: (error) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return { category: ErrorCategory.NETWORK, retryable: true };
      }
      if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
        return { category: ErrorCategory.TIMEOUT, retryable: true };
      }
      if (error.status === 429 || error.code === 'RATE_LIMITED') {
        return { category: ErrorCategory.TRANSIENT, retryable: true };
      }
      if (error.status >= 500) {
        return { category: ErrorCategory.TRANSIENT, retryable: true };
      }
      if (error.status >= 400 && error.status < 500) {
        return { category: ErrorCategory.PERMANENT, retryable: false };
      }
      return { category: ErrorCategory.UNKNOWN, retryable: false };
    },
    isRetryable: (error) => {
      const classification = createBuiltInErrorModule().classifyError(error);
      return classification.retryable;
    }
  };
}

/**
 * Creates an error classifier instance
 * @param {object} config - Configuration options
 * @returns {object} Error classifier
 */
export function createErrorClassifier(config = {}) {
  const errors = getErrorsModule();
  if (errors.createErrorClassifier) {
    return errors.createErrorClassifier(config);
  }
  if (errors.ErrorClassifier) {
    return new errors.ErrorClassifier(config);
  }
  return {
    classify: errors.classifyError || createBuiltInErrorModule().classifyError,
    isRetryable: errors.isRetryable || createBuiltInErrorModule().isRetryable
  };
}

/**
 * Determines if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  const errors = getErrorsModule();
  if (errors.isRetryable) {
    return errors.isRetryable(error);
  }
  return createBuiltInErrorModule().isRetryable(error);
}

/**
 * Classifies an error into a category
 * @param {Error} error - Error to classify
 * @returns {object} Classification result with category and retryable flag
 */
export function classifyError(error) {
  const errors = getErrorsModule();
  if (errors.classifyError) {
    return errors.classifyError(error);
  }
  return createBuiltInErrorModule().classifyError(error);
}

/**
 * Creates a formatted error with context
 * @param {string} message - Error message
 * @param {object} context - Error context
 * @returns {Error} Formatted error
 */
export function createContextualError(message, context = {}) {
  const error = new Error(message);
  error.context = context;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - Function to wrap
 * @param {object} options - Options including retries and delay
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  const { retries = 3, delay = 1000, onError = null } = options;
  
  return async function(...args) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;
        if (onError) {
          onError(error, attempt);
        }
        if (!isRetryableError(error) || attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw lastError;
  };
}

/**
 * Checks if errors module is available
 * @returns {boolean} True if errors module can be loaded
 */
export function isAvailable() {
  try {
    getErrorsModule();
    return true;
  } catch {
    return false;
  }
}

export default {
  ErrorCategory,
  getErrorsModule,
  createErrorClassifier,
  isRetryableError,
  classifyError,
  createContextualError,
  withErrorHandling,
  isAvailable
};
