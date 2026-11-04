import { registerTool } from "../utils/registerTool";
import type { FastMCP } from "fastmcp";
import {
  createEstimateSchema,
  getEstimateSchema,
  updateEstimateSchema,
  deleteEstimateSchema,
  searchEstimatesSchema,
} from "../schemas/estimates";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerEstimateTools(server: FastMCP) {
  // ── create_estimate ──────────────────────────────────────────────────
  registerTool(server, {
    name: "create_estimate",
    description: "Create an estimate in QuickBooks Online.",
    parameters: createEstimateSchema,
    execute: executeQbo("create_estimate", (qbo, args) =>
      qboRequest(cb => qbo.createEstimate(args.estimate, cb))
    ),
  });

  // ── get_estimate ─────────────────────────────────────────────────────
  registerTool(server, {
    name: "get_estimate",
    description: "Get an estimate by ID from QuickBooks Online.",
    parameters: getEstimateSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_estimate", (qbo, args) =>
      qboRequest(cb => qbo.getEstimate(args.id, cb))
    ),
  });

  // ── update_estimate ──────────────────────────────────────────────────
  registerTool(server, {
    name: "update_estimate",
    description: "Update an existing estimate in QuickBooks Online.",
    parameters: updateEstimateSchema,
    execute: executeQbo("update_estimate", (qbo, args) =>
      qboRequest(cb => qbo.updateEstimate(args.estimate, cb))
    ),
  });

  // ── delete_estimate ──────────────────────────────────────────────────
  registerTool(server, {
    name: "delete_estimate",
    description: "Delete an estimate from QuickBooks Online.",
    parameters: deleteEstimateSchema,
    execute: executeQbo("delete_estimate", (qbo, args) =>
      qboRequest(cb => qbo.deleteEstimate(args.idOrEntity, cb))
    ),
  });

  // ── search_estimates ─────────────────────────────────────────────────
  registerTool(server, {
    name: "search_estimates",
    description: "Search estimates in QuickBooks Online that match given criteria.",
    parameters: searchEstimatesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_estimates", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findEstimates(searchCriteria, cb));
      return response?.QueryResponse?.Estimate ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
