import type { FastMCP } from "fastmcp";
import {
  createBillSchema,
  getBillSchema,
  updateBillSchema,
  deleteBillSchema,
  searchBillsSchema,
} from "../schemas/bills";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerBillTools(server: FastMCP) {
  // ── create_bill ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_bill",
      description: "Create a bill in QuickBooks Online.",
      parameters: createBillSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.createBill(args.bill, (err: any, bill: any) => {
              if (err) reject(err);
              else resolve(bill);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_bill ─────────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_bill",
      description: "Get a bill by ID from QuickBooks Online.",
      parameters: getBillSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.getBill(args.id, (err: any, bill: any) => {
              if (err) reject(err);
              else resolve(bill);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_bill ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_bill",
      description: "Update an existing bill in QuickBooks Online.",
      parameters: updateBillSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.updateBill(args.bill, (err: any, bill: any) => {
              if (err) reject(err);
              else resolve(bill);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_bill ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_bill",
      description: "Delete a bill from QuickBooks Online.",
      parameters: deleteBillSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.deleteBill(args.bill, (err: any, bill: any) => {
              if (err) reject(err);
              else resolve(bill);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_bills ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_bills",
      description: "Search bills in QuickBooks Online that match given criteria.",
      parameters: searchBillsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findBills(searchCriteria, (err: any, bills: any) => {
              if (err) reject(err);
              else resolve(
                bills?.QueryResponse?.Bill ??
                bills?.QueryResponse?.totalCount ??
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
