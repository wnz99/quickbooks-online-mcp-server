import type { FastMCP } from "fastmcp";
import {
  createJournalEntrySchema,
  getJournalEntrySchema,
  updateJournalEntrySchema,
  deleteJournalEntrySchema,
  searchJournalEntriesSchema,
} from "../schemas/journalEntries";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerJournalEntryTools(server: FastMCP) {
  // ── create_journal_entry ─────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_journal_entry",
      description: "Create a journal entry in QuickBooks Online.",
      parameters: createJournalEntrySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.createJournalEntry(args.journalEntry, (err: any, entry: any) => {
              if (err) reject(err);
              else resolve(entry);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_journal_entry ────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_journal_entry",
      description: "Get a journal entry by ID from QuickBooks Online.",
      parameters: getJournalEntrySchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.getJournalEntry(args.id, (err: any, entry: any) => {
              if (err) reject(err);
              else resolve(entry);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_journal_entry ─────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_journal_entry",
      description: "Update an existing journal entry in QuickBooks Online.",
      parameters: updateJournalEntrySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.updateJournalEntry(args.journalEntry, (err: any, entry: any) => {
              if (err) reject(err);
              else resolve(entry);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_journal_entry ─────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_journal_entry",
      description: "Delete a journal entry from QuickBooks Online.",
      parameters: deleteJournalEntrySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.deleteJournalEntry(args.idOrEntity, (err: any, entry: any) => {
              if (err) reject(err);
              else resolve(entry);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_journal_entries ───────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_journal_entries",
      description: "Search journal entries in QuickBooks Online that match given criteria.",
      parameters: searchJournalEntriesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findJournalEntries(searchCriteria, (err: any, entries: any) => {
              if (err) reject(err);
              else resolve(
                entries?.QueryResponse?.JournalEntry ??
                entries?.QueryResponse?.totalCount ??
                []
              );
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );
}
