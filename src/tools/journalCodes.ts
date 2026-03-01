import type { FastMCP } from "fastmcp";
import {
  createJournalCodeSchema,
  getJournalCodeSchema,
  updateJournalCodeSchema,
  deleteJournalCodeSchema,
  searchJournalCodesSchema,
} from "../schemas/journalCodes";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerJournalCodeTools(server: FastMCP) {
  // ── create_journal_code ──
  server.addTool({
    name: "create_journal_code",
    description: "Create a journal code in QuickBooks Online.",
    parameters: createJournalCodeSchema,
    execute: executeQbo("create_journal_code", (qbo, args) =>
      qboRequest(cb => qbo.createJournalCode(args.journalCode, cb))
    ),
  });

  // ── get_journal_code ──
  server.addTool({
    name: "get_journal_code",
    description: "Get a journal code by ID from QuickBooks Online.",
    parameters: getJournalCodeSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_journal_code", (qbo, args) =>
      qboRequest(cb => qbo.getJournalCode(args.id, cb))
    ),
  });

  // ── update_journal_code ──
  server.addTool({
    name: "update_journal_code",
    description: "Update an existing journal code in QuickBooks Online.",
    parameters: updateJournalCodeSchema,
    execute: executeQbo("update_journal_code", (qbo, args) =>
      qboRequest(cb => qbo.updateJournalCode(args.journalCode, cb))
    ),
  });

  // ── delete_journal_code ──
  server.addTool({
    name: "delete_journal_code",
    description: "Delete a journal code from QuickBooks Online.",
    parameters: deleteJournalCodeSchema,
    execute: executeQbo("delete_journal_code", (qbo, args) =>
      qboRequest(cb => qbo.deleteJournalCode(args.idOrEntity, cb))
    ),
  });

  // ── search_journal_codes ──
  server.addTool({
    name: "search_journal_codes",
    description: "Search journal codes in QuickBooks Online that match given criteria.",
    parameters: searchJournalCodesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_journal_codes", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findJournalCodes(searchCriteria, cb));
      return response?.QueryResponse?.JournalCode ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
