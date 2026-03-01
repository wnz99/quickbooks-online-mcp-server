import type { FastMCP } from "fastmcp";
import {
  createJournalEntrySchema,
  getJournalEntrySchema,
  updateJournalEntrySchema,
  deleteJournalEntrySchema,
  searchJournalEntriesSchema,
} from "../schemas/journalEntries";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerJournalEntryTools(server: FastMCP) {
  // ── create_journal_entry ─────────────────────────────────────────────
  server.addTool({
    name: "create_journal_entry",
    description: "Create a journal entry in QuickBooks Online.",
    parameters: createJournalEntrySchema,
    execute: executeQbo("create_journal_entry", (qbo, args) =>
      qboRequest(cb => qbo.createJournalEntry(args.journalEntry, cb))
    ),
  });

  // ── get_journal_entry ────────────────────────────────────────────────
  server.addTool({
    name: "get_journal_entry",
    description: "Get a journal entry by ID from QuickBooks Online.",
    parameters: getJournalEntrySchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_journal_entry", (qbo, args) =>
      qboRequest(cb => qbo.getJournalEntry(args.id, cb))
    ),
  });

  // ── update_journal_entry ─────────────────────────────────────────────
  server.addTool({
    name: "update_journal_entry",
    description: "Update an existing journal entry in QuickBooks Online.",
    parameters: updateJournalEntrySchema,
    execute: executeQbo("update_journal_entry", (qbo, args) =>
      qboRequest(cb => qbo.updateJournalEntry(args.journalEntry, cb))
    ),
  });

  // ── delete_journal_entry ─────────────────────────────────────────────
  server.addTool({
    name: "delete_journal_entry",
    description: "Delete a journal entry from QuickBooks Online.",
    parameters: deleteJournalEntrySchema,
    execute: executeQbo("delete_journal_entry", (qbo, args) =>
      qboRequest(cb => qbo.deleteJournalEntry(args.idOrEntity, cb))
    ),
  });

  // ── search_journal_entries ───────────────────────────────────────────
  server.addTool({
    name: "search_journal_entries",
    description: "Search journal entries in QuickBooks Online that match given criteria.",
    parameters: searchJournalEntriesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_journal_entries", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findJournalEntries(searchCriteria, cb));
      return response?.QueryResponse?.JournalEntry ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
