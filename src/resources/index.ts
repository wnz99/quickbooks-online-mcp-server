import type { FastMCP } from "fastmcp";

export function registerResources(server: FastMCP) {
  server.addResource({
    uri: "qbo://entities",
    name: "QuickBooks Entities",
    description: "All supported entity types and their CRUD capabilities",
    mimeType: "application/json",
    async load() {
      return {
        text: JSON.stringify(
          {
            entities: [
              { name: "Account", tools: ["get_account", "create_account", "update_account", "search_accounts"] },
              { name: "Attachable", tools: ["create_attachable", "get_attachable", "update_attachable", "delete_attachable", "search_attachables"] },
              { name: "Bill", tools: ["create_bill", "get_bill", "update_bill", "delete_bill", "search_bills"] },
              { name: "Bill Payment", tools: ["create_bill_payment", "get_bill_payment", "update_bill_payment", "delete_bill_payment", "search_bill_payments"] },
              { name: "Class", tools: ["create_class", "get_class", "update_class", "search_classes"] },
              { name: "Company Info", tools: ["get_company_info", "update_company_info"] },
              { name: "Credit Memo", tools: ["create_credit_memo", "get_credit_memo", "update_credit_memo", "delete_credit_memo", "search_credit_memos"] },
              { name: "Customer", tools: ["create_customer", "get_customer", "update_customer", "delete_customer", "search_customers"] },
              { name: "Department", tools: ["create_department", "get_department", "update_department", "search_departments"] },
              { name: "Deposit", tools: ["create_deposit", "get_deposit", "update_deposit", "delete_deposit", "search_deposits"] },
              { name: "Employee", tools: ["create_employee", "get_employee", "update_employee", "search_employees"] },
              { name: "Estimate", tools: ["create_estimate", "get_estimate", "update_estimate", "delete_estimate", "search_estimates"] },
              { name: "Exchange Rate", tools: ["get_exchange_rate", "update_exchange_rate"] },
              { name: "Invoice", tools: ["create_invoice", "get_invoice", "update_invoice", "delete_invoice", "search_invoices"] },
              { name: "Item", tools: ["create_item", "get_item", "update_item", "search_items"] },
              { name: "Journal Code", tools: ["create_journal_code", "get_journal_code", "update_journal_code", "delete_journal_code", "search_journal_codes"] },
              { name: "Journal Entry", tools: ["create_journal_entry", "get_journal_entry", "update_journal_entry", "delete_journal_entry", "search_journal_entries"] },
              { name: "Payment", tools: ["create_payment", "get_payment", "update_payment", "delete_payment", "search_payments"] },
              { name: "Payment Method", tools: ["create_payment_method", "get_payment_method", "update_payment_method", "search_payment_methods"] },
              { name: "Preferences", tools: ["get_preferences", "update_preferences"] },
              { name: "Purchase", tools: ["create_purchase", "get_purchase", "update_purchase", "delete_purchase", "search_purchases"] },
              { name: "Purchase Order", tools: ["create_purchase_order", "get_purchase_order", "update_purchase_order", "delete_purchase_order", "search_purchase_orders"] },
              { name: "Refund Receipt", tools: ["create_refund_receipt", "get_refund_receipt", "update_refund_receipt", "delete_refund_receipt", "search_refund_receipts"] },
              { name: "Sales Receipt", tools: ["create_sales_receipt", "get_sales_receipt", "update_sales_receipt", "delete_sales_receipt", "search_sales_receipts"] },
              { name: "Tax Agency", tools: ["create_tax_agency", "get_tax_agency", "update_tax_agency", "search_tax_agencies"] },
              { name: "Tax Code", tools: ["get_tax_code", "update_tax_code", "search_tax_codes"] },
              { name: "Tax Rate", tools: ["get_tax_rate", "update_tax_rate", "search_tax_rates"] },
              { name: "Term", tools: ["create_term", "get_term", "update_term", "search_terms"] },
              { name: "Time Activity", tools: ["create_time_activity", "get_time_activity", "update_time_activity", "delete_time_activity", "search_time_activities"] },
              { name: "Transfer", tools: ["create_transfer", "update_transfer", "delete_transfer", "search_transfers"] },
              { name: "Vendor", tools: ["create_vendor", "get_vendor", "update_vendor", "delete_vendor", "search_vendors"] },
              { name: "Vendor Credit", tools: ["create_vendor_credit", "get_vendor_credit", "update_vendor_credit", "delete_vendor_credit", "search_vendor_credits"] },
              { name: "Reports", tools: ["get_report"] },
            ],
          },
          null,
          2
        ),
      };
    },
  });

  server.addResource({
    uri: "qbo://search-guide",
    name: "Search Syntax Guide",
    description: "How to use search tools with filters, pagination, and sorting",
    mimeType: "text/markdown",
    async load() {
      return {
        text: `# QuickBooks Search Guide

## Simple Search
Pass a plain object with field-value pairs:
\`\`\`json
{ "Name": "John" }
\`\`\`

## Advanced Search
Use the criteria array with operators:
\`\`\`json
{
  "criteria": [
    { "field": "Name", "value": "John", "operator": "LIKE" },
    { "field": "Balance", "value": "0", "operator": ">" }
  ],
  "limit": 10,
  "offset": 0,
  "asc": "Name"
}
\`\`\`

## Supported Operators
\`=\`, \`LIKE\`, \`>\`, \`<\`, \`>=\`, \`<=\`, \`IN\`

## Pagination
- \`limit\`: Maximum results to return
- \`offset\`: Skip N results from start
- \`asc\` / \`desc\`: Sort by field name
- \`fetchAll\`: Transparently fetch all pages
- \`count\`: Return only the count of matching records
`,
      };
    },
  });
}
