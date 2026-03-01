import type QuickBooks from "node-quickbooks";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "./errors";
import { logger } from "./logger";

/**
 * Wraps a QBO operation with authentication, error handling, logging, and JSON formatting.
 * Replaces the repetitive try/catch + authenticate + withLogging boilerplate.
 */
export function executeQbo<TArgs>(
  toolName: string,
  operation: (qbo: QuickBooks, args: TArgs) => Promise<unknown>
) {
  return async (args: TArgs): Promise<string> => {
    logger.info(`[tool:${toolName}] CALL`, JSON.stringify(args));
    try {
      await quickbooksClient.authenticate();
      const qbo = quickbooksClient.getQuickbooks();
      const result = await operation(qbo, args);
      logger.info(`[tool:${toolName}] OK`, JSON.stringify(result));
      return JSON.stringify({ success: true, result });
    } catch (error: unknown) {
      const formatted = formatError(error);
      logger.error(`[tool:${toolName}] ERROR`, JSON.stringify({ error: formatted, rawError: error }));
      return JSON.stringify({ success: false, error: formatted });
    }
  };
}
