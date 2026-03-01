import type { FastMCP } from "fastmcp";
import {
  createBillPaymentSchema,
  getBillPaymentSchema,
  updateBillPaymentSchema,
  deleteBillPaymentSchema,
  searchBillPaymentsSchema,
} from "../schemas/billPayments";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerBillPaymentTools(server: FastMCP) {
  // ── create_bill_payment ──────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_bill_payment",
      description: "Create a bill payment in QuickBooks Online.",
      parameters: createBillPaymentSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.createBillPayment(args.billPayment, (err: any, payment: any) => {
              if (err) reject(err);
              else resolve(payment);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_bill_payment ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_bill_payment",
      description: "Get a bill payment by ID from QuickBooks Online.",
      parameters: getBillPaymentSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.getBillPayment(args.id, (err: any, payment: any) => {
              if (err) reject(err);
              else resolve(payment);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_bill_payment ──────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_bill_payment",
      description: "Update an existing bill payment in QuickBooks Online.",
      parameters: updateBillPaymentSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.updateBillPayment(args.billPayment, (err: any, payment: any) => {
              if (err) reject(err);
              else resolve(payment);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_bill_payment ──────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_bill_payment",
      description: "Delete a bill payment from QuickBooks Online.",
      parameters: deleteBillPaymentSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            qbo.deleteBillPayment(args.idOrEntity, (err: any, payment: any) => {
              if (err) reject(err);
              else resolve(payment);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_bill_payments ─────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_bill_payments",
      description: "Search bill payments in QuickBooks Online that match given criteria.",
      parameters: searchBillPaymentsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findBillPayments(searchCriteria, (err: any, payments: any) => {
              if (err) reject(err);
              else resolve(
                payments?.QueryResponse?.BillPayment ??
                payments?.QueryResponse?.totalCount ??
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
