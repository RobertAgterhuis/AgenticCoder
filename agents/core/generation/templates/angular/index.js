/**
 * Angular Templates
 * Handlebars templates for Angular 17+ with standalone components
 */

const fs = require('fs');
const path = require('path');

const templates = {
  component: fs.readFileSync(path.join(__dirname, 'component.ts.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.ts.hbs'), 'utf-8'),
  directive: fs.readFileSync(path.join(__dirname, 'directive.ts.hbs'), 'utf-8'),
  guard: fs.readFileSync(path.join(__dirname, 'guard.ts.hbs'), 'utf-8'),
  module: fs.readFileSync(path.join(__dirname, 'module.ts.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'angular',
  framework: 'angular',
  version: '17.x',
  language: 'typescript',
};
