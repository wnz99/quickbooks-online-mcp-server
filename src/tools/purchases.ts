import type { FastMCP } from "fastmcp";
import {
  createPurchaseSchema,
  getPurchaseSchema,
  updatePurchaseSchema,
  deletePurchaseSchema,
  searchPurchasesSchema,
} from "../schemas/purchases";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerPurchaseTools(server: FastMCP) {
  // ── create_purchase ──────────────────────────────────────────────────
  server.addTool({
    name: "create_purchase",
    description: "Create a purchase in QuickBooks Online.",
    parameters: createPurchaseSchema,
    execute: executeQbo("create_purchase", (qbo, args) =>
      qboRequest(cb => qbo.createPurchase(args.purchase, cb))
    ),
  });

  // ── get_purchase ─────────────────────────────────────────────────────
  server.addTool({
    name: "get_purchase",
    description: "Get a purchase by ID from QuickBooks Online.",
    parameters: getPurchaseSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_purchase", (qbo, args) =>
      qboRequest(cb => qbo.getPurchase(args.id, cb))
    ),
  });

  // ── update_purchase ──────────────────────────────────────────────────
  server.addTool({
    name: "update_purchase",
    description: "Update an existing purchase in QuickBooks Online.",
    parameters: updatePurchaseSchema,
    execute: executeQbo("update_purchase", (qbo, args) =>
      qboRequest(cb => qbo.updatePurchase(args.purchase, cb))
    ),
  });

  // ── delete_purchase ──────────────────────────────────────────────────
  server.addTool({
    name: "delete_purchase",
    description: "Delete a purchase from QuickBooks Online.",
    parameters: deletePurchaseSchema,
    execute: executeQbo("delete_purchase", (qbo, args) =>
      qboRequest(cb => qbo.deletePurchase(args.idOrEntity, cb))
    ),
  });

  // ── search_purchases ─────────────────────────────────────────────────
  server.addTool({
    name: "search_purchases",
    description: "Search purchases in QuickBooks Online that match given criteria.",
    parameters: searchPurchasesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_purchases", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findPurchases(searchCriteria, cb));
      return response?.QueryResponse?.Purchase ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
