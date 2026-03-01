import type { FastMCP } from "fastmcp";
import {
  createVendorSchema,
  getVendorSchema,
  updateVendorSchema,
  deleteVendorSchema,
  searchVendorsSchema,
} from "../schemas/vendors";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerVendorTools(server: FastMCP) {
  // ── create_vendor ────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_vendor",
      description: "Create a vendor in QuickBooks Online.",
      parameters: createVendorSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.createVendor(args.vendor, (err: any, vendor: any) => {
              if (err) reject(err);
              else resolve(vendor);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_vendor ───────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_vendor",
      description: "Get a vendor by ID from QuickBooks Online.",
      parameters: getVendorSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.getVendor(args.id, (err: any, vendor: any) => {
              if (err) reject(err);
              else resolve(vendor);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_vendor ────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_vendor",
      description: "Update an existing vendor in QuickBooks Online.",
      parameters: updateVendorSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.updateVendor(args.vendor, (err: any, vendor: any) => {
              if (err) reject(err);
              else resolve(vendor);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_vendor ────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_vendor",
      description: "Delete a vendor from QuickBooks Online.",
      parameters: deleteVendorSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.deleteVendor(args.vendor, (err: any, vendor: any) => {
              if (err) reject(err);
              else resolve(vendor);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_vendors ───────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_vendors",
      description: "Search vendors in QuickBooks Online that match given criteria.",
      parameters: searchVendorsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findVendors(searchCriteria, (err: any, vendors: any) => {
              if (err) reject(err);
              else resolve(
                vendors?.QueryResponse?.Vendor ??
                vendors?.QueryResponse?.totalCount ??
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
