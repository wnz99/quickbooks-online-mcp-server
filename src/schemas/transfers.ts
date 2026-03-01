import { z } from "zod";
import { paginationSchema } from "./shared";

export const createTransferSchema = z.object({
  transfer: z.record(z.string(), z.unknown()).describe("Transfer data object to create"),
});

export const updateTransferSchema = z.object({
  transfer: z.record(z.string(), z.unknown()).describe("Transfer data with Id and SyncToken for update"),
});

export const deleteTransferSchema = z.object({
  idOrEntity: z.any().describe("Transfer ID or full entity to delete"),
});

export const searchTransfersSchema = paginationSchema.describe("Search transfers with optional filters, pagination, and sorting");
