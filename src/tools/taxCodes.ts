import type { FastMCP } from "fastmcp";
import {
  getTaxCodeSchema,
  updateTaxCodeSchema,
  searchTaxCodesSchema,
} from "../schemas/taxCodes";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerTaxCodeTools(server: FastMCP) {
  // ── get_tax_code ──
  server.addTool(
    withLogging({
      name: "get_tax_code",
      description: "Get a tax code by ID from QuickBooks Online.",
      parameters: getTaxCodeSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getTaxCode(args.id, (err: any, entity: any) => {
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

  // ── update_tax_code ──
  server.addTool(
    withLogging({
      name: "update_tax_code",
      description: "Update an existing tax code in QuickBooks Online.",
      parameters: updateTaxCodeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateTaxCode(args.taxCode, (err: any, entity: any) => {
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

  // ── search_tax_codes ──
  server.addTool(
    withLogging({
      name: "search_tax_codes",
      description: "Search tax codes in QuickBooks Online that match given criteria.",
      parameters: searchTaxCodesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findTaxCodes(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.TaxCode ??
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
