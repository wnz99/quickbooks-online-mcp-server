import type { FastMCP } from "fastmcp";
import {
  createTermSchema,
  getTermSchema,
  updateTermSchema,
  searchTermsSchema,
} from "../schemas/terms";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTermTools(server: FastMCP) {
  // ── create_term ──
  server.addTool({
    name: "create_term",
    description: "Create a term in QuickBooks Online.",
    parameters: createTermSchema,
    execute: executeQbo("create_term", (qbo, args) =>
      qboRequest(cb => qbo.createTerm(args.term, cb))
    ),
  });

  // ── get_term ──
  server.addTool({
    name: "get_term",
    description: "Get a term by ID from QuickBooks Online.",
    parameters: getTermSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_term", (qbo, args) =>
      qboRequest(cb => qbo.getTerm(args.id, cb))
    ),
  });

  // ── update_term ──
  server.addTool({
    name: "update_term",
    description: "Update an existing term in QuickBooks Online.",
    parameters: updateTermSchema,
    execute: executeQbo("update_term", (qbo, args) =>
      qboRequest(cb => qbo.updateTerm(args.term, cb))
    ),
  });

  // ── search_terms ──
  server.addTool({
    name: "search_terms",
    description: "Search terms in QuickBooks Online that match given criteria.",
    parameters: searchTermsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_terms", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTerms(searchCriteria, cb));
      return response?.QueryResponse?.Term ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
