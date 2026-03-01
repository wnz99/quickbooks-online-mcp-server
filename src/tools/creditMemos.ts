import type { FastMCP } from "fastmcp";
import {
  createCreditMemoSchema,
  getCreditMemoSchema,
  updateCreditMemoSchema,
  deleteCreditMemoSchema,
  searchCreditMemosSchema,
} from "../schemas/creditMemos";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerCreditMemoTools(server: FastMCP) {
  // ── create_credit_memo ───────────────────────────────────────────────
  server.addTool({
    name: "create_credit_memo",
    description: "Create a credit memo in QuickBooks Online.",
    parameters: createCreditMemoSchema,
    execute: executeQbo("create_credit_memo", (qbo, args) =>
      qboRequest(cb => qbo.createCreditMemo(args.creditMemo, cb))
    ),
  });

  // ── get_credit_memo ──────────────────────────────────────────────────
  server.addTool({
    name: "get_credit_memo",
    description: "Get a credit memo by ID from QuickBooks Online.",
    parameters: getCreditMemoSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_credit_memo", (qbo, args) =>
      qboRequest(cb => qbo.getCreditMemo(args.id, cb))
    ),
  });

  // ── update_credit_memo ───────────────────────────────────────────────
  server.addTool({
    name: "update_credit_memo",
    description: "Update an existing credit memo in QuickBooks Online.",
    parameters: updateCreditMemoSchema,
    execute: executeQbo("update_credit_memo", (qbo, args) =>
      qboRequest(cb => qbo.updateCreditMemo(args.creditMemo, cb))
    ),
  });

  // ── delete_credit_memo ───────────────────────────────────────────────
  server.addTool({
    name: "delete_credit_memo",
    description: "Delete a credit memo from QuickBooks Online.",
    parameters: deleteCreditMemoSchema,
    execute: executeQbo("delete_credit_memo", (qbo, args) =>
      qboRequest(cb => qbo.deleteCreditMemo(args.idOrEntity, cb))
    ),
  });

  // ── search_credit_memos ──────────────────────────────────────────────
  server.addTool({
    name: "search_credit_memos",
    description: "Search credit memos in QuickBooks Online that match given criteria.",
    parameters: searchCreditMemosSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_credit_memos", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findCreditMemos(searchCriteria, cb));
      return response?.QueryResponse?.CreditMemo ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
