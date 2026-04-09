# db-mcp

An MCP (Model Context Protocol) server that exposes local MySQL databases to AI assistants like Claude.

## Prerequisites

- Node.js 18+
- MySQL server running locally
- Claude Code CLI installed

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database connections

Create a `.env` file with your MySQL credentials (`.env` is gitignored):

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
```

### 3. Build the server

```bash
npm run build
```

## Connecting to Claude Code (MCP)

Register the server globally with one command:

```bash
claude mcp add --scope user db-mcp node ~/db-mcp/dist/index.js
```

Then restart Claude Code. The `db-mcp` tools will be available in every session.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_connections` | List all configured database connections |
| `list_databases` | List all databases on a connection |
| `list_tables` | List all tables in a database |
| `describe_table` | Get the full schema of a table |
| `execute_query` | Run a read-only SELECT query |
| `get_sample_rows` | Fetch sample rows from a table |

> All queries are read-only. Write operations (`INSERT`, `UPDATE`, `DELETE`, etc.) are blocked.

## Usage Example in Claude

Once connected, you can ask Claude things like:

- _"List all databases on local_mysql"_
- _"Show me the tables in mydb"_
- _"What are the distinct user roles in the users table?"_
- _"Run: SELECT * FROM transactions LIMIT 10"_
