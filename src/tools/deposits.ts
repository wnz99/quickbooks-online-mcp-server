import { registerTool } from "../utils/registerTool";
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
  registerTool(server, {
    name: "create_deposit",
    description: "Create a deposit in QuickBooks Online.",
    parameters: createDepositSchema,
    execute: executeQbo("create_deposit", (qbo, args) =>
      qboRequest(cb => qbo.createDeposit(args.deposit, cb))
    ),
  });

  // ── get_deposit ──
  registerTool(server, {
    name: "get_deposit",
    description: "Get a deposit by ID from QuickBooks Online.",
    parameters: getDepositSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_deposit", (qbo, args) =>
      qboRequest(cb => qbo.getDeposit(args.id, cb))
    ),
  });

  // ── update_deposit ──
  registerTool(server, {
    name: "update_deposit",
    description: "Update an existing deposit in QuickBooks Online.",
    parameters: updateDepositSchema,
    execute: executeQbo("update_deposit", async (qbo, args) => {
      const id = args.deposit.Id;
      if (typeof id !== "string" || !id) throw new Error("deposit.Id is required");
      const current = await qboRequest<Record<string, unknown>>(cb => qbo.getDeposit(id, cb));
      return qboRequest(cb => qbo.updateDeposit({ ...current, ...args.deposit, sparse: false }, cb));
    }),
  });

  // ── delete_deposit ──
  registerTool(server, {
    name: "delete_deposit",
    description: "Delete a deposit from QuickBooks Online.",
    parameters: deleteDepositSchema,
    execute: executeQbo("delete_deposit", (qbo, args) =>
      qboRequest(cb => qbo.deleteDeposit(args.idOrEntity, cb))
    ),
  });

  // ── search_deposits ──
  registerTool(server, {
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
