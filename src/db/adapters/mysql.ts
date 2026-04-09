import mysql from "mysql2/promise";
import type { MySQLConnectionConfig } from "../../config.js";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export class MySQLAdapter {
  private pool: mysql.Pool;
  readonly id: string;
  readonly type = "mysql" as const;
  readonly host: string;

  constructor(config: MySQLConnectionConfig) {
    this.id = config.id;
    this.host = config.host;

    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10_000,
      // Disable multiple statements to prevent SQL injection chaining
      multipleStatements: false,
    });
  }

  /** Run a raw SQL string, optionally switching to a specific database first. */
  async query(sql: string, database?: string): Promise<QueryResult> {
    const conn = await this.pool.getConnection();
    try {
      if (database) {
        const safeDb = sanitizeIdentifier(database);
        await conn.query(`USE \`${safeDb}\``);
      }
      const [rows, fields] = await conn.query<mysql.RowDataPacket[]>(sql);
      const columns = fields
        ? (fields as mysql.FieldPacket[]).map((f) => f.name)
        : [];
      return {
        columns,
        rows: rows as Record<string, unknown>[],
        rowCount: rows.length,
      };
    } finally {
      conn.release();
    }
  }

  async listDatabases(): Promise<string[]> {
    const result = await this.query("SHOW DATABASES");
    return result.rows.map((row) => Object.values(row)[0] as string);
  }

  async listTables(database: string): Promise<string[]> {
    const result = await this.query("SHOW TABLES", database);
    return result.rows.map((row) => Object.values(row)[0] as string);
  }

  async describeTable(database: string, table: string): Promise<QueryResult> {
    const safeName = sanitizeIdentifier(table);
    return this.query(`DESCRIBE \`${safeName}\``, database);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function sanitizeIdentifier(name: string): string {
  // Allow only alphanumeric, underscore, and dollar sign (valid MySQL identifiers)
  const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "");
  if (sanitized !== name || sanitized.length === 0) {
    throw new Error(`Invalid identifier: "${name}"`);
  }
  return sanitized;
}
