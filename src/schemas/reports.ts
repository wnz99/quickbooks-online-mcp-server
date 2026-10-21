import { z } from "zod";

export const reportNames = [
  'AccountListDetail', 'AgedPayableDetail', 'AgedPayables',
  'AgedReceivableDetail', 'AgedReceivables', 'BalanceSheet', 'CashFlow',
  'CustomerBalance', 'CustomerBalanceDetail', 'CustomerIncome', 'GeneralLedger',
  'InventoryValuationDetail', 'InventoryValuationSummary', 'JournalReport',
  'ProfitAndLoss', 'ProfitAndLossDetail', 'SalesByClassSummary', 'SalesByCustomer',
  'SalesByDepartment', 'SalesByProduct', 'TaxSummary', 'TransactionList',
  'TransactionListByCustomer', 'TransactionListByVendor', 'TransactionListWithSplits',
  'TrialBalance', 'VendorBalance', 'VendorBalanceDetail', 'VendorExpenses',
] as const;
export type ReportName = typeof reportNames[number];

const reportAliases: Record<string, ReportName> = {
  GeneralLedgerDetail: 'GeneralLedger', CustomerSales: 'SalesByCustomer',
  ItemSales: 'SalesByProduct', DepartmentSales: 'SalesByDepartment',
  ClassSales: 'SalesByClassSummary', AccountList: 'AccountListDetail',
  ARAgingSummary: 'AgedReceivables', ARAgingDetail: 'AgedReceivableDetail',
  APAgingSummary: 'AgedPayables', APAgingDetail: 'AgedPayableDetail',
};
const reportNameSchema = z.string().transform((name, ctx): ReportName => {
  if (Object.prototype.hasOwnProperty.call(reportAliases, name)) return reportAliases[name];
  if ((reportNames as readonly string[]).includes(name)) return name as ReportName;
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unsupported report. Choose: ${reportNames.join(', ')}` });
  return z.NEVER;
});

export const reportSchema = z.object({
  reportType: reportNameSchema.describe(`Supported reports: ${reportNames.join(', ')}`),
  params: z.record(z.string(), z.unknown()).optional().describe("Optional documented report parameters (date_macro, start_date, end_date, accounting_method, etc.). Daily summarization returns at most 200 columns plus Others."),
}).superRefine(({ reportType, params }, ctx) => {
  if (params && 'qzurl' in params) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['params', 'qzurl'], message: 'qzurl is no longer supported by QuickBooks Reports.' });
  }
  if (params && 'group_by' in params && ![
    'TransactionList', 'TransactionListByCustomer', 'TransactionListByVendor', 'TransactionListWithSplits',
  ].includes(reportType)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['params', 'group_by'], message: 'group_by is supported only by TransactionList reports.' });
  }
});
