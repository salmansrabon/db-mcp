import { connectionManager } from "../db/connectionManager.js";

export async function listConnections() {
  const connections = connectionManager.getConnectionInfo();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(connections, null, 2),
      },
    ],
  };
}
