/**
 * React Context Template
 * 
 * Generates a Context provider with:
 * - TypeScript type safety
 * - Custom hook for consuming context
 * - Reducer pattern for complex state
 */

const template = `import React, { createContext, useContext{{#if useReducer}}, useReducer{{else}}, useState{{/if}}{{#if hasEffect}}, useEffect{{/if}}{{#if hasCallback}}, useCallback{{/if}}{{#if useMemo}}, useMemo{{/if}} } from 'react';
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}

// Types
{{#each types}}
export interface {{this.name}} {
{{#each this.fields}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}

{{/each}}
interface {{contextName}}State {
{{#each stateFields}}
  {{this.name}}: {{this.type}};
{{/each}}
}

interface {{contextName}}ContextValue extends {{contextName}}State {
{{#each actions}}
  {{this.name}}: {{this.type}};
{{/each}}
}

{{#if useReducer}}
// Action Types
type {{contextName}}Action =
{{#each reducerActions}}
  | { type: '{{this.type}}'{{#if this.payload}}; payload: {{this.payload}}{{/if}} }
{{/each}};

// Reducer
function {{camelCase contextName}}Reducer(
  state: {{contextName}}State,
  action: {{contextName}}Action
): {{contextName}}State {
  switch (action.type) {
{{#each reducerActions}}
    case '{{this.type}}':
      {{this.handler}}
{{/each}}
    default:
      return state;
  }
}

{{/if}}
// Initial State
const initialState: {{contextName}}State = {
{{#each stateFields}}
  {{this.name}}: {{this.initial}},
{{/each}}
};

// Context
const {{contextName}}Context = createContext<{{contextName}}ContextValue | undefined>(undefined);

{{#if providerDescription}}/**
 * {{providerDescription}}
 */
{{/if}}export function {{contextName}}Provider({ children }: { children: React.ReactNode }) {
{{#if useReducer}}
  const [state, dispatch] = useReducer({{camelCase contextName}}Reducer, initialState);
{{else}}
{{#each stateFields}}
  const [{{this.name}}, set{{pascalCase this.name}}] = useState{{#if this.typeParam}}<{{this.typeParam}}>{{/if}}({{this.initial}});
{{/each}}
{{/if}}

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

{{#each callbacks}}
  const {{this.name}} = useCallback({{#if this.async}}async {{/if}}({{this.params}}){{#if this.returnType}}: {{this.returnType}}{{/if}} => {
{{#if ../useReducer}}
    {{this.dispatchBody}}
{{else}}
    {{this.body}}
{{/if}}
  }, [{{join this.deps}}]);
{{/each}}

{{#if useMemo}}
  const value = useMemo<{{contextName}}ContextValue>(() => ({
{{#if useReducer}}
    ...state,
{{else}}
{{#each stateFields}}
    {{this.name}},
{{/each}}
{{/if}}
{{#each actions}}
    {{this.name}},
{{/each}}
  }), [{{join memoDepsList}}]);
{{else}}
  const value: {{contextName}}ContextValue = {
{{#if useReducer}}
    ...state,
{{else}}
{{#each stateFields}}
    {{this.name}},
{{/each}}
{{/if}}
{{#each actions}}
    {{this.name}},
{{/each}}
  };
{{/if}}

  return (
    <{{contextName}}Context.Provider value={value}>
      {children}
    </{{contextName}}Context.Provider>
  );
}

{{#if hookDescription}}/**
 * {{hookDescription}}
 */
{{/if}}export function use{{contextName}}() {
  const context = useContext({{contextName}}Context);
  
  if (context === undefined) {
    throw new Error('use{{contextName}} must be used within a {{contextName}}Provider');
  }
  
  return context;
}

export { {{contextName}}Context };
`;

/**
 * Prepare variables for context generation
 */
function prepareVariables(config) {
  const variables = {
    contextName: config.name,
    providerDescription: config.providerDescription || '',
    hookDescription: config.hookDescription || `Hook to access ${config.name} context`,
    useReducer: config.useReducer || false,
    hasEffect: !!(config.effects && config.effects.length > 0),
    hasCallback: !!(config.callbacks && config.callbacks.length > 0),
    useMemo: config.useMemo !== false,
    stateFields: config.state || [],
    actions: config.actions || [],
    reducerActions: config.reducerActions || [],
    callbacks: config.callbacks || [],
    effects: config.effects || [],
    types: config.types || [],
    imports: config.imports || []
  };

  // Generate memo deps list
  if (variables.useMemo) {
    const deps = [];
    if (variables.useReducer) {
      deps.push('state');
    } else {
      deps.push(...variables.stateFields.map(f => f.name));
    }
    deps.push(...variables.actions.map(a => a.name));
    variables.memoDepsList = deps;
  }

  return variables;
}

module.exports = {
  template,
  prepareVariables
};
