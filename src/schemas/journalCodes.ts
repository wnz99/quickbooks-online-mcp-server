import { z } from "zod";
import { paginationSchema } from "./shared";

export const createJournalCodeSchema = z.object({
  journalCode: z.record(z.string(), z.unknown()).describe("JournalCode data object to create"),
});

export const getJournalCodeSchema = z.object({
  id: z.string().describe("QuickBooks journal code ID"),
});

export const updateJournalCodeSchema = z.object({
  journalCode: z.record(z.string(), z.unknown()).describe("JournalCode data with Id and SyncToken for update"),
});

export const deleteJournalCodeSchema = z.object({
  idOrEntity: z.any().describe("JournalCode ID or full entity to delete"),
});

export const searchJournalCodesSchema = paginationSchema.describe("Search journal codes with optional filters, pagination, and sorting");
