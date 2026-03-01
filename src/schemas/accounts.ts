import { z } from "zod";

export const getAccountSchema = z.object({
  id: z.string().min(1).describe("QuickBooks account ID"),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).describe("Account name"),
  type: z.string().min(1).describe("Account type (e.g., Expense, Income, Bank)"),
  sub_type: z.string().optional().describe("Account sub-type"),
  description: z.string().optional().describe("Account description"),
});

export const updateAccountSchema = z.object({
  account_id: z.string().min(1).describe("QuickBooks account ID"),
  patch: z.record(z.any()).describe("Fields to update on the account"),
});

export const searchAccountsSchema = z.object({
  criteria: z.any().describe("Search criteria for accounts"),
}).describe("Search accounts");
