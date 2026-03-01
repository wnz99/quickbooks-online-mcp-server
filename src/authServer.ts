#!/usr/bin/env node

import { quickbooksClient } from "./clients/quickbooksClient";
import { logger } from "./utils/logger";

logger.info("Starting QuickBooks OAuth authentication flow...");
logger.info("Your browser will open for authorization.");

quickbooksClient
  .forceOAuthFlow()
  .then(() => {
    logger.info("Authentication successful. Tokens saved to .env");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Authentication failed", error);
    process.exit(1);
  });
