import type { FastMCP } from "fastmcp";
import {
  createRefundReceiptSchema,
  getRefundReceiptSchema,
  updateRefundReceiptSchema,
  deleteRefundReceiptSchema,
  searchRefundReceiptsSchema,
} from "../schemas/refundReceipts";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerRefundReceiptTools(server: FastMCP) {
  // ── create_refund_receipt ──
  server.addTool(
    withLogging({
      name: "create_refund_receipt",
      description: "Create a refund receipt in QuickBooks Online.",
      parameters: createRefundReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createRefundReceipt(args.refundReceipt, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_refund_receipt ──
  server.addTool(
    withLogging({
      name: "get_refund_receipt",
      description: "Get a refund receipt by ID from QuickBooks Online.",
      parameters: getRefundReceiptSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getRefundReceipt(args.id, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_refund_receipt ──
  server.addTool(
    withLogging({
      name: "update_refund_receipt",
      description: "Update an existing refund receipt in QuickBooks Online.",
      parameters: updateRefundReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateRefundReceipt(args.refundReceipt, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_refund_receipt ──
  server.addTool(
    withLogging({
      name: "delete_refund_receipt",
      description: "Delete a refund receipt from QuickBooks Online.",
      parameters: deleteRefundReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteRefundReceipt(args.idOrEntity, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_refund_receipts ──
  server.addTool(
    withLogging({
      name: "search_refund_receipts",
      description: "Search refund receipts in QuickBooks Online that match given criteria.",
      parameters: searchRefundReceiptsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findRefundReceipts(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.RefundReceipt ??
                data?.QueryResponse?.totalCount ??
                []
              );
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );
}
