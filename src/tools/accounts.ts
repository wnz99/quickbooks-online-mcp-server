import type { FastMCP } from "fastmcp";
import {
  getAccountSchema,
  createAccountSchema,
  updateAccountSchema,
  searchAccountsSchema,
} from "../schemas/accounts";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

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

function normalizeAccountPayload(payload: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
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
  // ── get_account ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_account",
      description: "Get an account by ID from QuickBooks Online.",
      parameters: getAccountSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getAccount(args.id, (err: any, account: any) => {
              if (err) reject(err);
              else resolve(account);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── create_account ───────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_account",
      description: "Create an account in QuickBooks Online chart of accounts.",
      parameters: createAccountSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const basePayload: any = {
            Name: args.name,
            AccountType: args.type,
            AccountSubType: args.sub_type,
            Description: args.description,
          };

          const payload = normalizeAccountPayload(basePayload);

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createAccount(payload, (err: any, account: any) => {
              if (err) reject(err);
              else resolve(account);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_account ───────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_account",
      description: "Update an existing account in QuickBooks Online.",
      parameters: updateAccountSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          // Fetch existing account for SyncToken
          const existing: any = await new Promise((res, rej) => {
            (qbo as any).getAccount(args.account_id, (e: any, acc: any) => (e ? rej(e) : res(acc)));
          });

          const normalizedPatch = normalizeAccountPayload(args.patch);
          const payload = { ...existing, ...normalizedPatch, Id: args.account_id, sparse: true };

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateAccount(payload, (err: any, account: any) => {
              if (err) reject(err);
              else resolve(account);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_accounts ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_accounts",
      description: "Search accounts in QuickBooks Online chart of accounts.",
      parameters: searchAccountsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findAccounts(searchCriteria, (err: any, accounts: any) => {
              if (err) reject(err);
              else resolve(
                accounts?.QueryResponse?.Account ??
                accounts?.QueryResponse?.totalCount ??
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
