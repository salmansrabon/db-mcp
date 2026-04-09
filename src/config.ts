import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: resolve(__dirname, "../.env") });

/** Replace ${VAR_NAME} placeholders in a string with process.env values. */
function resolveEnv(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => {
    const envVal = process.env[name];
    if (envVal === undefined) {
      throw new Error(`Environment variable "${name}" is not set (referenced in connections.json)`);
    }
    return envVal;
  });
}

export interface MySQLConnectionConfig {
  id: string;
  type: "mysql";
  host: string;
  port: number;
  user: string;
  password: string;
}

export type ConnectionConfig = MySQLConnectionConfig;

export interface Config {
  connections: ConnectionConfig[];
}

export function loadConfig(): Config {
  const configPath = resolve(__dirname, "../connections.json");
  // Resolve env var placeholders before parsing
  const raw = resolveEnv(readFileSync(configPath, "utf-8"));
  const config = JSON.parse(raw) as Config;

  // Coerce port to number (may come in as string after env substitution)
  for (const conn of (config.connections ?? [])) {
    conn.port = Number(conn.port);
  }

  if (!Array.isArray(config.connections) || config.connections.length === 0) {
    throw new Error("connections.json must contain at least one connection");
  }

  for (const conn of config.connections) {
    if (!conn.id || !conn.type) {
      throw new Error(`Each connection must have an "id" and "type" field`);
    }
    if (conn.type !== "mysql") {
      throw new Error(`Unsupported type "${conn.type}" for connection "${conn.id}". Only "mysql" is supported.`);
    }
  }

  return config;
}
