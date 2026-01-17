/**
 * React Custom Hook Template
 * 
 * Generates a reusable custom hook with:
 * - TypeScript interface for options and return value
 * - State management
 * - Side effects
 */

const template = `import { useState, useEffect, useCallback{{#if useRef}}, useRef{{/if}}{{#if useMemo}}, useMemo{{/if}} } from 'react';
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}

{{#if hasOptions}}
export interface {{hookName}}Options {
{{#each options}}
  {{#if this.description}}/** {{this.description}} */
  {{/if}}{{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}
{{/if}}

{{#if hasReturn}}
export interface {{hookName}}Return {
{{#each returns}}
  {{#if this.description}}/** {{this.description}} */
  {{/if}}{{this.name}}: {{this.type}};
{{/each}}
}
{{/if}}

{{#if description}}/**
 * {{description}}
{{#if usage}} *
 * @example
 * \`\`\`tsx
 * {{usage}}
 * \`\`\`
{{/if}} */
{{/if}}export function {{hookName}}({{#if hasOptions}}options: {{hookName}}Options = {}{{/if}}){{#if hasReturn}}: {{hookName}}Return{{/if}} {
{{#if hasOptions}}
  const { {{join optionDestructure}} } = options;
{{/if}}

{{#each stateVars}}
  const [{{this.name}}, set{{pascalCase this.name}}] = useState{{#if this.type}}<{{this.type}}>{{/if}}({{this.initial}});
{{/each}}
{{#if useRef}}

{{#each refs}}
  const {{this.name}} = useRef{{#if this.type}}<{{this.type}}>{{/if}}({{this.initial}});
{{/each}}
{{/if}}
{{#if useMemo}}

{{#each memoVars}}
  const {{this.name}} = useMemo(() => {
    {{this.body}}
  }, [{{join this.deps}}]);
{{/each}}
{{/if}}

{{#each callbacks}}
  const {{this.name}} = useCallback({{#if this.async}}async {{/if}}({{this.params}}){{#if this.returnType}}: {{this.returnType}}{{/if}} => {
    {{this.body}}
  }, [{{join this.deps}}]);
{{/each}}

{{#each effects}}
  useEffect(() => {
    {{this.body}}
{{#if this.cleanup}}

    return () => {
      {{this.cleanup}}
    };
{{/if}}
  }, [{{join this.deps}}]);
{{/each}}

{{#if customLogic}}
  {{customLogic}}

{{/if}}  return {
{{#each returns}}
    {{this.name}},
{{/each}}
  };
}
`;

/**
 * Prepare variables for hook generation
 */
function prepareVariables(config) {
  const variables = {
    hookName: config.name.startsWith('use') ? config.name : `use${config.name}`,
    description: config.description || '',
    usage: config.usage || '',
    hasOptions: !!(config.options && config.options.length > 0),
    hasReturn: !!(config.returns && config.returns.length > 0),
    options: config.options || [],
    returns: config.returns || [],
    stateVars: config.state || [],
    callbacks: config.callbacks || [],
    effects: config.effects || [],
    refs: config.refs || [],
    memoVars: config.memoVars || [],
    customLogic: config.customLogic || '',
    useRef: !!(config.refs && config.refs.length > 0),
    useMemo: !!(config.memoVars && config.memoVars.length > 0),
    imports: config.imports || []
  };

  // Generate options destructure
  if (variables.hasOptions) {
    variables.optionDestructure = variables.options.map(o => 
      o.defaultValue ? `${o.name} = ${o.defaultValue}` : o.name
    );
  }

  return variables;
}

module.exports = {
  template,
  prepareVariables
};
