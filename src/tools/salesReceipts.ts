import type { FastMCP } from "fastmcp";
import {
  createSalesReceiptSchema,
  getSalesReceiptSchema,
  updateSalesReceiptSchema,
  deleteSalesReceiptSchema,
  searchSalesReceiptsSchema,
} from "../schemas/salesReceipts";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerSalesReceiptTools(server: FastMCP) {
  // ── create_sales_receipt ──
  server.addTool(
    withLogging({
      name: "create_sales_receipt",
      description: "Create a sales receipt in QuickBooks Online.",
      parameters: createSalesReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createSalesReceipt(args.salesReceipt, (err: any, entity: any) => {
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

  // ── get_sales_receipt ──
  server.addTool(
    withLogging({
      name: "get_sales_receipt",
      description: "Get a sales receipt by ID from QuickBooks Online.",
      parameters: getSalesReceiptSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getSalesReceipt(args.id, (err: any, entity: any) => {
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

  // ── update_sales_receipt ──
  server.addTool(
    withLogging({
      name: "update_sales_receipt",
      description: "Update an existing sales receipt in QuickBooks Online.",
      parameters: updateSalesReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateSalesReceipt(args.salesReceipt, (err: any, entity: any) => {
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

  // ── delete_sales_receipt ──
  server.addTool(
    withLogging({
      name: "delete_sales_receipt",
      description: "Delete a sales receipt from QuickBooks Online.",
      parameters: deleteSalesReceiptSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteSalesReceipt(args.idOrEntity, (err: any, entity: any) => {
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

  // ── search_sales_receipts ──
  server.addTool(
    withLogging({
      name: "search_sales_receipts",
      description: "Search sales receipts in QuickBooks Online that match given criteria.",
      parameters: searchSalesReceiptsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findSalesReceipts(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.SalesReceipt ??
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
