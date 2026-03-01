import type { FastMCP } from "fastmcp";
import {
  createRefundReceiptSchema,
  getRefundReceiptSchema,
  updateRefundReceiptSchema,
  deleteRefundReceiptSchema,
  searchRefundReceiptsSchema,
} from "../schemas/refundReceipts";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerRefundReceiptTools(server: FastMCP) {
  // ── create_refund_receipt ──
  server.addTool({
    name: "create_refund_receipt",
    description: "Create a refund receipt in QuickBooks Online.",
    parameters: createRefundReceiptSchema,
    execute: executeQbo("create_refund_receipt", (qbo, args) =>
      qboRequest(cb => qbo.createRefundReceipt(args.refundReceipt, cb))
    ),
  });

  // ── get_refund_receipt ──
  server.addTool({
    name: "get_refund_receipt",
    description: "Get a refund receipt by ID from QuickBooks Online.",
    parameters: getRefundReceiptSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_refund_receipt", (qbo, args) =>
      qboRequest(cb => qbo.getRefundReceipt(args.id, cb))
    ),
  });

  // ── update_refund_receipt ──
  server.addTool({
    name: "update_refund_receipt",
    description: "Update an existing refund receipt in QuickBooks Online.",
    parameters: updateRefundReceiptSchema,
    execute: executeQbo("update_refund_receipt", (qbo, args) =>
      qboRequest(cb => qbo.updateRefundReceipt(args.refundReceipt, cb))
    ),
  });

  // ── delete_refund_receipt ──
  server.addTool({
    name: "delete_refund_receipt",
    description: "Delete a refund receipt from QuickBooks Online.",
    parameters: deleteRefundReceiptSchema,
    execute: executeQbo("delete_refund_receipt", (qbo, args) =>
      qboRequest(cb => qbo.deleteRefundReceipt(args.idOrEntity, cb))
    ),
  });

  // ── search_refund_receipts ──
  server.addTool({
    name: "search_refund_receipts",
    description: "Search refund receipts in QuickBooks Online that match given criteria.",
    parameters: searchRefundReceiptsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_refund_receipts", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findRefundReceipts(searchCriteria, cb));
      return response?.QueryResponse?.RefundReceipt ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
