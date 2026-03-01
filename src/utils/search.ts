export interface QuickbooksFilter {
  field: string;
  value: any;
  operator?: string;
}

export interface AdvancedQuickbooksSearchOptions {
  filters?: QuickbooksFilter[];
  asc?: string;
  desc?: string;
  limit?: number;
  offset?: number;
  count?: boolean;
  fetchAll?: boolean;
}

export type QuickbooksSearchCriteriaInput =
  | Record<string, any>
  | Array<Record<string, any>>
  | AdvancedQuickbooksSearchOptions;

export function buildQuickbooksSearchCriteria(
  input: QuickbooksSearchCriteriaInput
): Record<string, any> | Array<Record<string, any>> {
  if (Array.isArray(input)) {
    return input as Array<Record<string, any>>;
  }

  const possibleAdvancedKeys: (keyof AdvancedQuickbooksSearchOptions)[] = [
    "filters",
    "asc",
    "desc",
    "limit",
    "offset",
    "count",
    "fetchAll",
  ];

  const inputKeys = Object.keys(input || {});
  const isAdvanced = inputKeys.some((k) =>
    possibleAdvancedKeys.includes(k as keyof AdvancedQuickbooksSearchOptions)
  );

  if (!isAdvanced) {
    return input as Record<string, any>;
  }

  const options = input as AdvancedQuickbooksSearchOptions;
  const criteriaArr: Array<Record<string, any>> = [];

  options.filters?.forEach((f) => {
    criteriaArr.push({ field: f.field, value: f.value, operator: f.operator });
  });

  if (options.asc) {
    criteriaArr.push({ field: "asc", value: options.asc });
  }
  if (options.desc) {
    criteriaArr.push({ field: "desc", value: options.desc });
  }

  if (typeof options.limit === "number") {
    criteriaArr.push({ field: "limit", value: options.limit });
  }
  if (typeof options.offset === "number") {
    criteriaArr.push({ field: "offset", value: options.offset });
  }
  if (options.count) {
    criteriaArr.push({ field: "count", value: true });
  }
  if (options.fetchAll) {
    criteriaArr.push({ field: "fetchAll", value: true });
  }

  return criteriaArr.length > 0 ? criteriaArr : {};
}
