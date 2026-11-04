import { z } from "zod";
import { paginationSchema } from "./shared";

export const createJournalEntrySchema = z.object({
  journalEntry: z.object({
    TxnDate: z.string().optional().describe("Transaction date in YYYY-MM-DD format; QBO defaults to today"),
    PrivateNote: z.string().optional().describe("Private memo for the journal entry"),
    DocNumber: z.string().optional().describe("Journal number"),
    Line: z.array(z.object({
      Amount: z.number(),
      DetailType: z.literal("JournalEntryLineDetail"),
      Description: z.string().optional().describe("Line description (must be at Line level, NOT inside JournalEntryLineDetail)"),
      JournalEntryLineDetail: z.object({
        PostingType: z.enum(["Debit", "Credit"]),
        AccountRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough(),
        ClassRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough().optional(),
        DepartmentRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough().optional(),
      }).passthrough(),
    }).passthrough()),
  }).passthrough(),
});

export const getJournalEntrySchema = z.object({
  id: z.string().describe("QuickBooks journal entry ID"),
});

export const updateJournalEntrySchema = z.object({
  journalEntry: z.object({
    Id: z.string().describe("The journal entry ID to update"),
    SyncToken: z.string().describe("Current SyncToken (required for concurrency control)"),
    sparse: z.boolean().optional().describe("If true, only update provided fields"),
    TxnDate: z.string().optional().describe("Transaction date in YYYY-MM-DD format"),
    PrivateNote: z.string().optional().describe("Private memo"),
    DocNumber: z.string().optional().describe("Journal number"),
    Line: z.array(z.object({
      Id: z.string().optional(),
      Amount: z.number(),
      DetailType: z.literal("JournalEntryLineDetail"),
      Description: z.string().optional().describe("Line description (must be at Line level, NOT inside JournalEntryLineDetail)"),
      JournalEntryLineDetail: z.object({
        PostingType: z.enum(["Debit", "Credit"]),
        AccountRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough(),
        ClassRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough().optional(),
        DepartmentRef: z.object({
          value: z.string(),
          name: z.string().optional(),
        }).passthrough().optional(),
      }).passthrough(),
    }).passthrough()).optional(),
  }).passthrough(),
});

export const deleteJournalEntrySchema = z.object({
  idOrEntity: z.any().describe("Journal entry ID or full entity to delete"),
});

export const searchJournalEntriesSchema = paginationSchema.describe("Search journal entries with optional filters, pagination, and sorting");
