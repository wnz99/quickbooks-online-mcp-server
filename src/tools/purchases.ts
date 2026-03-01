import type { FastMCP } from "fastmcp";
import {
  createPurchaseSchema,
  getPurchaseSchema,
  updatePurchaseSchema,
  deletePurchaseSchema,
  searchPurchasesSchema,
} from "../schemas/purchases";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerPurchaseTools(server: FastMCP) {
  // ── create_purchase ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_purchase",
      description: "Create a purchase in QuickBooks Online.",
      parameters: createPurchaseSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.createPurchase(args.purchase, (err: any, purchase: any) => {
              if (err) reject(err);
              else resolve(purchase);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_purchase ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_purchase",
      description: "Get a purchase by ID from QuickBooks Online.",
      parameters: getPurchaseSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.getPurchase(args.id, (err: any, purchase: any) => {
              if (err) reject(err);
              else resolve(purchase);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_purchase ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_purchase",
      description: "Update an existing purchase in QuickBooks Online.",
      parameters: updatePurchaseSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.updatePurchase(args.purchase, (err: any, purchase: any) => {
              if (err) reject(err);
              else resolve(purchase);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_purchase ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_purchase",
      description: "Delete a purchase from QuickBooks Online.",
      parameters: deletePurchaseSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.deletePurchase(args.idOrEntity, (err: any, purchase: any) => {
              if (err) reject(err);
              else resolve(purchase);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_purchases ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_purchases",
      description: "Search purchases in QuickBooks Online that match given criteria.",
      parameters: searchPurchasesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            qbo.findPurchases(searchCriteria, (err: any, purchases: any) => {
              if (err) reject(err);
              else resolve(
                purchases?.QueryResponse?.Purchase ??
                purchases?.QueryResponse?.totalCount ??
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
