import type { FastMCP } from "fastmcp";
import {
  createVendorCreditSchema,
  getVendorCreditSchema,
  updateVendorCreditSchema,
  deleteVendorCreditSchema,
  searchVendorCreditsSchema,
} from "../schemas/vendorCredits";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerVendorCreditTools(server: FastMCP) {
  // ── create_vendor_credit ──
  server.addTool({
    name: "create_vendor_credit",
    description: "Create a vendor credit in QuickBooks Online.",
    parameters: createVendorCreditSchema,
    execute: executeQbo("create_vendor_credit", (qbo, args) =>
      qboRequest(cb => qbo.createVendorCredit(args.vendorCredit, cb))
    ),
  });

  // ── get_vendor_credit ──
  server.addTool({
    name: "get_vendor_credit",
    description: "Get a vendor credit by ID from QuickBooks Online.",
    parameters: getVendorCreditSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_vendor_credit", (qbo, args) =>
      qboRequest(cb => qbo.getVendorCredit(args.id, cb))
    ),
  });

  // ── update_vendor_credit ──
  server.addTool({
    name: "update_vendor_credit",
    description: "Update an existing vendor credit in QuickBooks Online.",
    parameters: updateVendorCreditSchema,
    execute: executeQbo("update_vendor_credit", (qbo, args) =>
      qboRequest(cb => qbo.updateVendorCredit(args.vendorCredit, cb))
    ),
  });

  // ── delete_vendor_credit ──
  server.addTool({
    name: "delete_vendor_credit",
    description: "Delete a vendor credit from QuickBooks Online.",
    parameters: deleteVendorCreditSchema,
    execute: executeQbo("delete_vendor_credit", (qbo, args) =>
      qboRequest(cb => qbo.deleteVendorCredit(args.idOrEntity, cb))
    ),
  });

  // ── search_vendor_credits ──
  server.addTool({
    name: "search_vendor_credits",
    description: "Search vendor credits in QuickBooks Online that match given criteria.",
    parameters: searchVendorCreditsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_vendor_credits", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findVendorCredits(searchCriteria, cb));
      return response?.QueryResponse?.VendorCredit ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
