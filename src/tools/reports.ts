import type { FastMCP } from "fastmcp";
import { reportSchema } from "../schemas/reports";
import { executeQbo } from "../utils/executeQbo";
import { quickbooksClient } from '../clients/quickbooksClient';

export function registerReportTools(server: FastMCP) {
  server.addTool({
    name: "get_report",
    description: "Run a report in QuickBooks Online (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger).",
    parameters: reportSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_report", (_qbo, args) =>
      quickbooksClient.getReport(args.reportType, args.params)
    ),
  });
}
