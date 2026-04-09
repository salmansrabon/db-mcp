import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

// Reject any query that contains write/DDL keywords
const WRITE_PATTERN =
  /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|RENAME|GRANT|REVOKE|LOCK|UNLOCK|CALL|EXEC|EXECUTE|LOAD|IMPORT)\b/i;

const MAX_ROWS = 500;

export const executeQuerySchema = {
  connection_id: z
    .string()
    .describe("The connection ID to run the query on"),
  database: z
    .string()
    .describe("The database name to run the query against"),
  sql: z
    .string()
    .describe(
      "A read-only SELECT SQL query to execute. Write operations are not permitted."
    ),
};

export async function executeQuery({
  connection_id,
  database,
  sql,
}: {
  connection_id: string;
  database: string;
  sql: string;
}) {
  const trimmed = sql.trim();

  // Must start with SELECT or WITH (CTEs)
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Error: Only SELECT (or WITH ... SELECT) queries are allowed.",
        },
      ],
    };
  }

  if (WRITE_PATTERN.test(trimmed)) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Error: Query contains disallowed keyword(s). Only read-only SELECT queries are permitted.",
        },
      ],
    };
  }

  const adapter = connectionManager.getAdapter(connection_id);
  const result = await adapter.query(trimmed, database);

  const rows = result.rows.slice(0, MAX_ROWS);
  const truncated = result.rowCount > MAX_ROWS;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            connection_id,
            database,
            columns: result.columns,
            rows,
            rowCount: rows.length,
            totalRows: result.rowCount,
            truncated,
            ...(truncated && {
              notice: `Results truncated to ${MAX_ROWS} rows. Refine your query with WHERE/LIMIT for more targeted results.`,
            }),
          },
          null,
          2
        ),
      },
    ],
  };
}
