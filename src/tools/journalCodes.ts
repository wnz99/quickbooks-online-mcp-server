import type { FastMCP } from "fastmcp";
import {
  createJournalCodeSchema,
  getJournalCodeSchema,
  updateJournalCodeSchema,
  deleteJournalCodeSchema,
  searchJournalCodesSchema,
} from "../schemas/journalCodes";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerJournalCodeTools(server: FastMCP) {
  // ── create_journal_code ──
  server.addTool(
    withLogging({
      name: "create_journal_code",
      description: "Create a journal code in QuickBooks Online.",
      parameters: createJournalCodeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createJournalCode(args.journalCode, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_journal_code ──
  server.addTool(
    withLogging({
      name: "get_journal_code",
      description: "Get a journal code by ID from QuickBooks Online.",
      parameters: getJournalCodeSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getJournalCode(args.id, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_journal_code ──
  server.addTool(
    withLogging({
      name: "update_journal_code",
      description: "Update an existing journal code in QuickBooks Online.",
      parameters: updateJournalCodeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateJournalCode(args.journalCode, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_journal_code ──
  server.addTool(
    withLogging({
      name: "delete_journal_code",
      description: "Delete a journal code from QuickBooks Online.",
      parameters: deleteJournalCodeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteJournalCode(args.idOrEntity, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_journal_codes ──
  server.addTool(
    withLogging({
      name: "search_journal_codes",
      description: "Search journal codes in QuickBooks Online that match given criteria.",
      parameters: searchJournalCodesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findJournalCodes(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.JournalCode ??
                data?.QueryResponse?.totalCount ??
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
