import type { FastMCP } from "fastmcp";
import {
  createItemSchema,
  getItemSchema,
  updateItemSchema,
  searchItemsSchema,
} from "../schemas/items";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerItemTools(server: FastMCP) {
  server.addTool({
    name: "create_item",
    description: "Create an item (product or service) in QuickBooks Online.",
    parameters: createItemSchema,
    execute: executeQbo("create_item", (qbo, args) => {
      const payload = {
        Name: args.name,
        Type: args.type,
        IncomeAccountRef: { value: args.income_account_ref },
        ...(args.expense_account_ref && { ExpenseAccountRef: { value: args.expense_account_ref } }),
        ...(args.unit_price !== undefined && { UnitPrice: args.unit_price }),
        ...(args.description && { Description: args.description }),
      };
      return qboRequest(cb => qbo.createItem(payload, cb));
    }),
  });

  server.addTool({
    name: "get_item",
    description: "Get an item by ID from QuickBooks Online.",
    parameters: getItemSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_item", (qbo, args) =>
      qboRequest(cb => qbo.getItem(args.item_id, cb))
    ),
  });

  server.addTool({
    name: "update_item",
    description: "Update an existing item in QuickBooks Online.",
    parameters: updateItemSchema,
    execute: executeQbo("update_item", async (qbo, args) => {
      const existing = await qboRequest<Record<string, unknown>>(cb => qbo.getItem(args.item_id, cb));
      const payload = { ...existing, ...args.patch, Id: args.item_id, sparse: true };
      return qboRequest(cb => qbo.updateItem(payload, cb));
    }),
  });

  server.addTool({
    name: "search_items",
    description: "Search items in QuickBooks Online that match given criteria.",
    parameters: searchItemsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_items", async (qbo, args) => {
      const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findItems(searchCriteria, cb));
      return response?.QueryResponse?.Item ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
