import { registerTool } from "../utils/registerTool";
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
import { createQuickbooksAttachable } from "../operations/createAttachable";
import { unwrap } from "../operations/result";
import { inferContentType } from "../utils/attachableFileSource";
import path from "path";

export function registerAttachableTools(server: FastMCP) {
  // ── create_attachable ──
  registerTool(server, {
    name: "create_attachable",
    description: "Create a attachable in QuickBooks Online.",
    parameters: createAttachableSchema,
    execute: executeQbo("create_attachable", async (qbo, args) => {
      const hasUpload = Boolean(args.file_path || args.file_url || args.base64_content);
      if (args.attachable) {
        if (hasUpload || args.file_name) throw new Error("Use either attachable metadata or upload fields, not both");
        return qboRequest(cb => qbo.createAttachable(args.attachable!, cb));
      }
      if (!args.file_name) throw new Error("file_name is required when attachable is omitted");
      return unwrap(await createQuickbooksAttachable({ ...args, file_name: args.file_name }));
    }),
  });

  // ── get_attachable ──
  registerTool(server, {
    name: "get_attachable",
    description: "Get a attachable by ID from QuickBooks Online.",
    parameters: getAttachableSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_attachable", (qbo, args) =>
      qboRequest(cb => qbo.getAttachable(args.id, cb))
    ),
  });

  // ── update_attachable ──
  registerTool(server, {
    name: "update_attachable",
    description: "Update an existing attachable in QuickBooks Online.",
    parameters: updateAttachableSchema,
    execute: executeQbo("update_attachable", (qbo, args) => {
      const metadata = { ...args.attachable };
      if (args.file_path) {
        metadata.FileName ??= path.basename(args.file_path);
        metadata.ContentType ??= inferContentType(args.file_path) ?? undefined;
      }
      return qboRequest(cb => qbo.updateAttachable(metadata, cb));
    }),
  });

  // ── delete_attachable ──
  registerTool(server, {
    name: "delete_attachable",
    description: "Delete a attachable from QuickBooks Online.",
    parameters: deleteAttachableSchema,
    execute: executeQbo("delete_attachable", (qbo, args) =>
      qboRequest(cb => qbo.deleteAttachable(args.idOrEntity, cb))
    ),
  });

  // ── search_attachables ──
  registerTool(server, {
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
