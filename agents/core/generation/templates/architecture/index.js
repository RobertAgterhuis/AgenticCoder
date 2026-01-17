/**
 * Architecture Templates Index
 * Handlebars templates for microservices, serverless, and event-driven architectures
 */

const fs = require('fs');
const path = require('path');

const templates = {
  microservices: {
    dockerCompose: fs.readFileSync(path.join(__dirname, 'microservices/docker-compose.yml.hbs'), 'utf-8'),
    apiGateway: fs.readFileSync(path.join(__dirname, 'microservices/api-gateway.yml.hbs'), 'utf-8'),
    service: fs.readFileSync(path.join(__dirname, 'microservices/service.yml.hbs'), 'utf-8'),
  },
  serverless: {
    function: fs.readFileSync(path.join(__dirname, 'serverless/function.ts.hbs'), 'utf-8'),
    durableFunction: fs.readFileSync(path.join(__dirname, 'serverless/durable-function.ts.hbs'), 'utf-8'),
    host: fs.readFileSync(path.join(__dirname, 'serverless/host.json.hbs'), 'utf-8'),
  },
  eventDriven: {
    eventHandler: fs.readFileSync(path.join(__dirname, 'event-driven/event-handler.ts.hbs'), 'utf-8'),
    eventPublisher: fs.readFileSync(path.join(__dirname, 'event-driven/event-publisher.ts.hbs'), 'utf-8'),
    saga: fs.readFileSync(path.join(__dirname, 'event-driven/saga.ts.hbs'), 'utf-8'),
  },
};

module.exports = {
  templates,
  category: 'architecture',
  patterns: ['microservices', 'serverless', 'event-driven'],
};
