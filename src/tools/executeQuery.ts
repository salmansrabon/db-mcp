import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

// Reject any query that contains disallowed write/DDL keywords.
// `UPDATE` is allowed only in the dedicated update policy, not in the read policy.
const DISALLOWED_WRITE_PATTERN =
  /\b(INSERT|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|RENAME|GRANT|REVOKE|LOCK|UNLOCK|CALL|EXEC|EXECUTE|LOAD|IMPORT)\b/i;

const MAX_ROWS = 500;

type QueryPolicy = "read" | "update";

export function validateQueryPolicy(sql: string, mode: QueryPolicy): { ok: true } | { ok: false; error: string } {
  const trimmed = sql.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "Error: Query cannot be empty.",
    };
  }

  if (mode === "read") {
    if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
      return {
        ok: false,
        error: "Error: Only SELECT (or WITH ... SELECT) queries are allowed.",
      };
    }
  } else if (!/^UPDATE\b/i.test(trimmed)) {
    return {
      ok: false,
      error: "Error: Only UPDATE queries are allowed.",
    };
  }

  if (DISALLOWED_WRITE_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error:
        mode === "read"
          ? "Error: Query contains disallowed keyword(s). Only read-only SELECT queries are permitted."
          : "Error: Query contains disallowed keyword(s). Only single-table UPDATE queries are permitted.",
    };
  }

  return { ok: true };
}

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
  const validation = validateQueryPolicy(sql, "read");

  if (!validation.ok) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: validation.error,
        },
      ],
    };
  }

  const trimmed = sql.trim();
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
