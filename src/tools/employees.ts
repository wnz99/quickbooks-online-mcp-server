import type { FastMCP } from "fastmcp";
import {
  createEmployeeSchema,
  getEmployeeSchema,
  updateEmployeeSchema,
  searchEmployeesSchema,
} from "../schemas/employees";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerEmployeeTools(server: FastMCP) {
  // ── create_employee ──────────────────────────────────────────────────
  server.addTool({
    name: "create_employee",
    description: "Create an employee in QuickBooks Online.",
    parameters: createEmployeeSchema,
    execute: executeQbo("create_employee", (qbo, args) =>
      qboRequest(cb => qbo.createEmployee(args.employee, cb))
    ),
  });

  // ── get_employee ─────────────────────────────────────────────────────
  server.addTool({
    name: "get_employee",
    description: "Get an employee by ID from QuickBooks Online.",
    parameters: getEmployeeSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_employee", (qbo, args) =>
      qboRequest(cb => qbo.getEmployee(args.id, cb))
    ),
  });

  // ── update_employee ──────────────────────────────────────────────────
  server.addTool({
    name: "update_employee",
    description: "Update an existing employee in QuickBooks Online.",
    parameters: updateEmployeeSchema,
    execute: executeQbo("update_employee", (qbo, args) =>
      qboRequest(cb => qbo.updateEmployee(args.employee, cb))
    ),
  });

  // ── search_employees ─────────────────────────────────────────────────
  server.addTool({
    name: "search_employees",
    description: "Search employees in QuickBooks Online that match given criteria.",
    parameters: searchEmployeesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_employees", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findEmployees(searchCriteria, cb));
      return response?.QueryResponse?.Employee ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
