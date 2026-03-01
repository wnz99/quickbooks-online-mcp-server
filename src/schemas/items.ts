import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1).describe("Item name"),
  type: z.string().min(1).describe("Item type (e.g., Inventory, Service, NonInventory)"),
  income_account_ref: z.string().min(1).describe("Income account ID reference"),
  expense_account_ref: z.string().optional().describe("Expense account ID reference"),
  unit_price: z.number().optional().describe("Default unit price"),
  description: z.string().optional().describe("Item description"),
});

export const getItemSchema = z.object({
  item_id: z.string().min(1).describe("QuickBooks item ID"),
});

export const updateItemSchema = z.object({
  item_id: z.string().min(1).describe("QuickBooks item ID"),
  patch: z.record(z.any()).describe("Fields to update on the item"),
});

export const searchItemsSchema = z.object({
  criteria: z.any().describe("Search criteria for items"),
}).describe("Search items");
