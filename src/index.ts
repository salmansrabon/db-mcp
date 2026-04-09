import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { connectionManager } from "./db/connectionManager.js";
import { listConnections } from "./tools/listConnections.js";
import { listDatabasesSchema, listDatabases } from "./tools/listDatabases.js";
import { listTablesSchema, listTables } from "./tools/listTables.js";
import { describeTableSchema, describeTable } from "./tools/describeTable.js";
import { executeQuerySchema, executeQuery } from "./tools/executeQuery.js";
import { getSampleRowsSchema, getSampleRows } from "./tools/getSampleRows.js";

// Load and validate connections.json on startup
connectionManager.initialize();

const server = new McpServer({
  name: "db-mcp",
  version: "1.0.0",
});

server.tool(
  "list_connections",
  "List all configured database connections with their IDs, types, and host. Call this first to know which connection_id to use.",
  {},
  listConnections
);

server.tool(
  "list_databases",
  "List all databases available on a given connection. Call this to discover which databases exist before querying.",
  listDatabasesSchema,
  listDatabases
);

server.tool(
  "list_tables",
  "List all tables in a specific database on a given connection.",
  listTablesSchema,
  listTables
);

server.tool(
  "describe_table",
  "Get the full schema of a table: column names, data types, nullability, key info, and defaults.",
  describeTableSchema,
  describeTable
);

server.tool(
  "execute_query",
  "Execute a read-only SELECT SQL query on a specific database connection and return the results. Only SELECT and WITH…SELECT queries are allowed — no writes.",
  executeQuerySchema,
  executeQuery
);

server.tool(
  "get_sample_rows",
  "Fetch a small sample of rows from a table to understand what data it contains.",
  getSampleRowsSchema,
  getSampleRows
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[db-mcp] Server running on stdio");

  const shutdown = async () => {
    console.error("[db-mcp] Shutting down...");
    await connectionManager.closeAll();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  console.error("[db-mcp] Fatal error:", err);
  process.exit(1);
});
