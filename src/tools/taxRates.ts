import type { FastMCP } from "fastmcp";
import {
  getTaxRateSchema,
  updateTaxRateSchema,
  searchTaxRatesSchema,
} from "../schemas/taxRates";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTaxRateTools(server: FastMCP) {
  // ── get_tax_rate ──
  server.addTool({
    name: "get_tax_rate",
    description: "Get a tax rate by ID from QuickBooks Online.",
    parameters: getTaxRateSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_tax_rate", (qbo, args) =>
      qboRequest(cb => qbo.getTaxRate(args.id, cb))
    ),
  });

  // ── update_tax_rate ──
  server.addTool({
    name: "update_tax_rate",
    description: "Update an existing tax rate in QuickBooks Online.",
    parameters: updateTaxRateSchema,
    execute: executeQbo("update_tax_rate", (qbo, args) =>
      qboRequest(cb => qbo.updateTaxRate(args.taxRate, cb))
    ),
  });

  // ── search_tax_rates ──
  server.addTool({
    name: "search_tax_rates",
    description: "Search tax rates in QuickBooks Online that match given criteria.",
    parameters: searchTaxRatesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_tax_rates", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTaxRates(searchCriteria, cb));
      return response?.QueryResponse?.TaxRate ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
