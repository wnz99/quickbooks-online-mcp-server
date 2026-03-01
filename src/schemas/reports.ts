import { z } from "zod";

export const reportSchema = z.object({
  reportType: z.string().describe("Report type (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, GeneralLedger, etc.)"),
  params: z.record(z.string(), z.unknown()).optional().describe("Optional report parameters (date_macro, start_date, end_date, accounting_method, etc.)"),
});
