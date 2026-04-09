import { loadConfig, type ConnectionConfig } from "../config.js";
import { MySQLAdapter } from "./adapters/mysql.js";

type Adapter = MySQLAdapter;

class ConnectionManager {
  private adapters = new Map<string, Adapter>();
  private configs: ConnectionConfig[] = [];

  initialize(): void {
    const config = loadConfig();
    this.configs = config.connections;
    console.error(`[db-mcp] Loaded ${this.configs.length} connection(s): ${this.configs.map((c) => c.id).join(", ")}`);
  }

  /** Returns metadata for all configured connections (no credentials). */
  getConnectionInfo(): Array<{ id: string; type: string; host: string }> {
    return this.configs.map((c) => ({
      id: c.id,
      type: c.type,
      host: c.host,
    }));
  }

  /** Lazily creates and returns the adapter for a given connection ID. */
  getAdapter(id: string): Adapter {
    const existing = this.adapters.get(id);
    if (existing) return existing;

    const cfg = this.configs.find((c) => c.id === id);
    if (!cfg) {
      throw new Error(`No connection found with id: "${id}". Available: ${this.configs.map((c) => c.id).join(", ")}`);
    }

    const adapter = new MySQLAdapter(cfg);
    this.adapters.set(id, adapter);
    return adapter;
  }

  async closeAll(): Promise<void> {
    for (const [id, adapter] of this.adapters.entries()) {
      try {
        await adapter.close();
        console.error(`[db-mcp] Closed connection: ${id}`);
      } catch {
        // Ignore close errors during shutdown
      }
    }
    this.adapters.clear();
  }
}

export const connectionManager = new ConnectionManager();
