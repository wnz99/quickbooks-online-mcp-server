import type { FastMCP } from "fastmcp";
import {
  createDepositSchema,
  getDepositSchema,
  updateDepositSchema,
  deleteDepositSchema,
  searchDepositsSchema,
} from "../schemas/deposits";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerDepositTools(server: FastMCP) {
  // ── create_deposit ──
  server.addTool({
    name: "create_deposit",
    description: "Create a deposit in QuickBooks Online.",
    parameters: createDepositSchema,
    execute: executeQbo("create_deposit", (qbo, args) =>
      qboRequest(cb => qbo.createDeposit(args.deposit, cb))
    ),
  });

  // ── get_deposit ──
  server.addTool({
    name: "get_deposit",
    description: "Get a deposit by ID from QuickBooks Online.",
    parameters: getDepositSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_deposit", (qbo, args) =>
      qboRequest(cb => qbo.getDeposit(args.id, cb))
    ),
  });

  // ── update_deposit ──
  server.addTool({
    name: "update_deposit",
    description: "Update an existing deposit in QuickBooks Online.",
    parameters: updateDepositSchema,
    execute: executeQbo("update_deposit", (qbo, args) =>
      qboRequest(cb => qbo.updateDeposit(args.deposit, cb))
    ),
  });

  // ── delete_deposit ──
  server.addTool({
    name: "delete_deposit",
    description: "Delete a deposit from QuickBooks Online.",
    parameters: deleteDepositSchema,
    execute: executeQbo("delete_deposit", (qbo, args) =>
      qboRequest(cb => qbo.deleteDeposit(args.idOrEntity, cb))
    ),
  });

  // ── search_deposits ──
  server.addTool({
    name: "search_deposits",
    description: "Search deposits in QuickBooks Online that match given criteria.",
    parameters: searchDepositsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_deposits", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findDeposits(searchCriteria, cb));
      return response?.QueryResponse?.Deposit ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
