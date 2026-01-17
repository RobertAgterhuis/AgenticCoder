/**
 * React Templates - Index
 */

const component = require('./component.template');
const page = require('./page.template');
const hook = require('./hook.template');
const service = require('./service.template');
const context = require('./context.template');

module.exports = {
  component,
  page,
  hook,
  service,
  context,
  
  // Template metadata
  metadata: {
    framework: 'react',
    version: '18.x',
    language: 'typescript',
    templates: [
      { name: 'component', description: 'Functional component with props, state, effects' },
      { name: 'page', description: 'Page component with routing integration' },
      { name: 'hook', description: 'Custom hook with TypeScript interfaces' },
      { name: 'service', description: 'API service with fetch utilities' },
      { name: 'context', description: 'Context provider with custom hook' }
    ]
  }
};
