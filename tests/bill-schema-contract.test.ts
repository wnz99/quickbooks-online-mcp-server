import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FastMCP } from "fastmcp";
import type QuickBooks from "node-quickbooks";
import { z } from "zod";
import { updateBillSchema } from "../src/schemas/bills";
import { registerBillTools } from "../src/tools/bills";

const { createBill } = vi.hoisted(() => ({ createBill: vi.fn() }));

// Replace only the authentication wrapper; exercise the registered operation and callback adapter.
vi.mock("../src/utils/executeQbo", () => ({
  executeQbo: <TArgs>(
    _name: string,
    operation: (qbo: QuickBooks, args: TArgs) => Promise<unknown>,
  ) => (args: TArgs) => operation({ createBill } as unknown as QuickBooks, args),
}));

interface RegisteredTool {
  name: string;
  parameters: z.ZodType;
  execute: (args: unknown) => Promise<unknown>;
}

const addTool = vi.fn();
registerBillTools({ addTool } as unknown as FastMCP);
const createTool = addTool.mock.calls
  .map(([tool]) => tool as RegisteredTool)
  .find(tool => tool.name === "create_bill")!;

function minimalBill() {
  return {
    VendorRef: { value: "vendor-1" },
    Line: [{
      Amount: 120,
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: { AccountRef: { value: "expense-1" } },
    }],
  };
}

function noVatBill() {
  const bill = minimalBill();
  return {
    ...bill,
    DocNumber: "SUP-2026-42",
    PrivateNote: "Supplier invoice, gross amount",
    GlobalTaxCalculation: "NotApplicable",
    Line: [{
      ...bill.Line[0],
      AccountBasedExpenseLineDetail: {
        ...bill.Line[0].AccountBasedExpenseLineDetail,
        TaxCodeRef: { value: "NON", name: "No VAT" },
        BillableStatus: "NotBillable",
      },
    }],
  };
}

describe("registered create_bill input", () => {
  beforeEach(() => {
    createBill.mockReset();
    createBill.mockImplementation((bill: object, callback: (error: unknown, result: unknown) => void) => {
      callback(null, { Id: "bill-1", ...bill });
    });
  });

  it.each([
    ["gross no-VAT bill", noVatBill],
    ["existing minimal bill", minimalBill],
  ])("forwards %s unchanged to the QBO client", async (_name, makeBill) => {
    const bill = makeBill();
    const args = createTool.parameters.parse({ bill });
    const result = await createTool.execute(args);
    expect(createBill).toHaveBeenCalledExactlyOnceWith(bill, expect.any(Function));
    expect(result).toEqual({ Id: "bill-1", ...bill });
  });

  it("retains the existing default detail type", () => {
    const bill = minimalBill();
    const line = {
      Amount: bill.Line[0].Amount,
      AccountBasedExpenseLineDetail: bill.Line[0].AccountBasedExpenseLineDetail,
    };
    const parsed = createTool.parameters.parse({ bill: { ...bill, Line: [line] } });
    expect(parsed).toEqual({ bill });
  });

  it.each(["TaxExcluded", "TaxInclusive", "NotApplicable"])("accepts native tax calculation %s", value => {
    expect(createTool.parameters.safeParse({ bill: { ...minimalBill(), GlobalTaxCalculation: value } }).success).toBe(true);
  });

  it.each(["Billable", "NotBillable", "HasBeenBilled"])("accepts native billable status %s", value => {
    const bill = noVatBill();
    bill.Line[0].AccountBasedExpenseLineDetail.BillableStatus = value;
    expect(createTool.parameters.safeParse({ bill }).success).toBe(true);
  });

  it.each<[string, unknown]>([
    ["unknown tax calculation", { ...noVatBill(), GlobalTaxCalculation: "NoVAT" }],
    ["unknown billable status", {
      ...noVatBill(),
      Line: [{ ...minimalBill().Line[0], AccountBasedExpenseLineDetail: {
        AccountRef: { value: "expense-1" }, BillableStatus: "Unbillable",
      } }],
    }],
    ...["NON", {}, { value: 123 }].map((reference): [string, unknown] => ["malformed tax reference", {
      ...noVatBill(),
      Line: [{ ...minimalBill().Line[0], AccountBasedExpenseLineDetail: {
        AccountRef: { value: "expense-1" }, TaxCodeRef: reference,
      } }],
    }]),
  ])("rejects %s before any client call", (_name, bill) => {
    expect(createTool.parameters.safeParse({ bill }).success).toBe(false);
    expect(createBill).not.toHaveBeenCalled();
  });

  it("preserves existing unknown-key stripping", () => {
    const bill = noVatBill();
    expect(createTool.parameters.parse({ bill: { ...bill, UnsupportedField: true } })).toEqual({ bill });
  });
});

it("shares expense tax fields with update_bill while keeping header additions create-only", () => {
  const bill = noVatBill();
  expect(updateBillSchema.parse({ bill: { ...bill, Id: "bill-1", SyncToken: "0" } })).toEqual({
    bill: { ...minimalBill(), Line: bill.Line, Id: "bill-1", SyncToken: "0" },
  });
});
