/**
 * Express Middleware Template
 * 
 * Generates Express middleware with:
 * - Options support
 * - Error handling
 * - Request/response typing
 */

const template = `import { Request, Response, NextFunction } from 'express';
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}

{{#if hasOptions}}
export interface {{middlewareName}}Options {
{{#each options}}
  {{#if this.description}}/** {{this.description}} */
  {{/if}}{{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}

const defaultOptions: {{middlewareName}}Options = {
{{#each options}}
{{#if this.default}}
  {{this.name}}: {{this.default}},
{{/if}}
{{/each}}
};
{{/if}}

{{#if description}}/**
 * {{description}}
{{#if usage}} *
 * @example
 * \`\`\`typescript
 * {{usage}}
 * \`\`\`
{{/if}} */
{{/if}}export function {{middlewareName}}({{#if hasOptions}}options: Partial<{{middlewareName}}Options> = {}{{/if}}) {
{{#if hasOptions}}
  const config = { ...defaultOptions, ...options };
{{/if}}

  return {{#if isAsync}}async {{/if}}(
    req: Request{{#if reqExtension}} & {{reqExtension}}{{/if}},
    res: Response,
    next: NextFunction
  ){{#if isAsync}}: Promise<void>{{else}}: void{{/if}} => {
    try {
{{body}}
      next();
    } catch (error) {
{{#if errorHandler}}
{{errorHandler}}
{{else}}
      next(error);
{{/if}}
    }
  };
}
`;

/**
 * Prepare variables for middleware generation
 */
function prepareVariables(config) {
  return {
    middlewareName: config.name,
    description: config.description || '',
    usage: config.usage || '',
    hasOptions: !!(config.options && config.options.length > 0),
    options: config.options || [],
    isAsync: config.isAsync !== false,
    reqExtension: config.reqExtension || '',
    body: config.body || '      // Middleware logic here',
    errorHandler: config.errorHandler || '',
    imports: config.imports || []
  };
}

/**
 * Common middleware patterns
 */
const patterns = {
  auth: {
    name: 'authenticate',
    description: 'Authentication middleware',
    isAsync: true,
    reqExtension: '{ user?: { id: string; role: string } }',
    options: [
      { name: 'required', type: 'boolean', default: 'true', description: 'Require authentication' }
    ],
    body: `      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        if (config.required) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }
        return next();
      }

      // Verify token and attach user
      const user = await verifyToken(token);
      req.user = user;`
  },
  
  validate: {
    name: 'validate',
    description: 'Request validation middleware',
    isAsync: false,
    options: [
      { name: 'schema', type: 'any', required: true, description: 'Validation schema' }
    ],
    body: `      const { error } = config.schema.validate(req.body);
      
      if (error) {
        res.status(400).json({ 
          error: 'Validation failed',
          details: error.details 
        });
        return;
      }`
  },
  
  rateLimit: {
    name: 'rateLimit',
    description: 'Rate limiting middleware',
    options: [
      { name: 'windowMs', type: 'number', default: '60000', description: 'Time window in ms' },
      { name: 'maxRequests', type: 'number', default: '100', description: 'Max requests per window' }
    ],
    body: `      const key = req.ip;
      const requests = await getRequestCount(key, config.windowMs);
      
      if (requests >= config.maxRequests) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
      
      await incrementRequestCount(key);`
  },

  errorHandler: {
    name: 'errorHandler',
    description: 'Global error handling middleware',
    isAsync: false,
    body: `      // This is an error handler - signature is different
    return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
      console.error('Error:', err);
      
      const statusCode = (err as any).statusCode || 500;
      const message = err.message || 'Internal Server Error';
      
      res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });`
  }
};

module.exports = {
  template,
  prepareVariables,
  patterns
};
