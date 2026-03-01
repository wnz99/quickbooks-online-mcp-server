import { z } from "zod";
import { paginationSchema } from "./shared";

export const createJournalEntrySchema = z.object({
  journalEntry: z.record(z.string(), z.unknown()).describe("Journal entry data object to create"),
});

export const getJournalEntrySchema = z.object({
  id: z.string().describe("QuickBooks journal entry ID"),
});

export const updateJournalEntrySchema = z.object({
  journalEntry: z.record(z.string(), z.unknown()).describe("Journal entry data with Id and SyncToken for update"),
});

export const deleteJournalEntrySchema = z.object({
  idOrEntity: z.any().describe("Journal entry ID or full entity to delete"),
});

export const searchJournalEntriesSchema = paginationSchema.describe("Search journal entries with optional filters, pagination, and sorting");
