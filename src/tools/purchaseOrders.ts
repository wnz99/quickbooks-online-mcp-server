import type { FastMCP } from "fastmcp";
import {
  createPurchaseOrderSchema,
  getPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  deletePurchaseOrderSchema,
  searchPurchaseOrdersSchema,
} from "../schemas/purchaseOrders";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerPurchaseOrderTools(server: FastMCP) {
  // ── create_purchase_order ──
  server.addTool(
    withLogging({
      name: "create_purchase_order",
      description: "Create a purchase order in QuickBooks Online.",
      parameters: createPurchaseOrderSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createPurchaseOrder(args.purchaseOrder, (err: any, entity: any) => {
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

  // ── get_purchase_order ──
  server.addTool(
    withLogging({
      name: "get_purchase_order",
      description: "Get a purchase order by ID from QuickBooks Online.",
      parameters: getPurchaseOrderSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getPurchaseOrder(args.id, (err: any, entity: any) => {
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

  // ── update_purchase_order ──
  server.addTool(
    withLogging({
      name: "update_purchase_order",
      description: "Update an existing purchase order in QuickBooks Online.",
      parameters: updatePurchaseOrderSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updatePurchaseOrder(args.purchaseOrder, (err: any, entity: any) => {
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

  // ── delete_purchase_order ──
  server.addTool(
    withLogging({
      name: "delete_purchase_order",
      description: "Delete a purchase order from QuickBooks Online.",
      parameters: deletePurchaseOrderSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deletePurchaseOrder(args.idOrEntity, (err: any, entity: any) => {
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

  // ── search_purchase_orders ──
  server.addTool(
    withLogging({
      name: "search_purchase_orders",
      description: "Search purchase orders in QuickBooks Online that match given criteria.",
      parameters: searchPurchaseOrdersSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findPurchaseOrders(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.PurchaseOrder ??
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
