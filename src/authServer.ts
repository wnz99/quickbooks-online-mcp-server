#!/usr/bin/env node

import open from "open";
import { quickbooksClient } from "./clients/quickbooksClient";
import { logger } from "./utils/logger";

logger.info("Opening browser for QuickBooks authorization...");
logger.info(`Callback will be handled by: ${process.env.QUICKBOOKS_REDIRECT_URI || "http://localhost:8000/callback"}`);

const callback = new URL(process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:8000/callback');
if (callback.hostname === 'localhost' || callback.hostname === '127.0.0.1') {
  await quickbooksClient.forceOAuthFlow();
} else {
  if (callback.protocol !== 'https:' || !process.env.MCP_API_KEY) {
    throw new Error('Remote OAuth requires HTTPS and MCP_API_KEY');
  }
  // The callback server must generate and retain the single-use OAuth state.
  const response = await fetch(new URL('/auth', callback), {
    headers: { Authorization: `Bearer ${process.env.MCP_API_KEY}` },
    redirect: 'manual',
  });
  const authUrl = response.headers.get('Location');
  if (response.status !== 302 || !authUrl) throw new Error('Could not start authorized QuickBooks connection');
  await open(authUrl);
}
