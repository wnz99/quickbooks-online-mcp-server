import { registerTool } from "../utils/registerTool";
import type { FastMCP } from "fastmcp";
import { reportSchema } from "../schemas/reports";
import { executeQbo } from "../utils/executeQbo";
import { quickbooksClient } from '../clients/quickbooksClient';

export function registerReportTools(server: FastMCP) {
  registerTool(server, {
    name: "get_report",
    description: "Run a report in QuickBooks Online (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger).",
    parameters: reportSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_report", (_qbo, args) => {
      const params = { ...args.params };
      if (args.reportType === "BalanceSheet") delete params.start_date;
      return quickbooksClient.getReport(args.reportType, params);
    }),
  });
}
