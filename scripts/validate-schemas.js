#!/usr/bin/env node

/**
 * Schema Validator
 * Validates that all schema files are valid JSON Schema.
 *
 * Notes:
 * - This is a lightweight structural validation (JSON parse + basic required fields).
 * - It intentionally avoids full meta-schema validation to keep it dependency-free.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const schemasDir = path.join(__dirname, '..', '.github', 'schemas');

function listSchemaFilesRecursive(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      files.push(...listSchemaFilesRecursive(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.schema.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(content);
    
    // Check required schema properties
    if (!schema.$schema) {
      throw new Error('Missing $schema property');
    }
    if (!schema.$id) {
      throw new Error('Missing $id property');
    }
    // Most schemas should declare a type, but allow $ref-only schemas.
    if (!schema.type && !schema.$ref && !schema.anyOf && !schema.oneOf && !schema.allOf) {
      throw new Error('Missing type property');
    }
    
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
}

function validateFiles(files, label) {
  let validCount = 0;
  let invalidCount = 0;
  const errors = [];

  for (const filePath of files) {
    const rel = path.relative(schemasDir, filePath).replace(/\\/g, '/');
    const result = validateJsonFile(filePath);

    if (result.valid) {
      validCount++;
      console.log(`✓ ${rel}`);
    } else {
      invalidCount++;
      console.log(`✗ ${rel}: ${result.errors.join(', ')}`);
      errors.push({ file: rel, errors: result.errors });
    }
  }
  
  console.log(`\n${label}: ${validCount} valid, ${invalidCount} invalid\n`);
  return { validCount, invalidCount, errors };
}

console.log('🔍 Validating JSON Schemas\n');
console.log('='.repeat(60) + '\n');

const files = listSchemaFilesRecursive(schemasDir);
if (files.length === 0) {
  console.log('No schema files found under .github/schemas');
  process.exit(1);
}

console.log('📦 Schemas:');
const results = validateFiles(files, 'Schemas');

// Summary
const totalValid = results.validCount;
const totalInvalid = results.invalidCount;

console.log('=' .repeat(60));
console.log(`\n✅ Summary: ${totalValid} schemas valid`);
if (totalInvalid > 0) {
  console.log(`❌ ${totalInvalid} schemas invalid`);
  process.exit(1);
} else {
  console.log('✨ All schemas are valid!');
  process.exit(0);
}
