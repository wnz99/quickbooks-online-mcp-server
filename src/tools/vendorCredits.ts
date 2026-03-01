import type { FastMCP } from "fastmcp";
import {
  createVendorCreditSchema,
  getVendorCreditSchema,
  updateVendorCreditSchema,
  deleteVendorCreditSchema,
  searchVendorCreditsSchema,
} from "../schemas/vendorCredits";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerVendorCreditTools(server: FastMCP) {
  // ── create_vendor_credit ──
  server.addTool(
    withLogging({
      name: "create_vendor_credit",
      description: "Create a vendor credit in QuickBooks Online.",
      parameters: createVendorCreditSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createVendorCredit(args.vendorCredit, (err: any, entity: any) => {
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

  // ── get_vendor_credit ──
  server.addTool(
    withLogging({
      name: "get_vendor_credit",
      description: "Get a vendor credit by ID from QuickBooks Online.",
      parameters: getVendorCreditSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getVendorCredit(args.id, (err: any, entity: any) => {
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

  // ── update_vendor_credit ──
  server.addTool(
    withLogging({
      name: "update_vendor_credit",
      description: "Update an existing vendor credit in QuickBooks Online.",
      parameters: updateVendorCreditSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateVendorCredit(args.vendorCredit, (err: any, entity: any) => {
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

  // ── delete_vendor_credit ──
  server.addTool(
    withLogging({
      name: "delete_vendor_credit",
      description: "Delete a vendor credit from QuickBooks Online.",
      parameters: deleteVendorCreditSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteVendorCredit(args.idOrEntity, (err: any, entity: any) => {
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

  // ── search_vendor_credits ──
  server.addTool(
    withLogging({
      name: "search_vendor_credits",
      description: "Search vendor credits in QuickBooks Online that match given criteria.",
      parameters: searchVendorCreditsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findVendorCredits(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.VendorCredit ??
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
