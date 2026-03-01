import { z } from "zod";
import { paginationSchema } from "./shared";

export const createDepositSchema = z.object({
  deposit: z.record(z.string(), z.unknown()).describe("Deposit data object to create"),
});

export const getDepositSchema = z.object({
  id: z.string().describe("QuickBooks deposit ID"),
});

export const updateDepositSchema = z.object({
  deposit: z.record(z.string(), z.unknown()).describe("Deposit data with Id and SyncToken for update"),
});

export const deleteDepositSchema = z.object({
  idOrEntity: z.any().describe("Deposit ID or full entity to delete"),
});

export const searchDepositsSchema = paginationSchema.describe("Search deposits with optional filters, pagination, and sorting");
