import { describe, expect, it } from "vitest";
import { buildQuickbooksSearchCriteria } from "../src/utils/search";

describe("search criteria", () => {
  it("preserves criteria alongside pagination and date operators", () => {
    const filter = { field: "TxnDate", operator: ">=", value: "2026-01-01" };
    expect(buildQuickbooksSearchCriteria({ criteria: [filter], limit: 5, offset: 1 })).toEqual([
      filter, { field: "limit", value: 5 }, { field: "offset", value: 1 },
    ]);
  });
  it("preserves advanced filters and count/sort options", () => {
    expect(buildQuickbooksSearchCriteria({ filters: [{ field: "Active", value: false }], count: true, desc: "Name" })).toEqual([
      { count: true }, { field: "Active", value: false }, { field: "desc", value: "Name" },
    ]);
  });
  it("preserves simple objects and raw arrays", () => {
    expect(buildQuickbooksSearchCriteria({ Name: "test" })).toEqual([{ field: "Name", value: "test" }]);
    expect(buildQuickbooksSearchCriteria([{ field: "Name", value: "test" }])).toEqual([{ field: "Name", value: "test" }]);
  });
});
