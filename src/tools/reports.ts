import { registerTool } from "../utils/registerTool";
import type { FastMCP } from "fastmcp";
import { reportSchema } from "../schemas/reports";
import { qboRequest } from "../utils/qboRequest";
import { executeQbo } from "../utils/executeQbo";

export function registerReportTools(server: FastMCP) {
  registerTool(server, {
    name: "get_report",
    description: "Run a report in QuickBooks Online (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger).",
    parameters: reportSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_report", async (qbo, args) => {
      const methodName = `report${args.reportType === "GeneralLedger" ? "GeneralLedgerDetail" : args.reportType}` as `report${string}`;
      if (typeof qbo[methodName] !== "function") {
        throw new Error(
          `Unknown report type: ${args.reportType}. Try: BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger, AgedReceivables, AgedPayables, etc.`
        );
      }
      const params = { ...args.params };
      if (args.reportType === "BalanceSheet") delete params.start_date;
      return qboRequest(cb => qbo[methodName](params, cb));
    }),
  });
}
