import type { FastMCP } from "fastmcp";
import {
  getExchangeRateSchema,
  updateExchangeRateSchema,
} from "../schemas/exchangeRates";
import { qboRequest } from "../utils/qboRequest";
import { executeQbo } from "../utils/executeQbo";

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
}
