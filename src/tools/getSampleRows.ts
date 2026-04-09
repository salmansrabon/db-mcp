import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

export const getSampleRowsSchema = {
  connection_id: z.string().describe("The connection ID"),
  database: z.string().describe("The database name"),
  table: z.string().describe("The table name to sample"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Number of rows to return (1–100, default 10)"),
};

export async function getSampleRows({
  connection_id,
  database,
  table,
  limit = 10,
}: {
  connection_id: string;
  database: string;
  table: string;
  limit?: number;
}) {
  const adapter = connectionManager.getAdapter(connection_id);
  const safeTable = table.replace(/[^a-zA-Z0-9_$]/g, "");
  if (safeTable !== table || safeTable.length === 0) {
    return {
      isError: true,
      content: [
        { type: "text" as const, text: `Error: Invalid table name: "${table}"` },
      ],
    };
  }

  const safeLimit = Math.min(Math.max(1, limit), 100);
  const result = await adapter.query(
    `SELECT * FROM \`${safeTable}\` LIMIT ${safeLimit}`,
    database
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            connection_id,
            database,
            table,
            columns: result.columns,
            rows: result.rows,
            rowCount: result.rowCount,
          },
          null,
          2
        ),
      },
    ],
  };
}
