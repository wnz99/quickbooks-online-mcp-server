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
import { registerAdditionalTools } from "./tools/additional";
import { timingSafeEqual } from "crypto";

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

## Multi-Currency

Before creating entities, call \`get_preferences\` and check \`CurrencyPrefs.MultiCurrencyEnabled\`. If enabled, always ask the user which currency to use when creating vendors, customers, accounts, or transactions (unless already specified). Pass the ISO 4217 code via CurrencyRef (e.g. \`{ "value": "USD" }\`). Currency cannot be changed after creation.

When creating foreign currency transactions (bills, invoices, etc.), an exchange rate may be needed. Ask the user how to handle it:
1. **Auto-fetch**: Use \`fetch_exchange_rate\` to get the live ECB rate from Frankfurter
2. **User-provided**: The user supplies the rate manually
3. **Omit**: Let QuickBooks use its own stored rate

## Tips

- Use search tools to find entity IDs before updating or deleting
- Updates require the entity's current SyncToken (get it via the get tool first)
- Some deletes are soft-deletes (mark inactive) rather than hard deletes
- Deleting vendors or customers deactivates them (QBO does not support hard-delete for these)
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
  registerAdditionalTools(server);

  // Register resources and prompts
  registerResources(server);
  registerPrompts(server);

  logger.info("MCP server configured with tools, resources, and prompts");
  return server;
}

export async function startServer(config: ServerConfig) {
  process.env.MCP_TRANSPORT = config.transport;
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
    const startAuthorization = (c: { header: (name: string, value: string) => void; redirect: (url: string) => Response }) => {
      const authUrl = quickbooksClient.getAuthorizationUrl();
      const state = new URL(authUrl).searchParams.get("state")!;
      const secure = process.env.QUICKBOOKS_REDIRECT_URI?.startsWith("https:") ? "; Secure" : "";
      c.header("Set-Cookie", `qbo_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/callback; Max-Age=600${secure}`);
      c.header("Cache-Control", "no-store");
      return c.redirect(authUrl);
    };
    const matchesApiKey = (value: string) => {
      const expected = process.env.MCP_API_KEY;
      if (!expected) return true;
      const actualBytes = Buffer.from(value), expectedBytes = Buffer.from(expected);
      return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
    };
    app.get("/auth", (c) => {
      const bearer = c.req.header("Authorization")?.replace(/^Bearer /, "") || "";
      if (matchesApiKey(bearer)) return startAuthorization(c);
      c.header("Cache-Control", "no-store");
      return c.html('<html><body><h1>Connect QuickBooks</h1><form method="post" action="/auth"><label>Server API key <input type="password" name="api_key" required autocomplete="off"></label><button type="submit">Authorize</button></form></body></html>');
    });
    app.post("/auth", async (c) => {
      const body = await c.req.parseBody();
      if (typeof body.api_key !== "string" || !matchesApiKey(body.api_key)) return c.text("Unauthorized", 401);
      return startAuthorization(c);
    });

    app.get("/callback", async (c) => {
      try {
        const state = c.req.query("state");
        const cookie = c.req.header("Cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith("qbo_oauth_state="))?.slice("qbo_oauth_state=".length);
        if (!state || !cookie || cookie !== state) return c.text("Invalid OAuth browser state", 400);
        c.header("Set-Cookie", "qbo_oauth_state=; HttpOnly; SameSite=Lax; Path=/callback; Max-Age=0");
        c.header("Cache-Control", "no-store");
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
