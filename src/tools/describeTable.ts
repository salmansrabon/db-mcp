import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

export const describeTableSchema = {
  connection_id: z.string().describe("The connection ID"),
  database: z.string().describe("The database name"),
  table: z.string().describe("The table name to describe"),
};

export async function describeTable({
  connection_id,
  database,
  table,
}: {
  connection_id: string;
  database: string;
  table: string;
}) {
  const adapter = connectionManager.getAdapter(connection_id);
  const result = await adapter.describeTable(database, table);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { connection_id, database, table, schema: result.rows },
          null,
          2
        ),
      },
    ],
  };
}
