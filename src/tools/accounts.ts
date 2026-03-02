import type { FastMCP } from "fastmcp";
import {
  getAccountSchema,
  createAccountSchema,
  updateAccountSchema,
  searchAccountsSchema,
} from "../schemas/accounts";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

const accountFieldTypeMap: Record<string, "string" | "boolean" | "number"> = {
  Name: "string",
  AccountType: "string",
  AccountSubType: "string",
  Description: "string",
  Classification: "string",
  Active: "boolean",
  SubAccount: "boolean",
  ParentRef: "string",
  CurrentBalance: "number",
};

function normalizeAccountPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    const expectedType = accountFieldTypeMap[key];
    if (!expectedType) {
      normalized[key] = value;
      continue;
    }
    switch (expectedType) {
      case "string":
        normalized[key] = String(value);
        break;
      case "boolean":
        normalized[key] = typeof value === "boolean" ? value : value === "true";
        break;
      case "number":
        normalized[key] = typeof value === "number" ? value : Number(value);
        break;
    }
  }
  return normalized;
}

export function registerAccountTools(server: FastMCP) {
  server.addTool({
    name: "get_account",
    description: "Get an account by ID from QuickBooks Online.",
    parameters: getAccountSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_account", (qbo, args) =>
      qboRequest(cb => qbo.getAccount(args.id, cb))
    ),
  });

  server.addTool({
    name: "create_account",
    description: "Create an account in QuickBooks Online chart of accounts.",
    parameters: createAccountSchema,
    execute: executeQbo("create_account", (qbo, args) => {
      const basePayload: Record<string, unknown> = {
        Name: args.name,
        AccountType: args.type,
        AccountSubType: args.sub_type,
        Description: args.description,
        CurrencyRef: args.currency_ref,
      };
      const payload = normalizeAccountPayload(basePayload);
      return qboRequest(cb => qbo.createAccount(payload, cb));
    }),
  });

  server.addTool({
    name: "update_account",
    description: "Update an existing account in QuickBooks Online.",
    parameters: updateAccountSchema,
    execute: executeQbo("update_account", async (qbo, args) => {
      const existing = await qboRequest<Record<string, unknown>>(cb => qbo.getAccount(args.account_id, cb));
      const normalizedPatch = normalizeAccountPayload(args.patch);
      const payload = { ...existing, ...normalizedPatch, Id: args.account_id, sparse: true };
      return qboRequest(cb => qbo.updateAccount(payload, cb));
    }),
  });

  server.addTool({
    name: "search_accounts",
    description: "Search accounts in QuickBooks Online chart of accounts.",
    parameters: searchAccountsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_accounts", async (qbo, args) => {
      const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findAccounts(searchCriteria, cb));
      return response?.QueryResponse?.Account ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
