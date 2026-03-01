import type { FastMCP } from "fastmcp";
import {
  createAttachableSchema,
  getAttachableSchema,
  updateAttachableSchema,
  deleteAttachableSchema,
  searchAttachablesSchema,
} from "../schemas/attachables";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerAttachableTools(server: FastMCP) {
  // ── create_attachable ──
  server.addTool({
    name: "create_attachable",
    description: "Create a attachable in QuickBooks Online.",
    parameters: createAttachableSchema,
    execute: executeQbo("create_attachable", (qbo, args) =>
      qboRequest(cb => qbo.createAttachable(args.attachable, cb))
    ),
  });

  // ── get_attachable ──
  server.addTool({
    name: "get_attachable",
    description: "Get a attachable by ID from QuickBooks Online.",
    parameters: getAttachableSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_attachable", (qbo, args) =>
      qboRequest(cb => qbo.getAttachable(args.id, cb))
    ),
  });

  // ── update_attachable ──
  server.addTool({
    name: "update_attachable",
    description: "Update an existing attachable in QuickBooks Online.",
    parameters: updateAttachableSchema,
    execute: executeQbo("update_attachable", (qbo, args) =>
      qboRequest(cb => qbo.updateAttachable(args.attachable, cb))
    ),
  });

  // ── delete_attachable ──
  server.addTool({
    name: "delete_attachable",
    description: "Delete a attachable from QuickBooks Online.",
    parameters: deleteAttachableSchema,
    execute: executeQbo("delete_attachable", (qbo, args) =>
      qboRequest(cb => qbo.deleteAttachable(args.idOrEntity, cb))
    ),
  });

  // ── search_attachables ──
  server.addTool({
    name: "search_attachables",
    description: "Search attachables in QuickBooks Online that match given criteria.",
    parameters: searchAttachablesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_attachables", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findAttachables(searchCriteria, cb));
      return response?.QueryResponse?.Attachable ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
