/**
 * Express Templates - Index
 * Handlebars templates for Express 4.x with TypeScript
 */

const fs = require('fs');
const path = require('path');

const templates = {
  route: fs.readFileSync(path.join(__dirname, 'route.ts.hbs'), 'utf-8'),
  controller: fs.readFileSync(path.join(__dirname, 'controller.ts.hbs'), 'utf-8'),
  service: fs.readFileSync(path.join(__dirname, 'service.ts.hbs'), 'utf-8'),
  middleware: fs.readFileSync(path.join(__dirname, 'middleware.ts.hbs'), 'utf-8'),
  model: fs.readFileSync(path.join(__dirname, 'model.ts.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'express',
  framework: 'express',
  version: '4.x',
  language: 'typescript',
  
  metadata: {
    templates: [
      { name: 'route', description: 'Express router with RESTful routes' },
      { name: 'controller', description: 'Controller with CRUD operations' },
      { name: 'service', description: 'Service class with business logic' },
      { name: 'middleware', description: 'Express middleware with options' },
      { name: 'model', description: 'Database model (Mongoose/TypeORM/Prisma)' }
    ]
  }
};
