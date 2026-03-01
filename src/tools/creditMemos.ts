import type { FastMCP } from "fastmcp";
import {
  createCreditMemoSchema,
  getCreditMemoSchema,
  updateCreditMemoSchema,
  deleteCreditMemoSchema,
  searchCreditMemosSchema,
} from "../schemas/creditMemos";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerCreditMemoTools(server: FastMCP) {
  // ── create_credit_memo ──
  server.addTool(
    withLogging({
      name: "create_credit_memo",
      description: "Create a credit memo in QuickBooks Online.",
      parameters: createCreditMemoSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createCreditMemo(args.creditMemo, (err: any, entity: any) => {
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

  // ── get_credit_memo ──
  server.addTool(
    withLogging({
      name: "get_credit_memo",
      description: "Get a credit memo by ID from QuickBooks Online.",
      parameters: getCreditMemoSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getCreditMemo(args.id, (err: any, entity: any) => {
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

  // ── update_credit_memo ──
  server.addTool(
    withLogging({
      name: "update_credit_memo",
      description: "Update an existing credit memo in QuickBooks Online.",
      parameters: updateCreditMemoSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateCreditMemo(args.creditMemo, (err: any, entity: any) => {
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

  // ── delete_credit_memo ──
  server.addTool(
    withLogging({
      name: "delete_credit_memo",
      description: "Delete a credit memo from QuickBooks Online.",
      parameters: deleteCreditMemoSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteCreditMemo(args.idOrEntity, (err: any, entity: any) => {
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

  // ── search_credit_memos ──
  server.addTool(
    withLogging({
      name: "search_credit_memos",
      description: "Search credit memos in QuickBooks Online that match given criteria.",
      parameters: searchCreditMemosSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findCreditMemos(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.CreditMemo ??
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
