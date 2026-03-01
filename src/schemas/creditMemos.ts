import { z } from "zod";
import { paginationSchema } from "./shared";

export const createCreditMemoSchema = z.object({
  creditMemo: z.record(z.string(), z.unknown()).describe("CreditMemo data object to create"),
});

export const getCreditMemoSchema = z.object({
  id: z.string().describe("QuickBooks credit memo ID"),
});

export const updateCreditMemoSchema = z.object({
  creditMemo: z.record(z.string(), z.unknown()).describe("CreditMemo data with Id and SyncToken for update"),
});

export const deleteCreditMemoSchema = z.object({
  idOrEntity: z.any().describe("CreditMemo ID or full entity to delete"),
});

export const searchCreditMemosSchema = paginationSchema.describe("Search credit memos with optional filters, pagination, and sorting");
