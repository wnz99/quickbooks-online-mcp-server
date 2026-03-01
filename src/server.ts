import { FastMCP } from "fastmcp";
import type { ServerConfig } from "./types";
import { setLogLevel, logger } from "./utils/logger";
import { eulaHtml } from "./pages/eula";
import { privacyHtml } from "./pages/privacy";
import { launchHtml } from "./pages/launch";
import { getDisconnectHtml } from "./pages/disconnect";

import { registerAccountTools } from "./tools/accounts";
import { registerBillTools } from "./tools/bills";
import { registerBillPaymentTools } from "./tools/billPayments";
import { registerCustomerTools } from "./tools/customers";
import { registerEmployeeTools } from "./tools/employees";
import { registerEstimateTools } from "./tools/estimates";
import { registerInvoiceTools } from "./tools/invoices";
import { registerItemTools } from "./tools/items";
import { registerJournalEntryTools } from "./tools/journalEntries";
import { registerPurchaseTools } from "./tools/purchases";
import { registerVendorTools } from "./tools/vendors";
import { registerAttachableTools } from "./tools/attachables";
import { registerClassTools } from "./tools/classes";
import { registerCompanyInfoTools } from "./tools/companyInfo";
import { registerCreditMemoTools } from "./tools/creditMemos";
import { registerDepartmentTools } from "./tools/departments";
import { registerDepositTools } from "./tools/deposits";
import { registerExchangeRateTools } from "./tools/exchangeRates";
import { registerJournalCodeTools } from "./tools/journalCodes";
import { registerPaymentTools } from "./tools/payments";
import { registerPaymentMethodTools } from "./tools/paymentMethods";
import { registerPreferencesTools } from "./tools/preferences";
import { registerPurchaseOrderTools } from "./tools/purchaseOrders";
import { registerRefundReceiptTools } from "./tools/refundReceipts";
import { registerSalesReceiptTools } from "./tools/salesReceipts";
import { registerTaxAgencyTools } from "./tools/taxAgencies";
import { registerTaxCodeTools } from "./tools/taxCodes";
import { registerTaxRateTools } from "./tools/taxRates";
import { registerTermTools } from "./tools/terms";
import { registerTimeActivityTools } from "./tools/timeActivities";
import { registerTransferTools } from "./tools/transfers";
import { registerVendorCreditTools } from "./tools/vendorCredits";
import { registerReportTools } from "./tools/reports";
import { registerResources } from "./resources/index";
import { registerPrompts } from "./prompts/index";
import { quickbooksClient } from "./clients/quickbooksClient";

export function createServer(config: ServerConfig) {
  if (config.logLevel) setLogLevel(config.logLevel);

  const apiKey = process.env.MCP_API_KEY;

  const server = new FastMCP({
    name: "quickbooks-online",
    version: "1.0.0",
    instructions: `
This MCP server provides tools for managing QuickBooks Online accounting data.
You can create, read, update, delete, and search across all QBO entities.

## Tool Naming Convention

All tools follow the pattern: \`{action}_{entity}\`
- Actions: create, get, update, delete, search
- Entity: snake_case singular (e.g., customer, bill_payment, journal_entry)

## Search Tools

Search tools accept criteria with field-level filtering:
- Simple: \`{ "Name": "John" }\`
- Advanced: \`{ "filters": [{ "field": "Name", "value": "John", "operator": "LIKE" }], "limit": 10 }\`

## Reports

Use the \`get_report\` tool with a report type (e.g., BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance).

## Tips

- Use search tools to find entity IDs before updating or deleting
- Updates require the entity's current SyncToken (get it via the get tool first)
- Some deletes are soft-deletes (mark inactive) rather than hard deletes
    `.trim(),
    health: {
      message: "QuickBooks MCP Server is healthy",
      enabled: config.transport === "http",
      path: "/health",
      status: 200,
    },
    authenticate: apiKey
      ? async (request) => {
          const auth = request.headers.authorization;
          if (auth !== `Bearer ${apiKey}`) {
            throw new Response(null, { status: 401, statusText: "Unauthorized" });
          }
          return { id: "owner" };
        }
      : undefined,
  });

  // Register all entity tools
  registerAccountTools(server);
  registerAttachableTools(server);
  registerBillTools(server);
  registerBillPaymentTools(server);
  registerClassTools(server);
  registerCompanyInfoTools(server);
  registerCreditMemoTools(server);
  registerCustomerTools(server);
  registerDepartmentTools(server);
  registerDepositTools(server);
  registerEmployeeTools(server);
  registerEstimateTools(server);
  registerExchangeRateTools(server);
  registerInvoiceTools(server);
  registerItemTools(server);
  registerJournalCodeTools(server);
  registerJournalEntryTools(server);
  registerPaymentTools(server);
  registerPaymentMethodTools(server);
  registerPreferencesTools(server);
  registerPurchaseTools(server);
  registerPurchaseOrderTools(server);
  registerRefundReceiptTools(server);
  registerSalesReceiptTools(server);
  registerTaxAgencyTools(server);
  registerTaxCodeTools(server);
  registerTaxRateTools(server);
  registerTermTools(server);
  registerTimeActivityTools(server);
  registerTransferTools(server);
  registerVendorTools(server);
  registerVendorCreditTools(server);
  registerReportTools(server);

  // Register resources and prompts
  registerResources(server);
  registerPrompts(server);

  logger.info("MCP server configured with tools, resources, and prompts");
  return server;
}

export async function startServer(config: ServerConfig) {
  const server = createServer(config);

  if (config.transport === "stdio") {
    await server.start({ transportType: "stdio" });
  } else {
    // Register legal pages (required by Intuit for production apps)
    const app = server.getApp();
    app.get("/eula", (c) => c.html(eulaHtml));
    app.get("/privacy", (c) => c.html(privacyHtml));
    app.get("/launch", (c) => c.html(launchHtml));
    app.get("/disconnect", (c) => {
      const realmId = c.req.query("realmId") ?? null;
      return c.html(getDisconnectHtml(realmId));
    });

    // OAuth routes
    app.get("/auth", (c) => {
      const authUrl = quickbooksClient.getAuthorizationUrl();
      return c.redirect(authUrl);
    });

    app.get("/callback", async (c) => {
      try {
        await quickbooksClient.handleOAuthCallback(c.req.url);
        return c.html(`<html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial,sans-serif;background:#f5f5f5"><h2 style="color:#2E8B57">Successfully connected to QuickBooks!</h2><p>You can close this window now.</p></body></html>`);
      } catch (error) {
        logger.error("OAuth callback error", error);
        return c.html(`<html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial,sans-serif;background:#fff0f0"><h2 style="color:#d32f2f">Error connecting to QuickBooks</h2><p>Please check the server logs for details.</p></body></html>`, 500);
      }
    });

    const port = config.port || 3000;
    await server.start({
      transportType: "httpStream",
      httpStream: {
        endpoint: "/mcp",
        stateless: true,
        host: "0.0.0.0",
        port,
      },
    });
    logger.info(`HTTP server listening on port ${port}`);
  }

  return server;
}
