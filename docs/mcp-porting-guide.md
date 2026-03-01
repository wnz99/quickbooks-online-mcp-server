# Porting the QuickBooks Online MCP Server to FastMCP

This document provides step-by-step instructions for porting the existing QBO MCP server (built on `@modelcontextprotocol/sdk` with stdio-only transport) to a modern FastMCP architecture with HTTP support, proper logging, deployment infrastructure, and maintainable code organization.

---

## 1. What Changes and What Stays

### Removed

| Current | Why |
|---------|-----|
| `@modelcontextprotocol/sdk` (McpServer, StdioServerTransport) | Replaced by FastMCP (higher-level, built-in HTTP support) |
| Side-effect tool registration (import triggers `RegisterTool()`) | Replaced by explicit `register*Tools(server)` functions |
| Separate `tools/` and `handlers/` directories (2 files per operation) | Consolidated into single tool files grouped by entity |
| `helpers/register-tool.ts` adapter | FastMCP's `server.addTool()` handles this directly |
| `types/tool-definition.ts` and `types/tool-response.ts` | FastMCP has its own tool types |
| Inconsistent tool naming (mix of `snake_case` and `kebab-case`) | Standardize on `snake_case` |

### Kept (Adapted)

| Current | Adaptation |
|---------|------------|
| `QuickbooksClient` singleton | Kept as `clients/quickbooks-client.ts`, same OAuth + SDK logic |
| `node-quickbooks` SDK with Promise wrapping | Kept inside tool handlers |
| `intuit-oauth` OAuth 2.0 flow | Kept for QBO API auth (separate from MCP client auth) |
| Zod schemas for tool inputs | Moved to `schemas/{entity}.ts` (one per entity), add `.describe()` to every field |
| `helpers/build-quickbooks-search-criteria.ts` | Moved to `utils/search.ts` |
| `helpers/format-error.ts` | Moved to `utils/errors.ts` and expanded |
| Environment variables | Kept, extended with `MCP_*` vars for transport config |

### Added

| New Component | Purpose |
|---------------|---------|
| FastMCP server with system prompt | Guides the LLM on available tools and their usage |
| HTTP transport (httpStream) | Enables remote deployment (not just local stdio) |
| `withLogging` helper | Wraps tool configs for automatic logging without monkey-patching |
| stderr-only logger | Prevents corrupting stdio JSON-RPC stream |
| Custom error classes | Structured error codes for better debugging |
| Resources | Read-only entity schemas and QBO documentation |
| Prompts | Accounting guidance templates |
| Dockerfile + docker-compose | Production deployment (FastMCP serves HTTP directly, no reverse proxy needed) |
| MCP client auth (optional) | OAuth 2.1 or simple token auth for the MCP endpoint itself |

---

## 2. Target Directory Structure

```
src/
├── index.ts                          # CLI entry point (arg parsing, config, startup)
├── server.ts                         # FastMCP server creation, tool wrapper, registrations
├── types.ts                          # Shared types (TransportMode, ServerConfig, etc.)
├── clients/
│   └── quickbooks-client.ts          # OAuth 2.0 client (KEPT from original, adapted)
├── tools/                            # One file per entity (replaces tools/ + handlers/)
│   ├── index.ts                      # Re-exports all register functions
│   ├── accounts.ts                   # registerAccountTools(server) — 3 tools
│   ├── bills.ts                      # registerBillTools(server) — 5 tools
│   ├── bill-payments.ts              # registerBillPaymentTools(server) — 5 tools
│   ├── customers.ts                  # registerCustomerTools(server) — 5 tools
│   ├── employees.ts                  # registerEmployeeTools(server) — 4 tools
│   ├── estimates.ts                  # registerEstimateTools(server) — 5 tools
│   ├── invoices.ts                   # registerInvoiceTools(server) — 4 tools
│   ├── items.ts                      # registerItemTools(server) — 4 tools
│   ├── journal-entries.ts            # registerJournalEntryTools(server) — 5 tools
│   ├── purchases.ts                  # registerPurchaseTools(server) — 5 tools
│   └── vendors.ts                    # registerVendorTools(server) — 5 tools
├── schemas/
│   ├── index.ts                      # Re-exports all entity schemas + shared schemas
│   ├── shared.ts                     # Shared schemas (search criteria, address, line items)
│   ├── accounts.ts                   # Account-specific schemas
│   ├── bills.ts                      # Bill-specific schemas
│   ├── bill-payments.ts              # Bill payment schemas
│   ├── customers.ts                  # Customer schemas
│   ├── employees.ts                  # Employee schemas
│   ├── estimates.ts                  # Estimate schemas
│   ├── invoices.ts                   # Invoice schemas
│   ├── items.ts                      # Item schemas
│   ├── journal-entries.ts            # Journal entry schemas
│   ├── purchases.ts                  # Purchase schemas
│   └── vendors.ts                    # Vendor schemas
├── resources/
│   └── index.ts                      # Read-only resources (entity info, search syntax help)
├── prompts/
│   └── index.ts                      # Accounting guidance prompts
├── utils/
│   ├── index.ts                      # Re-exports
│   ├── logger.ts                     # stderr-only logger (stdio-safe, for server-level logging)
│   ├── errors.ts                     # Custom error classes (replaces format-error.ts)
│   ├── search.ts                     # buildQuickbooksSearchCriteria (moved from helpers/)
│   └── with-logging.ts              # Tool config wrapper for automatic logging
├── auth/                             # MCP client authentication (NEW, optional)
│   ├── index.ts                      # Re-exports
│   └── SimpleAuth.ts                 # Simple token auth for MCP endpoint
├── Dockerfile                        # Production Docker image
└── docker-compose.yml                # Docker Compose for local development
```

### Key Structural Changes

1. **`tools/` + `handlers/` → `tools/` only**: Each entity gets one file containing both the schema and handler logic. No separate handler files.
2. **Files named by entity, not by action**: `customers.ts` (not `create-customer.tool.ts` + `create-quickbooks-customer.handler.ts`)
3. **Explicit registration**: Each file exports `register*Tools(server: FastMCP)` — no side effects.
4. **Schemas split per entity**: `schemas/customers.ts`, `schemas/invoices.ts`, etc. — mirrors the tool file structure. Shared schemas (search criteria, addresses) live in `schemas/shared.ts`.

---

## 3. Core Implementation

### 3.1 Entry Point (`index.ts`)

```typescript
#!/usr/bin/env node
import type { TransportMode } from "./types";
import { type ServerConfig, startServer } from "./server";
import { setLogLevel, logger } from "./utils/logger";

function getConfig(): ServerConfig {
  const args = process.argv.slice(2);
  let transport: TransportMode = (process.env.MCP_TRANSPORT as TransportMode) || "stdio";
  let port = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
  let logLevel = (process.env.MCP_LOG_LEVEL as ServerConfig["logLevel"]) || "info";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--stdio") transport = "stdio";
    else if (args[i] === "--http") transport = "http";
    else if (args[i] === "--port" && args[i + 1]) port = parseInt(args[++i], 10);
    else if (args[i] === "--log-level" && args[i + 1]) logLevel = args[++i] as ServerConfig["logLevel"];
  }

  return { transport, port, logLevel };
}

async function main() {
  const config = getConfig();
  if (config.logLevel) setLogLevel(config.logLevel);

  logger.info("Starting QuickBooks MCP Server", {
    transport: config.transport,
    port: config.transport === "http" ? config.port : undefined
  });

  try {
    await startServer(config);
    logger.info("MCP Server started successfully");
  } catch (error) {
    logger.error("Failed to start MCP server", { error });
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
  process.exit(1);
});

main();
```

### 3.2 Server Setup (`server.ts`)

This is the most critical file. It:
1. Creates the FastMCP instance with a system prompt
2. Registers all tools, resources, and prompts
3. Handles transport startup

```typescript
import { FastMCP } from "fastmcp";
import type { ServerConfig, TransportMode } from "./types";
import { setLogLevel, logger } from "./utils/logger";

// Import tool registrations (one per entity)
import { registerAccountTools } from "./tools/accounts";
import { registerBillTools } from "./tools/bills";
import { registerBillPaymentTools } from "./tools/bill-payments";
import { registerCustomerTools } from "./tools/customers";
import { registerEmployeeTools } from "./tools/employees";
import { registerEstimateTools } from "./tools/estimates";
import { registerInvoiceTools } from "./tools/invoices";
import { registerItemTools } from "./tools/items";
import { registerJournalEntryTools } from "./tools/journal-entries";
import { registerPurchaseTools } from "./tools/purchases";
import { registerVendorTools } from "./tools/vendors";
import { registerResources } from "./resources";
import { registerPrompts } from "./prompts";

export function createServer(config: ServerConfig) {
  if (config.logLevel) setLogLevel(config.logLevel);

  const server = new FastMCP({
    name: "quickbooks-online",
    version: "1.0.0",
    instructions: `
This MCP server provides tools for managing QuickBooks Online accounting data.
You can create, read, update, delete, and search across all major QBO entities.

## Available Entity Types

- **Customers**: Manage customer records
- **Invoices**: Create and manage invoices
- **Bills**: Track bills from vendors
- **Bill Payments**: Record payments against bills
- **Items**: Manage products and services
- **Accounts**: Chart of accounts management
- **Vendors**: Manage vendor/supplier records
- **Employees**: Employee records
- **Estimates**: Create and manage estimates/quotes
- **Journal Entries**: Manual journal entries
- **Purchases**: Record purchases and expenses

## Tool Naming Convention

All tools follow the pattern: \`{action}_{entity}\`
- Actions: create, get, update, delete, search
- Entity: snake_case singular (e.g., customer, bill_payment, journal_entry)

## Search Tools

Search tools accept criteria with field-level filtering:
- Simple: \`{ "Name": "John" }\`
- Advanced: \`{ "filters": [{ "field": "Name", "value": "John", "operator": "LIKE" }], "limit": 10 }\`

## Tips

- Use search tools to find entity IDs before updating or deleting
- Updates require the entity's current SyncToken (get it via the get tool first)
- Some deletes are soft-deletes (mark inactive) rather than hard deletes
    `.trim(),
    health: {
      message: "QuickBooks MCP Server is healthy",
      enabled: config.transport === "http",
      path: "/health",
      status: 200
    }
  });

  // ─── Register all tools ───
  registerAccountTools(server);
  registerBillTools(server);
  registerBillPaymentTools(server);
  registerCustomerTools(server);
  registerEmployeeTools(server);
  registerEstimateTools(server);
  registerInvoiceTools(server);
  registerItemTools(server);
  registerJournalEntryTools(server);
  registerPurchaseTools(server);
  registerVendorTools(server);

  // ─── Register resources and prompts ───
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
    const port = config.port || 3000;
    await server.start({
      transportType: "httpStream",
      httpStream: {
        endpoint: "/mcp",
        stateless: false,
        host: "0.0.0.0",
        port
      }
    });
    logger.info(`HTTP server listening on port ${port}`);
  }

  return server;
}
```

### 3.2.1 Tool Logging Helper (`utils/with-logging.ts`)

Instead of monkey-patching `server.addTool`, use a pure function that wraps tool configs before registration. This is testable, type-safe, and won't break if FastMCP changes its internals.

Additionally, FastMCP's `execute` callback provides a built-in `log` object (with `debug`, `info`, `warn`, `error` methods) that sends log messages to the MCP client. Use `log` inside tool execute functions for client-visible logging. Use the stderr `logger` (section 3.4) only for server-level concerns (startup, shutdown, config).

```typescript
import { logger } from "./logger";
import { formatError } from "./errors";

type ToolConfig = Parameters<import("fastmcp").FastMCP["addTool"]>[0];

/**
 * Wraps a tool config's execute function with automatic stderr logging.
 * Use this around every tool registration for consistent observability.
 */
export function withLogging(config: ToolConfig): ToolConfig {
  const originalExecute = config.execute;
  const toolName = config.name;

  return {
    ...config,
    execute: async (args, context) => {
      const sessionId = context?.sessionId || "(none)";
      logger.debug(`[tool:${toolName}] CALL`, { sessionId, args });

      try {
        const result = await originalExecute(args, context);
        logger.debug(`[tool:${toolName}] OK`, { sessionId });
        return result;
      } catch (error) {
        logger.error(`[tool:${toolName}] ERROR`, {
          error: formatError(error),
          sessionId
        });
        throw error;
      }
    }
  };
}
```

**Usage in tool files** (see section 4.2 for full example):
```typescript
import { withLogging } from "../utils/with-logging";

export function registerCustomerTools(server: FastMCP) {
  server.addTool(withLogging({
    name: "create_customer",
    // ...
  }));
}
```

### 3.3 Types (`types.ts`)

```typescript
export type TransportMode = "stdio" | "http";

export interface ServerConfig {
  logLevel?: "debug" | "error" | "info" | "warn";
  transport: TransportMode;
  port?: number;
}
```

### 3.4 Logger (`utils/logger.ts`)

**Critical**: All logging must go to stderr. For stdio transport, writing to stdout corrupts the JSON-RPC stream.

```typescript
type LogLevel = "debug" | "error" | "info" | "warn";

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLogLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function logToStderr(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MCP] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    const dataStr = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
    console.error(`${prefix} ${message}\n${dataStr}`);
  } else {
    console.error(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => logToStderr("debug", message, data),
  info:  (message: string, data?: unknown) => logToStderr("info", message, data),
  warn:  (message: string, data?: unknown) => logToStderr("warn", message, data),
  error: (message: string, data?: unknown) => logToStderr("error", message, data)
};
```

### 3.5 Error Handling (`utils/errors.ts`)

Replace `format-error.ts` with structured error classes:

```typescript
export class MCPError extends Error {
  readonly code: string;
  readonly isRetryable: boolean;

  constructor(message: string, code: string, isRetryable = false) {
    super(message);
    this.name = "MCPError";
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

export class QuickBooksApiError extends MCPError {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message, "QUICKBOOKS_API_ERROR", true);
    this.name = "QuickBooksApiError";
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends MCPError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", true);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, public readonly field?: string) {
    super(message, "VALIDATION_ERROR", false);
    this.name = "ValidationError";
  }
}

export class EntityNotFoundError extends MCPError {
  constructor(entityType: string, id: string) {
    super(`${entityType} not found: ${id}`, "NOT_FOUND", false);
    this.name = "EntityNotFoundError";
  }
}

/** Normalize any error to a string (replaces format-error.ts) */
export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return JSON.stringify(error);
}
```

### 3.6 Search Helper (`utils/search.ts`)

Move `build-quickbooks-search-criteria.ts` here with the same logic. No changes to the function itself.

---

## 4. Tool Conversion Pattern

### 4.1 Before (Current Architecture — 2 files per operation)

**Tool file** (`src/tools/customers/create-customer.tool.ts`):
```typescript
import { z } from "zod";
import { RegisterTool } from "../../helpers/register-tool";
import QuickbooksMCPServer from "../../server/qbo-mcp-server";
import createQuickbooksCustomer from "../../handlers/customers/create-quickbooks-customer.handler";

const schema = z.object({ ... });

RegisterTool(QuickbooksMCPServer.GetServer(), {
  name: "create_customer",
  description: "Create a new customer",
  schema,
  handler: async (params) => { /* calls createQuickbooksCustomer */ }
});
```

**Handler file** (`src/handlers/customers/create-quickbooks-customer.handler.ts`):
```typescript
export default async function createQuickbooksCustomer(params) {
  const client = QuickbooksClient.getInstance();
  await client.authenticate();
  const qbo = client.getClient();
  return new Promise((resolve, reject) => {
    qbo.createCustomer(params, (err, result) => { ... });
  });
}
```

### 4.2 After (Target Architecture — 1 file per entity)

**Single file** (`src/tools/customers.ts`):
```typescript
import type { FastMCP } from "fastmcp";
import {
  createCustomerSchema, getCustomerSchema,
  updateCustomerSchema, searchCustomerSchema
} from "../schemas/customers";
import { QuickbooksClient } from "../clients/quickbooks-client";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/with-logging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerCustomerTools(server: FastMCP) {

  // ─── Create Customer ───
  server.addTool(withLogging({
    name: "create_customer",
    description: "Create a new customer in QuickBooks Online. Requires at least a display name.",
    parameters: createCustomerSchema,
    execute: async (args, { log }) => {
      try {
        const client = QuickbooksClient.getInstance();
        await client.authenticate();
        const qbo = client.getClient();

        const result = await new Promise((resolve, reject) => {
          qbo.createCustomer(args, (err: unknown, customer: unknown) => {
            if (err) reject(err);
            else resolve(customer);
          });
        });

        log.info("Customer created", { id: (result as any).Id });
        return JSON.stringify({ success: true, result });
      } catch (error) {
        log.error("Failed to create customer", { error: formatError(error) });
        return JSON.stringify({ success: false, error: formatError(error) });
      }
    }
  }));

  // ─── Get Customer ───
  server.addTool(withLogging({
    name: "get_customer",
    description: "Retrieve a customer by their QuickBooks ID. Returns full customer details including SyncToken needed for updates.",
    parameters: getCustomerSchema,
    annotations: { readOnlyHint: true },
    execute: async (args, { log }) => {
      try {
        const client = QuickbooksClient.getInstance();
        await client.authenticate();
        const qbo = client.getClient();

        const result = await new Promise((resolve, reject) => {
          qbo.getCustomer(args.id, (err: unknown, customer: unknown) => {
            if (err) reject(err);
            else resolve(customer);
          });
        });

        return JSON.stringify({ success: true, result });
      } catch (error) {
        log.error("Failed to get customer", { error: formatError(error) });
        return JSON.stringify({ success: false, error: formatError(error) });
      }
    }
  }));

  // ─── Update Customer ───
  server.addTool(withLogging({ ... }));

  // ─── Delete Customer ───
  server.addTool(withLogging({ ... }));

  // ─── Search Customers ───
  server.addTool(withLogging({
    name: "search_customers",
    description: "Search for customers in QuickBooks. Supports filtering by name, email, balance, and more.",
    parameters: searchCustomerSchema,
    annotations: { readOnlyHint: true },
    execute: async (args, { log }) => {
      try {
        const client = QuickbooksClient.getInstance();
        await client.authenticate();
        const qbo = client.getClient();

        const criteria = buildQuickbooksSearchCriteria(args.criteria);

        const result = await new Promise((resolve, reject) => {
          qbo.findCustomers(criteria, (err: unknown, customers: unknown) => {
            if (err) reject(err);
            else resolve(customers);
          });
        });

        return JSON.stringify({ success: true, result });
      } catch (error) {
        log.error("Failed to search customers", { error: formatError(error) });
        return JSON.stringify({ success: false, error: formatError(error) });
      }
    }
  }));
}
```

### 4.3 Key Conversion Rules

1. **Merge tool + handler into one `execute` function** inside `server.addTool()`
2. **Group all CRUD tools for an entity into one file**
3. **Wrap every tool with `withLogging()`** for automatic stderr logging
4. **Use FastMCP's built-in `log`** (from execute context) for client-visible logging inside tool handlers
5. **Standardize tool names to `snake_case`**: `create-bill` → `create_bill`
6. **Add `.describe()` to every Zod schema field** (the LLM uses these)
7. **Mark read-only tools** with `annotations: { readOnlyHint: true }`
8. **Return `JSON.stringify()`** — never return raw objects
9. **Always include `success: true/false`** in responses
10. **Add descriptive `description`** to every tool — this is what the LLM reads to decide which tool to use
11. **Use the stderr `logger`** only for server-level concerns (startup, config). Use `log` from execute context inside tools

---

## 5. Schema Migration (`schemas/`)

Split schemas into **one file per entity** plus a shared file. This mirrors the tool file structure and keeps each file focused. Add `.describe()` to every field.

### 5.1 Shared Schemas (`schemas/shared.ts`)

Reusable schemas referenced by multiple entities (search criteria, addresses, line items):

```typescript
import { z } from "zod";

export const searchCriteriaSchema = z.union([
  z.record(z.string(), z.unknown()).describe("Simple key-value filter"),
  z.object({
    filters: z.array(z.object({
      field: z.string().describe("Field name to filter on"),
      value: z.union([z.string(), z.number(), z.boolean()]).describe("Filter value"),
      operator: z.enum(["=", "LIKE", ">", "<", ">=", "<=", "!=", "IN"]).optional().describe("Comparison operator (default: =)")
    })).optional().describe("Array of field-level filters"),
    fetchAll: z.boolean().optional().describe("Fetch all results with automatic pagination"),
    offset: z.number().optional().describe("Pagination offset (starting position)"),
    limit: z.number().optional().describe("Maximum results to return"),
    count: z.boolean().optional().describe("Return count only"),
    desc: z.string().optional().describe("Field to sort descending"),
    asc: z.string().optional().describe("Field to sort ascending")
  }).describe("Advanced search with filters, pagination, and sorting")
]).describe("Search criteria — simple object or advanced options");

export const addressSchema = z.object({
  Line1: z.string().optional().describe("Street address line 1"),
  City: z.string().optional().describe("City"),
  CountrySubDivisionCode: z.string().optional().describe("State/province code"),
  PostalCode: z.string().optional().describe("Postal/ZIP code"),
  Country: z.string().optional().describe("Country")
}).describe("Mailing or billing address");

export const entityRefSchema = z.object({
  value: z.string().describe("Entity ID"),
  name: z.string().optional().describe("Entity display name")
}).describe("Reference to another QuickBooks entity");
```

### 5.2 Entity Schemas (e.g. `schemas/customers.ts`)

Each entity file imports from shared and exports its own schemas:

```typescript
import { z } from "zod";
import { searchCriteriaSchema, addressSchema } from "./shared";

export const createCustomerSchema = z.object({
  DisplayName: z.string().describe("Display name (required, must be unique)"),
  GivenName: z.string().optional().describe("First name"),
  FamilyName: z.string().optional().describe("Last name"),
  PrimaryEmailAddr: z.object({
    Address: z.string().email().describe("Email address")
  }).optional().describe("Primary email"),
  BillAddr: addressSchema.optional().describe("Billing address"),
  // ... all other fields with .describe()
});

export const getCustomerSchema = z.object({
  id: z.string().describe("QuickBooks customer ID")
});

export const updateCustomerSchema = z.object({
  Id: z.string().describe("QuickBooks customer ID"),
  SyncToken: z.string().describe("Concurrency token (get via get_customer first)"),
  // ... updatable fields
});

export const searchCustomerSchema = z.object({
  criteria: searchCriteriaSchema
});
```

### 5.3 Index (`schemas/index.ts`)

Re-exports everything for convenience:

```typescript
export * from "./shared";
export * from "./customers";
export * from "./invoices";
// ... one line per entity
```

---

## 6. Resources (`resources/index.ts`)

Resources expose read-only context. For QBO, useful resources include:

```typescript
import type { FastMCP } from "fastmcp";

export function registerResources(server: FastMCP) {
  // List of all supported entity types and their available operations
  server.addResource({
    uri: "qbo://entities",
    name: "QuickBooks Entities",
    description: "All supported entity types and their CRUD capabilities",
    mimeType: "application/json",
    async load() {
      return {
        text: JSON.stringify({
          entities: [
            { name: "Customer", tools: ["create_customer", "get_customer", "update_customer", "delete_customer", "search_customers"] },
            { name: "Invoice", tools: ["create_invoice", "get_invoice", "update_invoice", "search_invoices"] },
            // ... all 11 entities
          ]
        }, null, 2)
      };
    }
  });

  // Search syntax help
  server.addResource({
    uri: "qbo://search-guide",
    name: "Search Syntax Guide",
    description: "How to use search tools with filters, pagination, and sorting",
    mimeType: "text/markdown",
    async load() {
      return {
        text: `# QuickBooks Search Guide\n\n## Simple Search\n...`
      };
    }
  });
}
```

---

## 7. Prompts (`prompts/index.ts`)

```typescript
import type { FastMCP } from "fastmcp";

export function registerPrompts(server: FastMCP) {
  server.addPrompt({
    name: "accounting-guide",
    description: "Guide to common accounting operations in QuickBooks",
    arguments: [],
    async load() {
      return {
        messages: [{
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# QuickBooks Accounting Guide\n\n## Common Workflows\n\n### Creating an Invoice\n1. Search for the customer (or create one)\n2. Search for items to include\n3. Create the invoice with line items\n\n### Recording a Bill Payment\n1. Search for the bill\n2. Get the bill details (for Amount and SyncToken)\n3. Create a bill payment referencing the bill\n\n...`
          }
        }]
      };
    }
  });
}
```

---

## 8. QuickBooks Client Adaptation

The `QuickbooksClient` class stays mostly the same. Key changes:

1. **Replace `console.log/error`** with `logger.info/error` from `utils/logger.ts`
2. **Keep the singleton pattern** and OAuth logic intact
3. **Keep the browser-based OAuth flow** for initial token acquisition
4. **Keep the token refresh logic** before each API call
5. **Export the class properly** for import in tool files

```typescript
// src/clients/quickbooks-client.ts
import { logger } from "../utils/logger";

export class QuickbooksClient {
  private static instance: QuickbooksClient;
  // ... rest of the class stays the same, but replace:
  //   console.log → logger.info
  //   console.error → logger.error
}
```

### 8.1 OAuth in Containerized / Remote Environments

The current OAuth flow opens a browser on the host machine and listens on `localhost:8000` for the callback. This only works when running locally. For containerized or remote deployments:

1. **Pre-provision tokens locally first.** Run the server once on your local machine with `--stdio` or `npm run auth`. This triggers the browser OAuth flow, exchanges the code, and writes `QUICKBOOKS_REFRESH_TOKEN` and `QUICKBOOKS_REALM_ID` to `.env`. Then pass those values as environment variables to the container.

2. **Tokens must already exist in env when running in Docker.** The container should never attempt the browser-based flow. Add a guard in `authenticate()`:
   ```typescript
   if (!this.refreshToken && isContainerEnvironment()) {
     throw new AuthenticationError(
       "QUICKBOOKS_REFRESH_TOKEN is required when running in a container. " +
       "Run the auth flow locally first: npm run auth"
     );
   }
   ```

3. **Refresh token rotation.** Intuit rotates refresh tokens — each refresh returns a new one. In the current design, the new token is written to `.env` on disk. In a container, that file is ephemeral. Two options:
   - **Stateless approach (simpler)**: Accept that the container uses the same refresh token until it's rotated out. Re-provision periodically by running the auth flow locally. Intuit refresh tokens are valid for 100 days.
   - **External store (more robust)**: Save rotated tokens to an external secret store (AWS Secrets Manager, Vault, etc.) and read from there on startup. Only do this if you need long-running unattended deployments.

---

## 9. Deployment Files

### 9.1 Dockerfile

FastMCP's httpStream transport handles SSE and HTTP natively — no reverse proxy needed. Keep the Dockerfile simple: just Node.js serving directly.

If you later need TLS termination, rate limiting, or other edge concerns, add a reverse proxy (nginx, Caddy, cloud load balancer) **outside** the container rather than bundling it in.

```dockerfile
# syntax=docker/dockerfile:1
# QuickBooks Online MCP Server
#
# Build:  docker build -t qbo-mcp-server .
# Run:    docker run -p 3000:3000 --env-file .env qbo-mcp-server

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcpuser

COPY --from=deps --chown=mcpuser:nodejs /app/node_modules ./node_modules
COPY --chown=mcpuser:nodejs package.json ./
COPY --chown=mcpuser:nodejs dist ./dist

USER mcpuser

ENV MCP_TRANSPORT=http
ENV MCP_PORT=3000
ENV MCP_LOG_LEVEL=info

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js", "--http"]
```

### 9.2 Docker Compose (`docker-compose.yml`)

```yaml
# Docker Compose for QBO MCP Server
#
# Usage:
#   Start:  docker compose up
#   Build:  docker compose build
#   Stop:   docker compose down

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - MCP_TRANSPORT=http
      - MCP_PORT=3000
      - MCP_LOG_LEVEL=info
    restart: unless-stopped
```

### 9.3 Environment Variables (`.env.example`)

```env
# ─── QuickBooks API (required) ───
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_ENVIRONMENT=sandbox    # or "production"

# ─── QuickBooks tokens (set automatically after first OAuth flow) ───
QUICKBOOKS_REFRESH_TOKEN=
QUICKBOOKS_REALM_ID=

# ─── MCP Server ───
MCP_TRANSPORT=stdio               # "stdio" or "http"
MCP_PORT=3000                      # HTTP port (when transport=http)
MCP_LOG_LEVEL=info                 # "debug", "info", "warn", "error"
```

---

## 10. Conversion Checklist

### Phase 1: Scaffold & Utilities

- [ ] Install `fastmcp` (pin to `^1.x` — check [npm](https://www.npmjs.com/package/fastmcp) for latest stable)
- [ ] Remove `@modelcontextprotocol/sdk` from dependencies (FastMCP replaces it entirely)
- [ ] Keep `zod` (already a dependency), `node-quickbooks`, `intuit-oauth`, `dotenv`, `open`
- [ ] Add `tsx` as a dev dependency for `npm run dev` scripts
- [ ] Create directory structure from section 2
- [ ] Create `types.ts` with `TransportMode` and `ServerConfig`
- [ ] Create `utils/logger.ts` (copy from section 3.4)
- [ ] Create `utils/errors.ts` (copy from section 3.5)
- [ ] Create `utils/with-logging.ts` (copy from section 3.2.1)
- [ ] Move `build-quickbooks-search-criteria.ts` to `utils/search.ts`

### Phase 2: Server Core

- [ ] Create `server.ts` with FastMCP setup, system prompt, and tool wrapper (section 3.2)
- [ ] Create `index.ts` entry point (section 3.1)
- [ ] Adapt `clients/quickbooks-client.ts` — replace console.log with logger

### Phase 3: Schema Migration

- [ ] Create `schemas/shared.ts` with reusable schemas (search criteria, address, entity ref, line items)
- [ ] Create one schema file per entity: `schemas/customers.ts`, `schemas/invoices.ts`, etc.
- [ ] Move each entity's Zod schemas from the old inline tool files, add `.describe()` to every field
- [ ] Create `schemas/index.ts` re-exporting all schemas
- [ ] Standardize all tool names to `snake_case` (fix `create-bill` → `create_bill`)

### Phase 4: Tool Migration (one entity at a time)

For each of the 11 entities:
- [ ] Create `tools/{entity}.ts` with `register{Entity}Tools(server: FastMCP)`
- [ ] Merge each tool definition + handler into a single `server.addTool(withLogging({ ... }))` call
- [ ] Import schema from `schemas/{entity}.ts`
- [ ] Use FastMCP's built-in `log` (from execute context) for client-visible logging inside handlers
- [ ] Add `annotations: { readOnlyHint: true }` to get and search tools
- [ ] Return `JSON.stringify({ success: true/false, result/error })`

Entity migration order (suggested):
1. `customers.ts` (5 tools) — start here as a template
2. `invoices.ts` (4 tools)
3. `items.ts` (4 tools)
4. `accounts.ts` (3 tools)
5. `bills.ts` (5 tools)
6. `bill-payments.ts` (5 tools)
7. `vendors.ts` (5 tools)
8. `employees.ts` (4 tools)
9. `estimates.ts` (5 tools)
10. `journal-entries.ts` (5 tools)
11. `purchases.ts` (5 tools)

### Phase 5: Resources & Prompts

- [ ] Create `resources/index.ts` with entity listing and search guide
- [ ] Create `prompts/index.ts` with accounting workflow guidance

### Phase 6: Cleanup

- [ ] Delete `src/server/` directory (replaced by `server.ts`)
- [ ] Delete `src/helpers/` directory (replaced by `utils/`)
- [ ] Delete all old individual tool files from `src/tools/{entity}/{action}-{entity}.tool.ts`
- [ ] Delete `src/handlers/` directory entirely
- [ ] Delete `src/types/tool-definition.ts` and `src/types/tool-response.ts`
- [ ] Delete old type declarations if no longer needed (`intuit-oauth.d.ts`, `node-quickbooks.d.ts`, `open.d.ts`) — check if `fastmcp` or updated `@types/*` packages cover them
- [ ] Verify `package.json` dependencies:
  - Added: `fastmcp`
  - Removed: `@modelcontextprotocol/sdk`
  - Kept: `zod`, `node-quickbooks`, `intuit-oauth`, `dotenv`, `open`
  - Dev added: `tsx` (for `npm run dev` scripts)

### Phase 7: Deployment

- [ ] Create `Dockerfile` (section 9.1)
- [ ] Create `docker-compose.yml` (section 9.2)
- [ ] Create `.env.example` (section 9.3)
- [ ] Update `package.json` scripts:
  ```json
  {
    "scripts": {
      "build": "tsc",
      "start": "node dist/index.js",
      "start:stdio": "node dist/index.js --stdio",
      "start:http": "MCP_TRANSPORT=http node dist/index.js --http",
      "dev": "tsx src/index.ts --stdio",
      "dev:http": "MCP_TRANSPORT=http tsx src/index.ts --http"
    }
  }
  ```

### Phase 8: Testing

The original project has no tests. The new architecture makes testing straightforward — each entity file is a pure function that registers tools on a server instance.

- [ ] Add a test framework (`vitest` recommended — works well with ESM and TypeScript)
- [ ] **Unit tests for schemas**: Verify Zod schemas accept valid QBO data and reject invalid input
  ```typescript
  import { describe, it, expect } from "vitest";
  import { createCustomerSchema } from "../schemas/customers";

  describe("createCustomerSchema", () => {
    it("requires DisplayName", () => {
      const result = createCustomerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it("accepts valid customer data", () => {
      const result = createCustomerSchema.safeParse({ DisplayName: "Test Co" });
      expect(result.success).toBe(true);
    });
  });
  ```
- [ ] **Unit tests for `utils/`**: Test `buildQuickbooksSearchCriteria`, `formatError`, `withLogging`
- [ ] **Integration smoke test**: Create a FastMCP instance via `createServer()`, verify all 50 tools are registered (check `server.tools` or similar)
- [ ] Add `"test": "vitest run"` to `package.json` scripts

### Phase 9: Verification

- [ ] Test stdio transport: `npm run dev`
- [ ] Test HTTP transport: `npm run dev:http`
- [ ] Test each entity's CRUD tools via Claude Desktop or MCP Inspector
- [ ] Test Docker build and deployment
- [ ] Verify health endpoint responds at `/health`

---

## 11. Key Differences from the Reference Architecture

The reference MCP (Mama Insurance) has features that the QBO MCP does **not need**:

| Feature | Mama Insurance MCP | QBO MCP | Why |
|---------|-------------------|---------|-----|
| Session management | Yes (multi-step flow) | **No** | QBO tools are stateless — each tool is independent |
| Redis persistence | Yes (session survival) | **No** | No sessions to persist |
| Step dependencies | Yes (quote → details → plans → ...) | **No** | No ordered flow |
| Progression tracking | Yes (audit trail) | **No** | No multi-step flow |
| `markStepCompleted` | Yes | **No** | No steps |
| MCP client auth (OAuth 2.1) | Yes | **Optional** | Add if deploying as remote HTTP server |
| Payment integration (Stripe) | Yes | **No** | Not applicable |

**Do NOT implement** session management, Redis, or step validation for the QBO MCP. Every tool should be stateless: authenticate against QBO, execute the operation, return the result.

---

## 12. Common Pitfalls

1. **Don't use `console.log`** — Use the stderr `logger` for server-level logging, and FastMCP's built-in `log` (from execute context) for client-visible logging inside tools. Writing to stdout corrupts the stdio JSON-RPC stream.
2. **Don't keep side-effect registration** — Use explicit `register*Tools(server)` functions
3. **Don't keep separate tool + handler files** — Consolidate into one file per entity
4. **Don't forget `.describe()` on Zod fields** — The LLM uses these to understand what data to provide
5. **Don't mix `snake_case` and `kebab-case`** in tool names — Standardize on `snake_case`
6. **Don't return raw objects from tools** — Always `JSON.stringify()` the response
7. **Don't forget `annotations: { readOnlyHint: true }`** on get/search tools
8. **Don't import `@modelcontextprotocol/sdk`** — It's fully replaced by `fastmcp`
9. **Don't add session management** — QBO tools are stateless, keep them that way
10. **Don't forget `withLogging()`** — Wrap every `server.addTool()` call for consistent stderr observability across all 50 tools
11. **Don't monkey-patch `server.addTool`** — Use the `withLogging()` pure function wrapper instead. Monkey-patching breaks if FastMCP changes internals across versions.
12. **Don't put all schemas in one file** — Split into per-entity files mirroring the tool structure. A single file with 50 schemas becomes hard to navigate.
13. **Don't bundle nginx/supervisor in Docker** — FastMCP serves HTTP directly. Add a reverse proxy externally only if you need TLS or rate limiting.
14. **Don't assume the browser OAuth flow works in containers** — Pre-provision `QUICKBOOKS_REFRESH_TOKEN` and `QUICKBOOKS_REALM_ID` locally before deploying to Docker (see section 8.1).
