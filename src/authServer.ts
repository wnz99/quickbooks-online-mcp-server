#!/usr/bin/env node

import { quickbooksClient } from "./clients/quickbooksClient";
import { logger } from "./utils/logger";

if (process.env.QUICKBOOKS_ENVIRONMENT === "production" || process.env.MCP_TRANSPORT === "http") {
  logger.info("Visit /auth on your running HTTPS server to connect QuickBooks.");
} else {
  await quickbooksClient.forceOAuthFlow();
}
