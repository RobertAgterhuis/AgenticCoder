/**
 * Express Model Template
 * 
 * Generates a database model with:
 * - TypeScript interface
 * - Schema definition (Mongoose/TypeORM style)
 * - Validation
 */

const template = `{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}
{{#if useMongoose}}
import mongoose, { Schema, Document } from 'mongoose';
{{/if}}
{{#if useTypeORM}}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn{{#if hasRelations}}, {{join relationDecorators}}{{/if}} } from 'typeorm';
{{/if}}

{{#if description}}/**
 * {{description}}
 */
{{/if}}export interface {{modelName}} {{#if useMongoose}}extends Document {{/if}}{
{{#each fields}}
  {{#if this.description}}/** {{this.description}} */
  {{/if}}{{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
{{#if timestamps}}
  createdAt: Date;
  updatedAt: Date;
{{/if}}
}

{{#if useMongoose}}
const {{modelName}}Schema = new Schema<{{modelName}}>(
  {
{{#each fields}}
    {{this.name}}: {
      type: {{this.schemaType}},
{{#if this.required}}
      required: {{#if this.requiredMessage}}[true, '{{this.requiredMessage}}']{{else}}true{{/if}},
{{/if}}
{{#if this.unique}}
      unique: true,
{{/if}}
{{#if this.default}}
      default: {{this.default}},
{{/if}}
{{#if this.enum}}
      enum: [{{join this.enum}}],
{{/if}}
{{#if this.ref}}
      ref: '{{this.ref}}',
{{/if}}
{{#if this.validate}}
      validate: {{this.validate}},
{{/if}}
    },
{{/each}}
  },
  {
    timestamps: {{#if timestamps}}true{{else}}false{{/if}},
{{#if collection}}
    collection: '{{collection}}',
{{/if}}
  }
);

{{#each indexes}}
{{modelName}}Schema.index({{json this.fields}}{{#if this.options}}, {{json this.options}}{{/if}});
{{/each}}

{{#each methods}}
{{modelName}}Schema.methods.{{this.name}} = {{#if this.async}}async {{/if}}function({{this.params}}){{#if this.returnType}}: {{this.returnType}}{{/if}} {
{{this.body}}
};
{{/each}}

{{#each statics}}
{{modelName}}Schema.statics.{{this.name}} = {{#if this.async}}async {{/if}}function({{this.params}}){{#if this.returnType}}: {{this.returnType}}{{/if}} {
{{this.body}}
};
{{/each}}

export const {{modelName}} = mongoose.model<{{modelName}}>('{{modelName}}', {{modelName}}Schema);
{{/if}}

{{#if useTypeORM}}
@Entity('{{tableName}}')
export class {{modelName}}Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

{{#each fields}}
{{#if this.relation}}
  @{{this.relation.type}}(() => {{this.relation.target}}{{#if this.relation.options}}, {{json this.relation.options}}{{/if}})
{{#if this.relation.joinColumn}}
  @JoinColumn()
{{/if}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{else}}
  @Column({{#if this.columnOptions}}{{json this.columnOptions}}{{/if}})
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/if}}

{{/each}}
{{#if timestamps}}
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
{{/if}}
}
{{/if}}

{{#if usePrisma}}
// Prisma model is defined in schema.prisma
// This file provides TypeScript types

export type {{modelName}} = {
{{#each fields}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
{{#if timestamps}}
  createdAt: Date;
  updatedAt: Date;
{{/if}}
};

export type Create{{modelName}}Input = Omit<{{modelName}}, 'id'{{#if timestamps}} | 'createdAt' | 'updatedAt'{{/if}}>;
export type Update{{modelName}}Input = Partial<Create{{modelName}}Input>;
{{/if}}
`;

/**
 * Mongoose schema type mapping
 */
const mongooseTypeMap = {
  'string': 'String',
  'number': 'Number',
  'boolean': 'Boolean',
  'date': 'Date',
  'object': 'Schema.Types.Mixed',
  'array': '[Schema.Types.Mixed]',
  'objectId': 'Schema.Types.ObjectId'
};

/**
 * Prepare variables for model generation
 */
function prepareVariables(config) {
  const fields = (config.fields || []).map(field => ({
    ...field,
    schemaType: mongooseTypeMap[field.type?.toLowerCase()] || 'String'
  }));

  return {
    modelName: config.name,
    description: config.description || '',
    tableName: config.tableName || config.name.toLowerCase() + 's',
    collection: config.collection || '',
    timestamps: config.timestamps !== false,
    useMongoose: config.orm === 'mongoose' || !config.orm,
    useTypeORM: config.orm === 'typeorm',
    usePrisma: config.orm === 'prisma',
    fields,
    indexes: config.indexes || [],
    methods: config.methods || [],
    statics: config.statics || [],
    hasRelations: fields.some(f => f.relation),
    relationDecorators: [...new Set(fields.filter(f => f.relation).map(f => f.relation.type))],
    imports: config.imports || []
  };
}

module.exports = {
  template,
  mongooseTypeMap,
  prepareVariables
};
