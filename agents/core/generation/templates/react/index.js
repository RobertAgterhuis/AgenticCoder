/**
 * React Templates - Index
 * Handlebars templates for React 18.x with TypeScript
 */

const fs = require('fs');
const path = require('path');

const templates = {
  component: fs.readFileSync(path.join(__dirname, 'component.tsx.hbs'), 'utf-8'),
  page: fs.readFileSync(path.join(__dirname, 'page.tsx.hbs'), 'utf-8'),
  hook: fs.readFileSync(path.join(__dirname, 'hook.ts.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.ts.hbs'), 'utf-8'),
  context: fs.readFileSync(path.join(__dirname, 'context.tsx.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'react',
  framework: 'react',
  version: '18.x',
  language: 'typescript',
  
  metadata: {
    templates: [
      { name: 'component', description: 'Functional component with props, state, effects' },
      { name: 'page', description: 'Page component with routing integration' },
      { name: 'hook', description: 'Custom hook with TypeScript interfaces' },
      { name: 'service', description: 'API service with fetch utilities' },
      { name: 'context', description: 'Context provider with custom hook' }
    ]
  }
};
