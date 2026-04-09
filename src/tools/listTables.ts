import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

export const listTablesSchema = {
  connection_id: z.string().describe("The connection ID to list tables from"),
  database: z.string().describe("The database name to list tables from"),
};

export async function listTables({
  connection_id,
  database,
}: {
  connection_id: string;
  database: string;
}) {
  const adapter = connectionManager.getAdapter(connection_id);
  const tables = await adapter.listTables(database);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ connection_id, database, tables, count: tables.length }, null, 2),
      },
    ],
  };
}
