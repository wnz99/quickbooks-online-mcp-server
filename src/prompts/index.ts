import type { FastMCP } from "fastmcp";

export function registerPrompts(server: FastMCP) {
  server.addPrompt({
    name: "accounting-guide",
    description: "Guide to common accounting operations in QuickBooks",
    load: async () => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `# QuickBooks Accounting Guide

## Common Workflows

### Creating an Invoice
1. Search for the customer: \`search_customers\`
2. Search for items to include: \`search_items\`
3. Create the invoice with line items: \`create_invoice\`

### Recording a Bill Payment
1. Search for the bill: \`search_bills\`
2. Get the bill details (for Amount and SyncToken): \`get_bill\`
3. Create a bill payment referencing the bill: \`create_bill_payment\`

### Recording an Expense
1. Search for the vendor: \`search_vendors\`
2. Search for the expense account: \`search_accounts\`
3. Create a purchase: \`create_purchase\`

### Creating a Journal Entry
1. Search for the accounts to debit and credit: \`search_accounts\`
2. Create the journal entry with Line items: \`create_journal_entry\`

## Important Notes

- **SyncToken**: Before updating or deleting any entity, first fetch it with the get tool to obtain the current SyncToken. QuickBooks uses this for optimistic concurrency control.
- **Soft Deletes**: Some entities (like Customers) use soft deletes — they are marked as inactive rather than permanently removed.
- **Entity References**: When creating entities that reference others (e.g., Invoice → Customer), use the entity's Id as the reference value.
`,
            },
          },
        ],
      };
    },
  });
}
