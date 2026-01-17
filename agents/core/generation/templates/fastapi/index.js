/**
 * FastAPI Templates
 * Handlebars templates for FastAPI Python framework
 */

const fs = require('fs');
const path = require('path');

const templates = {
  router: fs.readFileSync(path.join(__dirname, 'router.py.hbs'), 'utf-8'),
  model: fs.readFileSync(path.join(__dirname, 'model.py.hbs'), 'utf-8'),
  schema: fs.readFileSync(path.join(__dirname, 'schema.py.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.py.hbs'), 'utf-8'),
  dependency: fs.readFileSync(path.join(__dirname, 'dependency.py.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'fastapi',
  framework: 'fastapi',
  version: '0.100+',
  language: 'python',
};
