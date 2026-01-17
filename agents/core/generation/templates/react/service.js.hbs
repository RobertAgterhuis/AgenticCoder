/**
 * React API Service Template
 * 
 * Generates a service module for API calls with:
 * - TypeScript interfaces for requests/responses
 * - Error handling
 * - Request configuration
 */

const template = `{{#if description}}/**
 * {{description}}
 */
{{/if}}
{{#each typeImports}}
import type { {{join this.named}} } from '{{this.from}}';
{{/each}}

const API_BASE = {{#if apiBaseEnv}}import.meta.env.{{apiBaseEnv}}{{else}}'{{apiBase}}'{{/if}};

{{#if hasRequestConfig}}
interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  timeout?: number;
}
{{/if}}

{{#each types}}
export interface {{this.name}} {
{{#each this.fields}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}

{{/each}}
{{#if hasRequestConfig}}
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, timeout = 30000, ...init } = config;
  
  let url = \`\${API_BASE}\${endpoint}\`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += \`?\${searchParams.toString()}\`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || \`HTTP \${response.status}: \${response.statusText}\`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

{{/if}}
{{#each endpoints}}
{{#if this.description}}/**
 * {{this.description}}
{{#each this.paramDocs}}
 * @param {{this.name}} - {{this.description}}
{{/each}}
 */
{{/if}}export async function {{this.name}}({{this.params}}): Promise<{{this.returnType}}> {
{{#if ../hasRequestConfig}}
  return request<{{this.returnType}}>(\`{{this.path}}\`, {
    method: '{{this.method}}',
{{#if this.hasBody}}
    body: JSON.stringify({{this.bodyParam}}),
{{/if}}
  });
{{else}}
  const response = await fetch(\`\${API_BASE}{{this.path}}\`, {
    method: '{{this.method}}',
    headers: {
      'Content-Type': 'application/json',
    },
{{#if this.hasBody}}
    body: JSON.stringify({{this.bodyParam}}),
{{/if}}
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return response.json();
{{/if}}
}

{{/each}}
{{#if exportObject}}
export const {{serviceName}} = {
{{#each endpoints}}
  {{this.name}},
{{/each}}
};
{{/if}}
`;

/**
 * Prepare variables for service generation
 */
function prepareVariables(config) {
  return {
    serviceName: config.name,
    description: config.description || '',
    apiBase: config.apiBase || '/api',
    apiBaseEnv: config.apiBaseEnv || 'VITE_API_URL',
    hasRequestConfig: config.useRequestConfig !== false,
    exportObject: config.exportAsObject !== false,
    types: config.types || [],
    endpoints: (config.endpoints || []).map(ep => ({
      name: ep.name,
      description: ep.description || '',
      path: ep.path,
      method: ep.method || 'GET',
      params: ep.params || '',
      returnType: ep.returnType || 'any',
      hasBody: ['POST', 'PUT', 'PATCH'].includes(ep.method || 'GET'),
      bodyParam: ep.bodyParam || 'data',
      paramDocs: ep.paramDocs || []
    })),
    typeImports: config.typeImports || []
  };
}

module.exports = {
  template,
  prepareVariables
};
