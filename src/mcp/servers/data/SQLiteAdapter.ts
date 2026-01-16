/**
 * SQLite MCP Server Adapter
 * 
 * Provides SQLite database operations via MCP
 * @module mcp/servers/data/SQLiteAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * SQLite adapter configuration
 */
export interface SQLiteAdapterConfig extends ServerAdapterConfig {
  dbPath?: string;
}

/**
 * Query result
 */
export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  affectedRows?: number;
}

/**
 * Table schema
 */
export interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    defaultValue?: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    unique: boolean;
  }>;
}

/**
 * SQLite MCP Server Adapter
 */
export class SQLiteAdapter extends BaseServerAdapter {
  private dbPath: string;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<SQLiteAdapterConfig>
  ) {
    super(clientManager, config);
    this.dbPath = config?.dbPath || './data/mcp.db';
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'sqlite';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'sqlite',
      name: 'SQLite Server',
      description: 'SQLite database operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', this.dbPath],
      category: 'data',
      enabled: true,
      tags: ['data', 'sqlite', 'database'],
    };
  }

  /**
   * Execute a read query
   */
  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    const response = await this.callTool('read_query', {
      query: sql,
      params: params || [],
    });
    
    if (!response.success) {
      throw new Error(`Query failed: ${response.error?.message}`);
    }

    return response.result as QueryResult;
  }

  /**
   * Execute a write query (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params?: unknown[]): Promise<QueryResult> {
    const response = await this.callTool('write_query', {
      query: sql,
      params: params || [],
    });
    
    if (!response.success) {
      throw new Error(`Execute failed: ${response.error?.message}`);
    }

    return response.result as QueryResult;
  }

  /**
   * List all tables
   */
  async listTables(): Promise<string[]> {
    const response = await this.callTool('list_tables', {});
    
    if (!response.success) {
      throw new Error(`Failed to list tables: ${response.error?.message}`);
    }

    return response.result as string[];
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName: string): Promise<TableSchema> {
    const response = await this.callTool('describe_table', {
      table_name: tableName,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get schema: ${response.error?.message}`);
    }

    return response.result as TableSchema;
  }

  /**
   * Create a table
   */
  async createTable(tableName: string, columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    defaultValue?: string;
  }>): Promise<void> {
    const columnDefs = columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue !== undefined) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`;
    await this.execute(sql);
  }

  /**
   * Insert a record
   */
  async insert(tableName: string, data: Record<string, unknown>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);
    
    return result.affectedRows || 0;
  }

  /**
   * Update records
   */
  async update(
    tableName: string,
    data: Record<string, unknown>,
    where: string,
    whereParams?: unknown[]
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`;
    const result = await this.execute(sql, [...values, ...(whereParams || [])]);
    
    return result.affectedRows || 0;
  }

  /**
   * Delete records
   */
  async delete(tableName: string, where: string, whereParams?: unknown[]): Promise<number> {
    const sql = `DELETE FROM ${tableName} WHERE ${where}`;
    const result = await this.execute(sql, whereParams);
    
    return result.affectedRows || 0;
  }

  /**
   * Select records
   */
  async select<T = Record<string, unknown>>(
    tableName: string,
    options?: {
      columns?: string[];
      where?: string;
      whereParams?: unknown[];
      orderBy?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    const columns = options?.columns?.join(', ') || '*';
    let sql = `SELECT ${columns} FROM ${tableName}`;
    const params: unknown[] = [];

    if (options?.where) {
      sql += ` WHERE ${options.where}`;
      if (options.whereParams) {
        params.push(...options.whereParams);
      }
    }

    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const result = await this.query(sql, params);
    
    // Convert rows to objects
    return result.rows.map(row => {
      const obj: Record<string, unknown> = {};
      result.columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj as T;
    });
  }

  /**
   * Count records
   */
  async count(tableName: string, where?: string, whereParams?: unknown[]): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }

    const result = await this.query(sql, whereParams);
    return (result.rows[0]?.[0] as number) || 0;
  }
}

/**
 * Create a SQLite adapter
 */
export function createSQLiteAdapter(
  clientManager: MCPClientManager,
  config?: Partial<SQLiteAdapterConfig>
): SQLiteAdapter {
  return new SQLiteAdapter(clientManager, config);
}
