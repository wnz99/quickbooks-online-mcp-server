export interface QuickbooksFilter {
  field: string;
  value: unknown;
  operator?: string;
}

export interface AdvancedQuickbooksSearchOptions {
  criteria?: Array<Record<string, unknown>>;
  filters?: QuickbooksFilter[];
  asc?: string;
  desc?: string;
  limit?: number;
  offset?: number;
  count?: boolean;
  fetchAll?: boolean;
}

export type QuickbooksSearchCriteriaInput =
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | AdvancedQuickbooksSearchOptions;

export function buildQuickbooksSearchCriteria(
  input: QuickbooksSearchCriteriaInput
): Array<Record<string, unknown>> {
  const criteria: Array<Record<string, unknown>> = [];
  let count = false;

  const addField = (field: string, value: unknown, operator?: unknown) => {
    if (!field.trim()) throw new Error('Search field must not be empty');
    if (value === undefined) return;
    if (field.toLowerCase() === 'count') {
      count = Boolean(value);
      return;
    }
    if (['asc', 'desc'].includes(field.toLowerCase()) && String(value).trim().toLowerCase() === 'id') {
      throw new Error('QuickBooks no longer supports sorting by Id. Choose another sortable field.');
    }
    const comparison = operator ?? (Array.isArray(value) ? 'IN' : undefined);
    criteria.push({ field, value, ...(comparison === undefined ? {} : { operator: comparison }) });
  };

  const addRecord = (entry: Record<string, unknown>) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Search criteria must contain filter objects');
    }
    if ('field' in entry || 'key' in entry) {
      const field = entry.field ?? entry.key;
      if (typeof field !== 'string' || entry.value === undefined) throw new Error('Search filter requires a field and value');
      addField(field, entry.value, entry.operator);
    } else {
      for (const [field, value] of Object.entries(entry)) addField(field, value);
    }
  };

  if (Array.isArray(input)) {
    input.forEach(addRecord);
  } else if ('field' in input || 'key' in input) {
    addRecord(input as Record<string, unknown>);
  } else {
    for (const [field, value] of Object.entries(input)) {
      if (field === 'criteria' || field === 'filters') {
        if (value === undefined) continue;
        if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
        value.forEach(addRecord);
      } else {
        addField(field, value);
      }
    }
  }

  // SDK removes count markers with splice(index, index + 1); first position
  // prevents its removal from also discarding adjacent filters/options.
  return count ? [{ count: true }, ...criteria] : criteria;
}
