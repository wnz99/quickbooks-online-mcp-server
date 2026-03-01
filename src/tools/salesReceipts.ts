import type { FastMCP } from "fastmcp";
import {
  createSalesReceiptSchema,
  getSalesReceiptSchema,
  updateSalesReceiptSchema,
  deleteSalesReceiptSchema,
  searchSalesReceiptsSchema,
} from "../schemas/salesReceipts";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerSalesReceiptTools(server: FastMCP) {
  // ── create_sales_receipt ──
  server.addTool({
    name: "create_sales_receipt",
    description: "Create a sales receipt in QuickBooks Online.",
    parameters: createSalesReceiptSchema,
    execute: executeQbo("create_sales_receipt", (qbo, args) =>
      qboRequest(cb => qbo.createSalesReceipt(args.salesReceipt, cb))
    ),
  });

  // ── get_sales_receipt ──
  server.addTool({
    name: "get_sales_receipt",
    description: "Get a sales receipt by ID from QuickBooks Online.",
    parameters: getSalesReceiptSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_sales_receipt", (qbo, args) =>
      qboRequest(cb => qbo.getSalesReceipt(args.id, cb))
    ),
  });

  // ── update_sales_receipt ──
  server.addTool({
    name: "update_sales_receipt",
    description: "Update an existing sales receipt in QuickBooks Online.",
    parameters: updateSalesReceiptSchema,
    execute: executeQbo("update_sales_receipt", (qbo, args) =>
      qboRequest(cb => qbo.updateSalesReceipt(args.salesReceipt, cb))
    ),
  });

  // ── delete_sales_receipt ──
  server.addTool({
    name: "delete_sales_receipt",
    description: "Delete a sales receipt from QuickBooks Online.",
    parameters: deleteSalesReceiptSchema,
    execute: executeQbo("delete_sales_receipt", (qbo, args) =>
      qboRequest(cb => qbo.deleteSalesReceipt(args.idOrEntity, cb))
    ),
  });

  // ── search_sales_receipts ──
  server.addTool({
    name: "search_sales_receipts",
    description: "Search sales receipts in QuickBooks Online that match given criteria.",
    parameters: searchSalesReceiptsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_sales_receipts", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findSalesReceipts(searchCriteria, cb));
      return response?.QueryResponse?.SalesReceipt ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
