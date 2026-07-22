import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";
import { validateQueryPolicy } from "./executeQuery.js";

const MAX_ROWS = 500;

export const updateQuerySchema = {
  connection_id: z
    .string()
    .describe("The connection ID to run the update query on"),
  database: z
    .string()
    .describe("The database name to run the update query against"),
  sql: z
    .string()
    .describe(
      "An UPDATE SQL query to execute. Only UPDATE statements are permitted; create/alter/insert/delete operations are not allowed."
    ),
};

export async function updateQuery({
  connection_id,
  database,
  sql,
}: {
  connection_id: string;
  database: string;
  sql: string;
}) {
  const validation = validateQueryPolicy(sql, "update");

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
