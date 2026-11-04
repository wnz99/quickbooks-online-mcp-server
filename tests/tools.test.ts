import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import legacyNames from "./legacy-tools.json";

const state = vi.hoisted(() => ({ qbo: {} as Record<string, ReturnType<typeof vi.fn>>, tools: [] as unknown[] }));
vi.mock("fastmcp", () => ({ FastMCP: class {
  constructor() { state.tools = []; }
  addTool(tool: unknown) { state.tools.push(tool); }
  addResource() {}
  addPrompt() {}
} }));
vi.mock("../src/clients/quickbooksClient", () => ({
  quickbooksClient: { authenticate: vi.fn(), getQuickbooks: () => state.qbo },
  QuickbooksClient: { getInstance: async () => state.qbo },
}));
import { createServer } from "../src/server";
import { createJournalEntrySchema } from "../src/schemas/journalEntries";
import { createBillSchema } from "../src/schemas/bills";

type CapturedTool = { name: string; parameters: z.ZodObject; execute: (args: Record<string, unknown>, context: unknown) => Promise<string> };
function tools(): CapturedTool[] { return state.tools as CapturedTool[]; }
async function call(name: string, input: Record<string, unknown>) {
  const tool = tools().find(tool => tool.name === name)!;
  return JSON.parse(await tool.execute(tool.parameters.parse(input), {}));
}
function respond(value: unknown) {
  return vi.fn((...args: unknown[]) => { (args[args.length - 1] as (err: null, result: unknown) => void)(null, value); });
}
beforeEach(() => { state.qbo = {}; createServer({ transport: "stdio", logLevel: "error" }); });
afterEach(() => vi.unstubAllEnvs());

describe("interface compatibility", () => {
  it("keeps every original tool and adds only unique snake_case names", () => {
    const names = tools().map(tool => tool.name);
    for (const name of legacyNames) expect(names).toContain(name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every(name => /^[a-z]+(?:_[a-z]+)*$/.test(name))).toBe(true);
  });
  it.each(["WRITE", "UPDATE", "DELETE"])("restricts %s registration, preserving reads", flag => {
    vi.stubEnv(`QUICKBOOKS_DISABLE_${flag}`, "true");
    createServer({ transport: "stdio" });
    const prefix = flag === "WRITE" ? "create_" : `${flag.toLowerCase()}_`;
    expect(tools().some(tool => tool.name.startsWith(prefix))).toBe(false);
    expect(tools().some(tool => tool.name === "get_invoice")).toBe(true);
    expect(tools().some(tool => tool.name === "fetch_exchange_rate")).toBe(true);
  });
  it("reports unknown input without forwarding it or changing the result envelope", async () => {
    state.qbo.getInvoice = respond({ Id: "1" });
    const result = await call("get_invoice", { invoice_id: "1", accidental: "ignored" });
    expect(result).toMatchObject({ success: true, result: { Id: "1" } });
    expect(result.warnings[0]).toContain("accidental");
    expect(state.qbo.getInvoice.mock.calls[0][0]).toBe("1");
  });
  it("retains nested QBO payment and time activity inputs including upstream fields", async () => {
    const payment = { CustomerRef: { value: "1" }, TotalAmt: 20, PaymentRefNum: "REF", CurrencyRef: { value: "EUR" }, ExchangeRate: 1.1 };
    state.qbo.createPayment = respond(payment);
    expect(await call("create_payment", { payment })).toEqual({ success: true, result: payment });
    const timeActivity = { ClassRef: { value: "2" }, ItemRef: { value: "3" } };
    state.qbo.createTimeActivity = respond(timeActivity);
    await call("create_time_activity", { timeActivity });
    expect(state.qbo.createTimeActivity.mock.calls[0][0]).toEqual(timeActivity);
  });
});

describe("upstream behavior", () => {
  it("preserves omitted bill tracking and header fields by line ID", async () => {
    const current = { Id: "1", SyncToken: "2", PrivateNote: "keep", Line: [{ Id: "7", Amount: 5, DetailType: "AccountBasedExpenseLineDetail", AccountBasedExpenseLineDetail: { AccountRef: { value: "1" }, ClassRef: { value: "2" }, TaxCodeRef: { value: "NON" } } }] };
    state.qbo.getBill = respond(current);
    state.qbo.updateBill = vi.fn((payload, cb) => cb(null, payload));
    const response = await call("update_bill", { bill: { Id: "1", SyncToken: "2", Line: [{ Id: "7", Amount: 10, AccountBasedExpenseLineDetail: { AccountRef: { value: "1" } } }] } });
    expect(response.success).toBe(true);
    expect(response.result.PrivateNote).toBe("keep");
    expect(response.result.Line[0].AccountBasedExpenseLineDetail).toEqual(current.Line[0].AccountBasedExpenseLineDetail);
  });
  it("rejects stale bill SyncToken before writing", async () => {
    state.qbo.getBill = respond({ Id: "1", SyncToken: "3", Line: [] });
    state.qbo.updateBill = respond({ Id: "1" });
    expect((await call("update_bill", { bill: { Id: "1", SyncToken: "2", PrivateNote: "edit" } })).success).toBe(false);
    expect(state.qbo.updateBill).not.toHaveBeenCalled();
  });
  it.each([true, false, undefined])("handles dropped tax codes using AST preference presence (%s)", async partnerTaxEnabled => {
    const line = { Id: "7", Amount: 5, AccountBasedExpenseLineDetail: { AccountRef: { value: "1" }, TaxCodeRef: { value: "NON" } } };
    state.qbo.getBill = respond({ Id: "1", SyncToken: "2", Line: [line] });
    state.qbo.updateBill = respond({ Id: "1", SyncToken: "3", Line: [{ ...line, AccountBasedExpenseLineDetail: { AccountRef: { value: "1" } } }] });
    state.qbo.getPreferences = respond({ TaxPrefs: partnerTaxEnabled === undefined ? {} : { PartnerTaxEnabled: partnerTaxEnabled } });
    const response = await call("update_bill", { bill: { Id: "1", SyncToken: "2", PrivateNote: "edit" } });
    expect(response.success).toBe(partnerTaxEnabled !== undefined);
    if (response.success) expect(response.result._warning).toContain("Automated Sales Tax");
  });
  it("forwards invoice tax, service date, linked transactions and template fields with currency", async () => {
    state.qbo.createInvoice = respond({ Id: "new" });
    await call("create_invoice", { customer_ref: "1", line_items: [{ item_ref: "2", qty: 2, unit_price: 5, tax_code_ref: "NON", service_date: "2026-01-01" }], currency_ref: { value: "EUR" }, linked_txn: [{ txn_id: "3", txn_type: "Estimate" }], customer_memo: "memo", sales_term_ref: "4", bill_email: "fixture@example.test" });
    const payload = state.qbo.createInvoice.mock.calls[0][0];
    expect(payload).toMatchObject({ CurrencyRef: { value: "EUR" }, CustomerMemo: { value: "memo" }, LinkedTxn: [{ TxnId: "3", TxnType: "Estimate" }], BillEmail: { Address: "fixture@example.test" }, SalesTermRef: { value: "4" } });
    expect(payload.Line[0].SalesItemLineDetail).toMatchObject({ TaxCodeRef: { value: "NON" }, ServiceDate: "2026-01-01" });
  });
  it("preserves deposit required fields on partial updates", async () => {
    state.qbo.getDeposit = respond({ Id: "1", DepositToAccountRef: { value: "2" }, Line: [{ Amount: 10 }], SyncToken: "3" });
    state.qbo.updateDeposit = respond({ Id: "1" });
    await call("update_deposit", { deposit: { Id: "1", SyncToken: "3", PrivateNote: "updated" } });
    expect(state.qbo.updateDeposit.mock.calls[0][0]).toMatchObject({ DepositToAccountRef: { value: "2" }, Line: [{ Amount: 10 }], PrivateNote: "updated" });
  });
  it("uses the installed SDK GeneralLedgerDetail method and strips BalanceSheet start_date", async () => {
    state.qbo.reportGeneralLedgerDetail = respond({ Rows: [] });
    state.qbo.reportBalanceSheet = respond({ Rows: [] });
    expect((await call("get_report", { reportType: "GeneralLedger" })).success).toBe(true);
    await call("get_report", { reportType: "BalanceSheet", params: { start_date: "2026-01-01", end_date: "2026-02-01" } });
    expect(state.qbo.reportBalanceSheet.mock.calls[0][0]).toEqual({ end_date: "2026-02-01" });
  });
  it("preserves structured ParentRef for account reparenting", async () => {
    state.qbo.getAccount = respond({ Id: "1", SyncToken: "0" });
    state.qbo.updateAccount = respond({ Id: "1" });
    await call("update_account", { account_id: "1", patch: { ParentRef: { value: "2" }, SubAccount: true } });
    expect(state.qbo.updateAccount.mock.calls[0][0]).toMatchObject({ ParentRef: { value: "2" }, SubAccount: true });
  });
  it("validates journal lines while preserving unmodeled QBO fields", () => {
    const journalEntry = { TxnDate: "2026-01-01", Adjustment: true, Line: [{ Amount: 5, DetailType: "JournalEntryLineDetail", JournalEntryLineDetail: { PostingType: "Debit", AccountRef: { value: "1" }, Entity: { Type: "Vendor" } } }] };
    expect(createJournalEntrySchema.parse({ journalEntry }).journalEntry).toEqual(journalEntry);
    expect(createJournalEntrySchema.safeParse({ journalEntry: { ...journalEntry, Line: [{ Amount: "wrong" }] } }).success).toBe(false);
  });
  it("keeps bill class, tax, invoice reference, item and currency fields", () => {
    const bill = { VendorRef: { value: "1" }, CurrencyRef: { value: "EUR" }, ExchangeRate: 1.1, DocNumber: "vendor-invoice", Line: [{ Amount: 5, DetailType: "ItemBasedExpenseLineDetail", ItemBasedExpenseLineDetail: { ItemRef: { value: "1" }, ClassRef: { value: "2" }, TaxCodeRef: { value: "NON" } } }] };
    expect(createBillSchema.parse({ bill }).bill).toEqual(bill);
  });
  it("keeps original attachment metadata calls", async () => {
    const attachable = { FileName: "note.txt", Note: "test" };
    state.qbo.createAttachable = respond({ Id: "1" });
    expect((await call("create_attachable", { attachable })).success).toBe(true);
    expect(state.qbo.createAttachable.mock.calls[0][0]).toEqual(attachable);
  });
  it("returns errors using the existing success=false envelope", async () => {
    state.qbo.getInvoice = vi.fn((_id, cb) => cb(new Error("fixture failure")));
    expect(await call("get_invoice", { invoice_id: "1" })).toMatchObject({ success: false });
  });
});
