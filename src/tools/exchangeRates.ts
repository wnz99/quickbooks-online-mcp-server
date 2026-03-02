import type { FastMCP } from "fastmcp";
import { z } from "zod";
import {
  getExchangeRateSchema,
  updateExchangeRateSchema,
} from "../schemas/exchangeRates";
import { qboRequest } from "../utils/qboRequest";
import { executeQbo } from "../utils/executeQbo";
import { logger } from "../utils/logger";

export function registerExchangeRateTools(server: FastMCP) {
  // ── get_exchange_rate ──
  server.addTool({
    name: "get_exchange_rate",
    description: "Get a exchange rate by ID from QuickBooks Online.",
    parameters: getExchangeRateSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_exchange_rate", (qbo, args) =>
      qboRequest(cb => qbo.getExchangeRate(args.id, cb))
    ),
  });

  // ── update_exchange_rate ──
  server.addTool({
    name: "update_exchange_rate",
    description: "Update an existing exchange rate in QuickBooks Online.",
    parameters: updateExchangeRateSchema,
    execute: executeQbo("update_exchange_rate", (qbo, args) =>
      qboRequest(cb => qbo.updateExchangeRate(args.exchangeRate, cb))
    ),
  });

  // ── fetch_exchange_rate ──
  server.addTool({
    name: "fetch_exchange_rate",
    description: "Fetch a live exchange rate from Frankfurter (ECB data). Use this to get current market rates for multi-currency transactions.",
    parameters: z.object({
      from: z.string().describe("Source currency ISO code (e.g. GBP)"),
      to: z.string().describe("Target currency ISO code (e.g. USD)"),
      date: z.string().optional().describe("Date for historical rate (YYYY-MM-DD). Omit for latest."),
    }),
    annotations: { readOnlyHint: true },
    execute: async (args) => {
      const endpoint = args.date ? args.date : "latest";
      const url = `https://api.frankfurter.dev/${endpoint}?from=${args.from}&to=${args.to}`;
      logger.info(`[tool:fetch_exchange_rate] GET ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        return JSON.stringify({ success: false, error: `Frankfurter API error: ${res.status}` });
      }
      const data = await res.json() as Record<string, unknown>;
      const rates = data.rates as Record<string, number>;
      const rate = rates?.[args.to];
      logger.info(`[tool:fetch_exchange_rate] ${args.from} -> ${args.to} = ${rate}`);
      return JSON.stringify({ success: true, from: args.from, to: args.to, rate, date: data.date });
    },
  });
}
