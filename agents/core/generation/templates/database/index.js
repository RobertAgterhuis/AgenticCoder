/**
 * Database Templates Index
 * Handlebars templates for database schemas, migrations, and seeds
 */

const fs = require('fs');
const path = require('path');

const templates = {
  postgresql: {
    schema: fs.readFileSync(path.join(__dirname, 'postgresql/schema.sql.hbs'), 'utf-8'),
    migration: fs.readFileSync(path.join(__dirname, 'postgresql/migration.sql.hbs'), 'utf-8'),
    seed: fs.readFileSync(path.join(__dirname, 'postgresql/seed.sql.hbs'), 'utf-8'),
  },
  azureSql: {
    schema: fs.readFileSync(path.join(__dirname, 'azure-sql/schema.sql.hbs'), 'utf-8'),
    storedProcedure: fs.readFileSync(path.join(__dirname, 'azure-sql/stored-procedure.sql.hbs'), 'utf-8'),
    migration: fs.readFileSync(path.join(__dirname, 'azure-sql/migration.sql.hbs'), 'utf-8'),
  },
  cosmosDb: {
    container: fs.readFileSync(path.join(__dirname, 'cosmos-db/container.json.hbs'), 'utf-8'),
    storedProcedure: fs.readFileSync(path.join(__dirname, 'cosmos-db/stored-procedure.js.hbs'), 'utf-8'),
    indexPolicy: fs.readFileSync(path.join(__dirname, 'cosmos-db/index-policy.json.hbs'), 'utf-8'),
  },
};

module.exports = {
  templates,
  category: 'database',
  databases: ['postgresql', 'azure-sql', 'cosmos-db'],
};
