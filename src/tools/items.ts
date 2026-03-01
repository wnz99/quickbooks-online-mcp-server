import type { FastMCP } from "fastmcp";
import {
  createItemSchema,
  getItemSchema,
  updateItemSchema,
  searchItemsSchema,
} from "../schemas/items";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerItemTools(server: FastMCP) {
  // ── create_item ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_item",
      description: "Create an item (product or service) in QuickBooks Online.",
      parameters: createItemSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const payload: any = {
            Name: args.name,
            Type: args.type,
            IncomeAccountRef: { value: args.income_account_ref },
            ...(args.expense_account_ref && { ExpenseAccountRef: { value: args.expense_account_ref } }),
            ...(args.unit_price !== undefined && { UnitPrice: args.unit_price }),
            ...(args.description && { Description: args.description }),
          };

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createItem(payload, (err: any, item: any) => {
              if (err) reject(err);
              else resolve(item);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_item ─────────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_item",
      description: "Get an item by ID from QuickBooks Online.",
      parameters: getItemSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getItem(args.item_id, (err: any, item: any) => {
              if (err) reject(err);
              else resolve(item);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_item ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_item",
      description: "Update an existing item in QuickBooks Online.",
      parameters: updateItemSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          // Fetch existing item for SyncToken
          const existing: any = await new Promise((res, rej) => {
            (qbo as any).getItem(args.item_id, (e: any, item: any) => (e ? rej(e) : res(item)));
          });

          const payload = { ...existing, ...args.patch, Id: args.item_id, sparse: true };

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateItem(payload, (err: any, item: any) => {
              if (err) reject(err);
              else resolve(item);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_items ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_items",
      description: "Search items in QuickBooks Online that match given criteria.",
      parameters: searchItemsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findItems(searchCriteria, (err: any, items: any) => {
              if (err) reject(err);
              else resolve(
                items?.QueryResponse?.Item ??
                items?.QueryResponse?.totalCount ??
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
