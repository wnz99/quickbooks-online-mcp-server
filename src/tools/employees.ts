import type { FastMCP } from "fastmcp";
import {
  createEmployeeSchema,
  getEmployeeSchema,
  updateEmployeeSchema,
  searchEmployeesSchema,
} from "../schemas/employees";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerEmployeeTools(server: FastMCP) {
  // ── create_employee ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_employee",
      description: "Create an employee in QuickBooks Online.",
      parameters: createEmployeeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createEmployee(args.employee, (err: any, employee: any) => {
              if (err) reject(err);
              else resolve(employee);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_employee ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_employee",
      description: "Get an employee by ID from QuickBooks Online.",
      parameters: getEmployeeSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getEmployee(args.id, (err: any, employee: any) => {
              if (err) reject(err);
              else resolve(employee);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_employee ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_employee",
      description: "Update an existing employee in QuickBooks Online.",
      parameters: updateEmployeeSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateEmployee(args.employee, (err: any, employee: any) => {
              if (err) reject(err);
              else resolve(employee);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_employees ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_employees",
      description: "Search employees in QuickBooks Online that match given criteria.",
      parameters: searchEmployeesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findEmployees(searchCriteria, (err: any, employees: any) => {
              if (err) reject(err);
              else resolve(
                employees?.QueryResponse?.Employee ??
                employees?.QueryResponse?.totalCount ??
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
