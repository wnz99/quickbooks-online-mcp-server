import type { FastMCP } from "fastmcp";
import {
  createPurchaseOrderSchema,
  getPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  deletePurchaseOrderSchema,
  searchPurchaseOrdersSchema,
} from "../schemas/purchaseOrders";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerPurchaseOrderTools(server: FastMCP) {
  // ── create_purchase_order ────────────────────────────────────────────
  server.addTool({
    name: "create_purchase_order",
    description: "Create a purchase order in QuickBooks Online.",
    parameters: createPurchaseOrderSchema,
    execute: executeQbo("create_purchase_order", (qbo, args) =>
      qboRequest(cb => qbo.createPurchaseOrder(args.purchaseOrder, cb))
    ),
  });

  // ── get_purchase_order ───────────────────────────────────────────────
  server.addTool({
    name: "get_purchase_order",
    description: "Get a purchase order by ID from QuickBooks Online.",
    parameters: getPurchaseOrderSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_purchase_order", (qbo, args) =>
      qboRequest(cb => qbo.getPurchaseOrder(args.id, cb))
    ),
  });

  // ── update_purchase_order ────────────────────────────────────────────
  server.addTool({
    name: "update_purchase_order",
    description: "Update an existing purchase order in QuickBooks Online.",
    parameters: updatePurchaseOrderSchema,
    execute: executeQbo("update_purchase_order", (qbo, args) =>
      qboRequest(cb => qbo.updatePurchaseOrder(args.purchaseOrder, cb))
    ),
  });

  // ── delete_purchase_order ────────────────────────────────────────────
  server.addTool({
    name: "delete_purchase_order",
    description: "Delete a purchase order from QuickBooks Online.",
    parameters: deletePurchaseOrderSchema,
    execute: executeQbo("delete_purchase_order", (qbo, args) =>
      qboRequest(cb => qbo.deletePurchaseOrder(args.idOrEntity, cb))
    ),
  });

  // ── search_purchase_orders ───────────────────────────────────────────
  server.addTool({
    name: "search_purchase_orders",
    description: "Search purchase orders in QuickBooks Online that match given criteria.",
    parameters: searchPurchaseOrdersSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_purchase_orders", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findPurchaseOrders(searchCriteria, cb));
      return response?.QueryResponse?.PurchaseOrder ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
