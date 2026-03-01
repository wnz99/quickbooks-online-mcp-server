import type { FastMCP } from "fastmcp";
import {
  createTaxAgencySchema,
  getTaxAgencySchema,
  updateTaxAgencySchema,
  searchTaxAgenciesSchema,
} from "../schemas/taxAgencies";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTaxAgencyTools(server: FastMCP) {
  // ── create_tax_agency ──
  server.addTool({
    name: "create_tax_agency",
    description: "Create a tax agency in QuickBooks Online.",
    parameters: createTaxAgencySchema,
    execute: executeQbo("create_tax_agency", (qbo, args) =>
      qboRequest(cb => qbo.createTaxAgency(args.taxAgency, cb))
    ),
  });

  // ── get_tax_agency ──
  server.addTool({
    name: "get_tax_agency",
    description: "Get a tax agency by ID from QuickBooks Online.",
    parameters: getTaxAgencySchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_tax_agency", (qbo, args) =>
      qboRequest(cb => qbo.getTaxAgency(args.id, cb))
    ),
  });

  // ── update_tax_agency ──
  server.addTool({
    name: "update_tax_agency",
    description: "Update an existing tax agency in QuickBooks Online.",
    parameters: updateTaxAgencySchema,
    execute: executeQbo("update_tax_agency", (qbo, args) =>
      qboRequest(cb => qbo.updateTaxAgency(args.taxAgency, cb))
    ),
  });

  // ── search_tax_agencies ──
  server.addTool({
    name: "search_tax_agencies",
    description: "Search tax agencys in QuickBooks Online that match given criteria.",
    parameters: searchTaxAgenciesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_tax_agencies", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTaxAgencies(searchCriteria, cb));
      return response?.QueryResponse?.TaxAgency ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
