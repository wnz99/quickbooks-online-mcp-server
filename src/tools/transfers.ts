import type { FastMCP } from "fastmcp";
import {
  createTransferSchema,
  updateTransferSchema,
  deleteTransferSchema,
  searchTransfersSchema,
} from "../schemas/transfers";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTransferTools(server: FastMCP) {
  // ── create_transfer ──
  server.addTool({
    name: "create_transfer",
    description: "Create a transfer in QuickBooks Online.",
    parameters: createTransferSchema,
    execute: executeQbo("create_transfer", (qbo, args) =>
      qboRequest(cb => qbo.createTransfer(args.transfer, cb))
    ),
  });

  // ── update_transfer ──
  server.addTool({
    name: "update_transfer",
    description: "Update an existing transfer in QuickBooks Online.",
    parameters: updateTransferSchema,
    execute: executeQbo("update_transfer", (qbo, args) =>
      qboRequest(cb => qbo.updateTransfer(args.transfer, cb))
    ),
  });

  // ── delete_transfer ──
  server.addTool({
    name: "delete_transfer",
    description: "Delete a transfer from QuickBooks Online.",
    parameters: deleteTransferSchema,
    execute: executeQbo("delete_transfer", (qbo, args) =>
      qboRequest(cb => qbo.deleteTransfer(args.idOrEntity, cb))
    ),
  });

  // ── search_transfers ──
  server.addTool({
    name: "search_transfers",
    description: "Search transfers in QuickBooks Online that match given criteria.",
    parameters: searchTransfersSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_transfers", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTransfers(searchCriteria, cb));
      return response?.QueryResponse?.Transfer ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
