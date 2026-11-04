import { expect, it } from "vitest";
import { createInvoiceSchema, updateInvoiceSchema, searchInvoicesSchema } from "../src/schemas/invoices";
import { createBillSchema } from "../src/schemas/bills";
import { reportSchema } from "../src/schemas/reports";
import { createJournalEntrySchema } from "../src/schemas/journalEntries";

it("keeps existing optional search input, arbitrary patches, report parameters and line defaults on Zod 4", () => {
  expect(searchInvoicesSchema.parse({})).toEqual({});
  const patch = { CustomField: [{ DefinitionId: "1", StringValue: "kept" }] };
  expect(updateInvoiceSchema.parse({ invoice_id: "1", patch }).patch).toEqual(patch);
  expect(reportSchema.parse({ reportType: "ProfitAndLoss", params: { summarize_column_by: "Classes" } }).params).toEqual({ summarize_column_by: "Classes" });
  const bill = createBillSchema.parse({ bill: { VendorRef: { value: "1" }, Line: [{ Amount: 1, AccountBasedExpenseLineDetail: { AccountRef: { value: "2" } } }] } });
  expect(bill.bill.Line[0].DetailType).toBe("AccountBasedExpenseLineDetail");
  expect(createInvoiceSchema.safeParse({ customer_ref: "1", line_items: [{ item_ref: "2", qty: 1, unit_price: 0 }] }).success).toBe(true);
  const journalEntry = { Line: [{ Amount: 1, DetailType: "JournalEntryLineDetail", JournalEntryLineDetail: { PostingType: "Debit", AccountRef: { value: "1", type: "Account" } } }] };
  expect(createJournalEntrySchema.parse({ journalEntry }).journalEntry).toEqual(journalEntry);
});
