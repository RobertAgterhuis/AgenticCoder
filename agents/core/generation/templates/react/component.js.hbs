/**
 * React Component Template
 * 
 * Generates a React functional component with optional:
 * - Props with TypeScript interface
 * - State management (useState)
 * - Side effects (useEffect)
 * - CSS modules styling
 */

const template = `import React{{#if hasState}}, { useState }{{/if}}{{#if hasEffect}}, { useEffect }{{/if}}{{#if hasCallback}}, { useCallback }{{/if}}{{#if hasMemo}}, { useMemo }{{/if}} from 'react';
{{#if hasStyles}}
import styles from './{{componentName}}.module.css';
{{/if}}
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}

{{#if hasProps}}
interface {{componentName}}Props {
{{#each props}}
  {{#if this.description}}/** {{this.description}} */
  {{/if}}{{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}
{{/if}}

{{#if description}}/**
 * {{description}}
 */
{{/if}}export function {{componentName}}({{#if hasProps}}{ {{join propsDestructure}} }: {{componentName}}Props{{/if}}){{#if returnType}}: {{returnType}}{{/if}} {
{{#each stateVars}}
  const [{{this.name}}, set{{pascalCase this.name}}] = useState{{#if this.type}}<{{this.type}}>{{/if}}({{this.initial}});
{{/each}}
{{#if hasState}}

{{/if}}{{#each memoVars}}
  const {{this.name}} = useMemo(() => {
    {{this.body}}
  }, [{{join this.deps}}]);
{{/each}}
{{#if hasMemo}}

{{/if}}{{#each callbacks}}
  const {{this.name}} = useCallback({{#if this.params}}({{this.params}}){{else}}(){{/if}} => {
    {{this.body}}
  }, [{{join this.deps}}]);
{{/each}}
{{#if hasCallback}}

{{/if}}{{#each effects}}
  useEffect(() => {
    {{this.body}}
{{#if this.cleanup}}
    return () => {
      {{this.cleanup}}
    };
{{/if}}
  }, [{{join this.deps}}]);
{{/each}}
{{#if hasEffect}}

{{/if}}{{#if customLogic}}
  {{customLogic}}

{{/if}}  return (
    {{jsxContent}}
  );
}

export default {{componentName}};
`;

/**
 * Default JSX content for new components
 */
const defaultJsx = `<div{{#if hasStyles}} className={styles.container}{{/if}}>
      <h2>{{componentName}}</h2>
      {{#if hasChildren}}{children}{{/if}}
    </div>`;

/**
 * Generate component variables
 */
function prepareVariables(config) {
  const variables = {
    componentName: config.name,
    description: config.description || '',
    hasProps: !!(config.props && config.props.length > 0),
    hasState: !!(config.state && config.state.length > 0),
    hasEffect: !!(config.effects && config.effects.length > 0),
    hasCallback: !!(config.callbacks && config.callbacks.length > 0),
    hasMemo: !!(config.memoVars && config.memoVars.length > 0),
    hasStyles: config.useStyles !== false,
    hasChildren: config.hasChildren || false,
    props: config.props || [],
    stateVars: config.state || [],
    effects: config.effects || [],
    callbacks: config.callbacks || [],
    memoVars: config.memoVars || [],
    imports: config.imports || [],
    customLogic: config.customLogic || '',
    returnType: config.returnType || '',
    jsxContent: config.jsx || defaultJsx
  };

  // Generate props destructure array
  if (variables.hasProps) {
    variables.propsDestructure = variables.props.map(p => p.name);
    if (variables.hasChildren) {
      variables.propsDestructure.push('children');
    }
  }

  return variables;
}

module.exports = {
  template,
  defaultJsx,
  prepareVariables
};
