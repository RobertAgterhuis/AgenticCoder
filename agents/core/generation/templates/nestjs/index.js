/**
 * NestJS Templates
 * Handlebars templates for NestJS 10.x framework
 */

const fs = require('fs');
const path = require('path');

const templates = {
  module: fs.readFileSync(path.join(__dirname, 'module.ts.hbs'), 'utf-8'),
  controller: fs.readFileSync(path.join(__dirname, 'controller.ts.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.ts.hbs'), 'utf-8'),
  dto: fs.readFileSync(path.join(__dirname, 'dto.ts.hbs'), 'utf-8'),
  guard: fs.readFileSync(path.join(__dirname, 'guard.ts.hbs'), 'utf-8'),
  interceptor: fs.readFileSync(path.join(__dirname, 'interceptor.ts.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'nestjs',
  framework: 'nestjs',
  version: '10.x',
  language: 'typescript',
};
