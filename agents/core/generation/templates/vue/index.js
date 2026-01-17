/**
 * Vue Templates
 * Handlebars templates for Vue 3 with Composition API
 */

const fs = require('fs');
const path = require('path');

const templates = {
  component: fs.readFileSync(path.join(__dirname, 'component.vue.hbs'), 'utf-8'),
  page: fs.readFileSync(path.join(__dirname, 'page.vue.hbs'), 'utf-8'),
  composable: fs.readFileSync(path.join(__dirname, 'composable.ts.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.ts.hbs'), 'utf-8'),
  store: fs.readFileSync(path.join(__dirname, 'store.ts.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'vue',
  framework: 'vue',
  version: '3.x',
  language: 'typescript',
};
