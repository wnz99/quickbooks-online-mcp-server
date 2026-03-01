import type { FastMCP } from "fastmcp";
import { reportSchema } from "../schemas/reports";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";

export function registerReportTools(server: FastMCP) {
  server.addTool(
    withLogging({
      name: "get_report",
      description: "Run a report in QuickBooks Online (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger).",
      parameters: reportSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const methodName = `report${args.reportType}`;
          if (typeof (qbo as any)[methodName] !== "function") {
            return JSON.stringify({
              success: false,
              error: `Unknown report type: ${args.reportType}. Try: BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger, AgedReceivables, AgedPayables, etc.`,
            });
          }

          const result = await new Promise((resolve, reject) => {
            (qbo as any)[methodName](args.params || {}, (err: any, report: any) => {
              if (err) reject(err);
              else resolve(report);
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
