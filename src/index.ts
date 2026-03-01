#!/usr/bin/env node

import type { TransportMode, ServerConfig } from "./types";
import { startServer } from "./server";
import { logger } from "./utils/logger";

const args = process.argv.slice(2);

const transport: TransportMode =
  args.includes("--http") || process.env.MCP_TRANSPORT === "http"
    ? "http"
    : "stdio";

const port = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
const logLevel = (process.env.MCP_LOG_LEVEL || "info") as ServerConfig["logLevel"];

const config: ServerConfig = { transport, port, logLevel };

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
  process.exit(1);
});

startServer(config).catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
