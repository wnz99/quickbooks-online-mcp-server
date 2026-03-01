import type { FastMCP } from "fastmcp";
import {
  getExchangeRateSchema,
  updateExchangeRateSchema,
} from "../schemas/exchangeRates";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";

export function registerExchangeRateTools(server: FastMCP) {
  // ── get_exchange_rate ──
  server.addTool(
    withLogging({
      name: "get_exchange_rate",
      description: "Get a exchange rate by ID from QuickBooks Online.",
      parameters: getExchangeRateSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getExchangeRate(args.id, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_exchange_rate ──
  server.addTool(
    withLogging({
      name: "update_exchange_rate",
      description: "Update an existing exchange rate in QuickBooks Online.",
      parameters: updateExchangeRateSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateExchangeRate(args.exchangeRate, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

}
