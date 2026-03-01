import type { FastMCP } from "fastmcp";
import {
  createDepartmentSchema,
  getDepartmentSchema,
  updateDepartmentSchema,
  searchDepartmentsSchema,
} from "../schemas/departments";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerDepartmentTools(server: FastMCP) {
  // ── create_department ──
  server.addTool({
    name: "create_department",
    description: "Create a department in QuickBooks Online.",
    parameters: createDepartmentSchema,
    execute: executeQbo("create_department", (qbo, args) =>
      qboRequest(cb => qbo.createDepartment(args.department, cb))
    ),
  });

  // ── get_department ──
  server.addTool({
    name: "get_department",
    description: "Get a department by ID from QuickBooks Online.",
    parameters: getDepartmentSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_department", (qbo, args) =>
      qboRequest(cb => qbo.getDepartment(args.id, cb))
    ),
  });

  // ── update_department ──
  server.addTool({
    name: "update_department",
    description: "Update an existing department in QuickBooks Online.",
    parameters: updateDepartmentSchema,
    execute: executeQbo("update_department", (qbo, args) =>
      qboRequest(cb => qbo.updateDepartment(args.department, cb))
    ),
  });

  // ── search_departments ──
  server.addTool({
    name: "search_departments",
    description: "Search departments in QuickBooks Online that match given criteria.",
    parameters: searchDepartmentsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_departments", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findDepartments(searchCriteria, cb));
      return response?.QueryResponse?.Department ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
