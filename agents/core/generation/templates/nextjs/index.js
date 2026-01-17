/**
 * Next.js Templates
 * Handlebars templates for Next.js 14+ App Router
 */

const fs = require('fs');
const path = require('path');

const templates = {
  page: fs.readFileSync(path.join(__dirname, 'page.tsx.hbs'), 'utf-8'),
  layout: fs.readFileSync(path.join(__dirname, 'layout.tsx.hbs'), 'utf-8'),
  serverAction: fs.readFileSync(path.join(__dirname, 'server-action.ts.hbs'), 'utf-8'),
  apiRoute: fs.readFileSync(path.join(__dirname, 'api-route.ts.hbs'), 'utf-8'),
  middleware: fs.readFileSync(path.join(__dirname, 'middleware.ts.hbs'), 'utf-8'),
};

module.exports = {
  templates,
  category: 'nextjs',
  framework: 'next',
  version: '14.x',
  language: 'typescript',
};
