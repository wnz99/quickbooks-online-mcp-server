export type TransportMode = "stdio" | "http";

export interface ServerConfig {
  logLevel?: "debug" | "error" | "info" | "warn";
  transport: TransportMode;
  port?: number;
}
