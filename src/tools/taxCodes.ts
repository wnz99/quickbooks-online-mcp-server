import type { FastMCP } from "fastmcp";
import {
  getTaxCodeSchema,
  updateTaxCodeSchema,
  searchTaxCodesSchema,
} from "../schemas/taxCodes";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTaxCodeTools(server: FastMCP) {
  // ── get_tax_code ──
  server.addTool({
    name: "get_tax_code",
    description: "Get a tax code by ID from QuickBooks Online.",
    parameters: getTaxCodeSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_tax_code", (qbo, args) =>
      qboRequest(cb => qbo.getTaxCode(args.id, cb))
    ),
  });

  // ── update_tax_code ──
  server.addTool({
    name: "update_tax_code",
    description: "Update an existing tax code in QuickBooks Online.",
    parameters: updateTaxCodeSchema,
    execute: executeQbo("update_tax_code", (qbo, args) =>
      qboRequest(cb => qbo.updateTaxCode(args.taxCode, cb))
    ),
  });

  // ── search_tax_codes ──
  server.addTool({
    name: "search_tax_codes",
    description: "Search tax codes in QuickBooks Online that match given criteria.",
    parameters: searchTaxCodesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_tax_codes", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTaxCodes(searchCriteria, cb));
      return response?.QueryResponse?.TaxCode ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
