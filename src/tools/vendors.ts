import type { FastMCP } from "fastmcp";
import {
  createVendorSchema,
  getVendorSchema,
  updateVendorSchema,
  deleteVendorSchema,
  searchVendorsSchema,
} from "../schemas/vendors";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerVendorTools(server: FastMCP) {
  // ── create_vendor ────────────────────────────────────────────────────
  server.addTool({
    name: "create_vendor",
    description: "Create a vendor in QuickBooks Online.",
    parameters: createVendorSchema,
    execute: executeQbo("create_vendor", (qbo, args) =>
      qboRequest(cb => qbo.createVendor(args.vendor, cb))
    ),
  });

  // ── get_vendor ───────────────────────────────────────────────────────
  server.addTool({
    name: "get_vendor",
    description: "Get a vendor by ID from QuickBooks Online.",
    parameters: getVendorSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_vendor", (qbo, args) =>
      qboRequest(cb => qbo.getVendor(args.id, cb))
    ),
  });

  // ── update_vendor ────────────────────────────────────────────────────
  server.addTool({
    name: "update_vendor",
    description: "Update an existing vendor in QuickBooks Online.",
    parameters: updateVendorSchema,
    execute: executeQbo("update_vendor", (qbo, args) =>
      qboRequest(cb => qbo.updateVendor(args.vendor, cb))
    ),
  });

  // ── delete_vendor ────────────────────────────────────────────────────
  server.addTool({
    name: "delete_vendor",
    description: "Deactivate a vendor in QuickBooks Online (vendors cannot be hard-deleted).",
    parameters: deleteVendorSchema,
    execute: executeQbo("delete_vendor", (qbo, args) =>
      qboRequest(cb => qbo.updateVendor({ ...args.vendor, Active: false }, cb))
    ),
  });

  // ── search_vendors ───────────────────────────────────────────────────
  server.addTool({
    name: "search_vendors",
    description: "Search vendors in QuickBooks Online that match given criteria.",
    parameters: searchVendorsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_vendors", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findVendors(searchCriteria, cb));
      return response?.QueryResponse?.Vendor ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
