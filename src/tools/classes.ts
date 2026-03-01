import type { FastMCP } from "fastmcp";
import {
  createClassSchema,
  getClassSchema,
  updateClassSchema,
  searchClassesSchema,
} from "../schemas/classes";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerClassTools(server: FastMCP) {
  // ── create_class ──
  server.addTool({
    name: "create_class",
    description: "Create a class in QuickBooks Online.",
    parameters: createClassSchema,
    execute: executeQbo("create_class", (qbo, args) =>
      qboRequest(cb => qbo.createClass(args.classEntity, cb))
    ),
  });

  // ── get_class ──
  server.addTool({
    name: "get_class",
    description: "Get a class by ID from QuickBooks Online.",
    parameters: getClassSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_class", (qbo, args) =>
      qboRequest(cb => qbo.getClass(args.id, cb))
    ),
  });

  // ── update_class ──
  server.addTool({
    name: "update_class",
    description: "Update an existing class in QuickBooks Online.",
    parameters: updateClassSchema,
    execute: executeQbo("update_class", (qbo, args) =>
      qboRequest(cb => qbo.updateClass(args.classEntity, cb))
    ),
  });

  // ── search_classes ──
  server.addTool({
    name: "search_classes",
    description: "Search classs in QuickBooks Online that match given criteria.",
    parameters: searchClassesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_classes", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findClasses(searchCriteria, cb));
      return response?.QueryResponse?.Class ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
