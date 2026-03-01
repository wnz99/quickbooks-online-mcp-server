#!/usr/bin/env node

import open from "open";
import { quickbooksClient } from "./clients/quickbooksClient";
import { logger } from "./utils/logger";

const authUrl = quickbooksClient.getAuthorizationUrl();
logger.info("Opening browser for QuickBooks authorization...");
logger.info(`Callback will be handled by: ${process.env.QUICKBOOKS_REDIRECT_URI || "http://localhost:8000/callback"}`);

await open(authUrl);
