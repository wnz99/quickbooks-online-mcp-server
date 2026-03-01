import type { FastMCP } from "fastmcp";
import {
  createEstimateSchema,
  getEstimateSchema,
  updateEstimateSchema,
  deleteEstimateSchema,
  searchEstimatesSchema,
} from "../schemas/estimates";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerEstimateTools(server: FastMCP) {
  // ── create_estimate ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_estimate",
      description: "Create an estimate in QuickBooks Online.",
      parameters: createEstimateSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createEstimate(args.estimate, (err: any, estimate: any) => {
              if (err) reject(err);
              else resolve(estimate);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_estimate ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_estimate",
      description: "Get an estimate by ID from QuickBooks Online.",
      parameters: getEstimateSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getEstimate(args.id, (err: any, estimate: any) => {
              if (err) reject(err);
              else resolve(estimate);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_estimate ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_estimate",
      description: "Update an existing estimate in QuickBooks Online.",
      parameters: updateEstimateSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateEstimate(args.estimate, (err: any, estimate: any) => {
              if (err) reject(err);
              else resolve(estimate);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_estimate ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_estimate",
      description: "Delete an estimate from QuickBooks Online.",
      parameters: deleteEstimateSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteEstimate(args.idOrEntity, (err: any, estimate: any) => {
              if (err) reject(err);
              else resolve(estimate);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_estimates ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_estimates",
      description: "Search estimates in QuickBooks Online that match given criteria.",
      parameters: searchEstimatesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findEstimates(searchCriteria, (err: any, estimates: any) => {
              if (err) reject(err);
              else resolve(
                estimates?.QueryResponse?.Estimate ??
                estimates?.QueryResponse?.totalCount ??
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
