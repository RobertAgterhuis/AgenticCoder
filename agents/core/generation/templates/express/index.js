/**
 * Express Templates - Index
 */

const route = require('./route.template');
const controller = require('./controller.template');
const service = require('./service.template');
const middleware = require('./middleware.template');
const model = require('./model.template');

module.exports = {
  route,
  controller,
  service,
  middleware,
  model,
  
  // Template metadata
  metadata: {
    framework: 'express',
    version: '4.x',
    language: 'typescript',
    templates: [
      { name: 'route', description: 'Express router with RESTful routes' },
      { name: 'controller', description: 'Controller with CRUD operations' },
      { name: 'service', description: 'Service class with business logic' },
      { name: 'middleware', description: 'Express middleware with options' },
      { name: 'model', description: 'Database model (Mongoose/TypeORM/Prisma)' }
    ]
  }
};
