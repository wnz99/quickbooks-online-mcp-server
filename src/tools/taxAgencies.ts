import type { FastMCP } from "fastmcp";
import {
  createTaxAgencySchema,
  getTaxAgencySchema,
  updateTaxAgencySchema,
  searchTaxAgenciesSchema,
} from "../schemas/taxAgencies";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerTaxAgencyTools(server: FastMCP) {
  // ── create_tax_agency ──
  server.addTool(
    withLogging({
      name: "create_tax_agency",
      description: "Create a tax agency in QuickBooks Online.",
      parameters: createTaxAgencySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createTaxAgency(args.taxAgency, (err: any, entity: any) => {
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

  // ── get_tax_agency ──
  server.addTool(
    withLogging({
      name: "get_tax_agency",
      description: "Get a tax agency by ID from QuickBooks Online.",
      parameters: getTaxAgencySchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getTaxAgency(args.id, (err: any, entity: any) => {
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

  // ── update_tax_agency ──
  server.addTool(
    withLogging({
      name: "update_tax_agency",
      description: "Update an existing tax agency in QuickBooks Online.",
      parameters: updateTaxAgencySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateTaxAgency(args.taxAgency, (err: any, entity: any) => {
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

  // ── search_tax_agencies ──
  server.addTool(
    withLogging({
      name: "search_tax_agencies",
      description: "Search tax agencys in QuickBooks Online that match given criteria.",
      parameters: searchTaxAgenciesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findTaxAgencies(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.TaxAgency ??
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
