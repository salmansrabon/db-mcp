import { z } from "zod";
import { connectionManager } from "../db/connectionManager.js";

export const listDatabasesSchema = {
  connection_id: z.string().describe("The connection ID to list databases from"),
};

export async function listDatabases({ connection_id }: { connection_id: string }) {
  const adapter = connectionManager.getAdapter(connection_id);
  const databases = await adapter.listDatabases();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ connection_id, databases, count: databases.length }, null, 2),
      },
    ],
  };
}
