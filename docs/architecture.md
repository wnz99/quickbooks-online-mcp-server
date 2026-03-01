# QuickBooks Online MCP Server - Architecture & Design Document

## Purpose

This is a **Model Context Protocol (MCP) server** that acts as a bridge between AI assistants (Claude, etc.) and the **QuickBooks Online (QBO) Accounting API**. It exposes QuickBooks operations as MCP tools, allowing an LLM to create invoices, manage customers, record journal entries, search transactions, and perform other accounting operations through natural language.

The server communicates with clients over **stdio** using JSON-RPC, following the MCP specification. It handles OAuth 2.0 authentication against Intuit's API, translates tool calls into QuickBooks REST API requests, and returns structured results back to the LLM.

---

## High-Level Data Flow

```
AI Assistant (Claude, etc.)
        │
        │  JSON-RPC over stdio
        ▼
┌─────────────────────────────┐
│   StdioServerTransport      │  ← @modelcontextprotocol/sdk
│   (stdin / stdout)          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   McpServer                 │  ← Singleton, registers 50 tools
│   (tool dispatch)           │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Tool Definition           │  ← Zod schema validation
│   (e.g. CreateInvoiceTool)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Handler Function          │  ← Business logic, Promise-wraps SDK
│   (e.g. createInvoice)      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   QuickbooksClient          │  ← OAuth 2.0 auth, token refresh
│   (singleton)               │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   node-quickbooks SDK       │  ← Callback-based QBO REST wrapper
│   + intuit-oauth            │
└────────────┬────────────────┘
             │  HTTPS
             ▼
┌─────────────────────────────┐
│   QuickBooks Online API     │  ← Intuit's REST API
│   (sandbox or production)   │
└─────────────────────────────┘
```

---

## Project Structure

```
src/
├── index.ts                          # Entry point: creates transport, connects server
├── server/
│   └── qbo-mcp-server.ts            # Singleton McpServer factory
├── clients/
│   └── quickbooks-client.ts          # OAuth 2.0 client, token management, SDK init
├── tools/
│   ├── accounts/                     # 3 tools (create, update, search)
│   ├── bills/                        # 5 tools (CRUD + search)
│   ├── bill-payments/                # 5 tools (CRUD + search)
│   ├── customers/                    # 5 tools (CRUD + search)
│   ├── employees/                    # 4 tools (create, get, update, search)
│   ├── estimates/                    # 5 tools (CRUD + search)
│   ├── invoices/                     # 4 tools (create, read, update, search)
│   ├── items/                        # 4 tools (create, read, update, search)
│   ├── journal-entries/              # 5 tools (CRUD + search)
│   ├── purchases/                    # 5 tools (CRUD + search)
│   └── vendors/                      # 5 tools (CRUD + search)
├── handlers/
│   ├── accounts/                     # Matching handler for each tool
│   ├── bills/
│   ├── bill-payments/
│   ├── customers/
│   ├── employees/
│   ├── estimates/
│   ├── invoices/
│   ├── items/
│   ├── journal-entries/
│   ├── purchases/
│   └── vendors/
├── helpers/
│   ├── register-tool.ts              # Adapts ToolDefinition to McpServer.tool()
│   ├── build-quickbooks-search-criteria.ts  # Translates search params to SDK format
│   └── format-error.ts              # Normalizes errors to strings
└── types/
    ├── tool-definition.ts            # ToolDefinition<T> interface
    ├── tool-response.ts              # ToolResponse<T> interface
    ├── intuit-oauth.d.ts             # Type declarations for intuit-oauth
    ├── node-quickbooks.d.ts          # Type declarations for node-quickbooks
    └── open.d.ts                     # Type declarations for open package
```

---

## Core Components

### 1. Entry Point (`src/index.ts`)

Creates a `StdioServerTransport` and connects it to the singleton `McpServer`. This is the process entry point — the compiled JS file runs as a child process spawned by the MCP client.

```
dotenv.config()
server = QuickbooksMCPServer.GetServer()
transport = new StdioServerTransport()
server.connect(transport)
```

### 2. MCP Server (`src/server/qbo-mcp-server.ts`)

A **singleton** `McpServer` instance (from `@modelcontextprotocol/sdk`). Initialized with server metadata and `tools` capability. All 50 tools are registered against this single instance at import time via side effects.

### 3. QuickBooks Client (`src/clients/quickbooks-client.ts`)

Manages the entire lifecycle of QuickBooks API access:

- **OAuth 2.0 Flow**: Two modes:
  1. **Token mode** — If `QUICKBOOKS_REFRESH_TOKEN` and `QUICKBOOKS_REALM_ID` are in `.env`, refreshes the access token directly.
  2. **Browser-based OAuth** — Starts an HTTP server on port 8000, opens the browser to Intuit's authorization URL, intercepts the callback, exchanges the code for tokens, and persists `QUICKBOOKS_REFRESH_TOKEN` and `QUICKBOOKS_REALM_ID` back to `.env`.

- **Token Refresh**: Tracks `accessTokenExpiry` (default 3600s). Before each API call, checks if the token is expired and refreshes if needed.

- **SDK Instantiation**: Creates a `node-quickbooks` instance configured with the current access token, realm ID, and environment (sandbox/production).

- **Lazy Authentication**: `authenticate()` is called at the start of every handler invocation. Uses an `isAuthenticating` mutex flag to prevent concurrent auth attempts.

### 4. Tool Definitions (`src/tools/`)

Each tool is a file that exports a `ToolDefinition<T>` object:

```typescript
interface ToolDefinition<T extends z.ZodType> {
  name: string;          // Tool name (e.g. "create_customer")
  description: string;   // Human-readable description for the LLM
  schema: T;             // Zod schema for input validation
  handler: ToolCallback; // Async function that executes the tool
}
```

The tool file:
1. Defines a Zod schema describing the input parameters.
2. Defines a handler function that calls the corresponding handler module.
3. Calls `RegisterTool(server, toolDefinition)` as a side effect at module load.

### 5. Handlers (`src/handlers/`)

Each handler is an async function that:
1. Calls `QuickbooksClient.authenticate()` to ensure a valid SDK instance.
2. Wraps the callback-based `node-quickbooks` SDK method in a `new Promise`.
3. Returns a `ToolResponse<T>` with either the result or an error.

```typescript
interface ToolResponse<T> {
  result: T | null;
  isError: boolean;
  error: string | null;
}
```

### 6. Helpers

- **`RegisterTool`** — Adapts the `ToolDefinition` interface to the `McpServer.tool()` API. Wraps the schema in `{ params: schema }` as required by the SDK.

- **`buildQuickbooksSearchCriteria`** — Translates three possible input formats into the format expected by `node-quickbooks` find methods:
  - Simple object: `{ Name: "John" }` — passed through.
  - Array of filters: `[{ field: "Name", value: "John", operator: "=" }]`
  - Advanced options object with `filters`, `limit`, `offset`, `asc`, `desc`, `count`, `fetchAll`.

- **`formatError`** — Normalizes `unknown` errors into strings for consistent error reporting.

---

## QuickBooks Online Integration Details

### Authentication

| Aspect | Detail |
|---|---|
| Protocol | OAuth 2.0 (Authorization Code flow) |
| OAuth Library | `intuit-oauth` v4.0.0 |
| Redirect URI | `http://localhost:8000/callback` (hardcoded) |
| Scopes | `com.intuit.quickbooks.accounting` |
| Token Storage | `.env` file (QUICKBOOKS_REFRESH_TOKEN, QUICKBOOKS_REALM_ID) |
| Token Refresh | Automatic before each tool call if expired |
| Access Token TTL | ~3600 seconds |

### API SDK

| Aspect | Detail |
|---|---|
| SDK | `node-quickbooks` v2.0.43 |
| API Style | Callback-based (`(err, result) => {}`) |
| Concurrency Control | SyncToken required for updates (provided by QBO) |
| Environments | Sandbox and Production (configured via env var) |

### Supported Entities (11 types, 50 tools)

| Entity | Create | Read/Get | Update | Delete | Search |
|---|---|---|---|---|---|
| Account | x | | x | | x |
| Bill | x | x | x | x | x |
| Bill Payment | x | x | x | x | x |
| Customer | x | x | x | x | x |
| Employee | x | x | x | | x |
| Estimate | x | x | x | x | x |
| Invoice | x | x | x | | x |
| Item | x | x | x | | x |
| Journal Entry | x | x | x | x | x |
| Purchase | x | x | x | x | x |
| Vendor | x | x | x | x | x |

### QuickBooks Query Language

Search tools accept criteria that get translated into QuickBooks query format. The `buildQuickbooksSearchCriteria` helper supports:
- Field-level filtering with operators (`=`, `LIKE`, `>`, `<`, etc.)
- Pagination (`limit`, `offset`)
- Sorting (`asc`, `desc` by field name)
- Count queries
- Fetch-all (transparent pagination)

Each entity's search tool validates allowed filter fields against a whitelist.

---

## Error Handling

All errors follow the same pattern:

1. Handler wraps SDK call in try/catch.
2. SDK callback errors (first callback argument) are caught.
3. Errors are normalized via `formatError()`.
4. Handler returns `ToolResponse` with `isError: true` and error message.
5. Tool layer converts to MCP text content: `"Error message: <details>"`.

Special cases:
- **Delete Customer**: Falls back to marking the customer as `Active: false` via update if hard delete fails (QBO sometimes disallows deletes).
- **Invoice Creation**: Performs runtime type validation on numeric fields using Zod coercion.

---

## Dependencies

| Package | Version | Role |
|---|---|---|
| `@modelcontextprotocol/sdk` | 1.6.0 | MCP protocol (server, transport, types) |
| `node-quickbooks` | 2.0.43 | QuickBooks Online REST API wrapper |
| `intuit-oauth` | 4.0.0 | OAuth 2.0 for Intuit/QuickBooks |
| `zod` | 3.24.2 | Runtime schema validation for tool inputs |
| `dotenv` | 16.4.7 | Loads `.env` configuration |
| `open` | 9.1.0 | Opens browser for OAuth flow |

---

## Configuration

### Environment Variables

```env
# Required
QUICKBOOKS_CLIENT_ID=<Intuit Developer app client ID>
QUICKBOOKS_CLIENT_SECRET=<Intuit Developer app client secret>
QUICKBOOKS_ENVIRONMENT=sandbox    # or "production"

# Optional (set automatically after first OAuth flow)
QUICKBOOKS_REFRESH_TOKEN=<persisted refresh token>
QUICKBOOKS_REALM_ID=<QuickBooks company ID>
```

### MCP Client Configuration

The server is configured in the MCP client's settings (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "QUICKBOOKS_CLIENT_ID": "...",
        "QUICKBOOKS_CLIENT_SECRET": "...",
        "QUICKBOOKS_ENVIRONMENT": "sandbox"
      }
    }
  }
}
```

The MCP client spawns the server as a child process and communicates over stdio.

---

## Design Patterns & Conventions

### Patterns Used

- **Singleton**: Both `McpServer` and `QuickbooksClient` use singleton patterns.
- **Side-Effect Registration**: Tools register themselves when their module is imported. The tool files are imported from handler files or index, which triggers `RegisterTool()`.
- **Promise Wrapping**: All `node-quickbooks` callback APIs are wrapped in `new Promise` within handlers.
- **Layered Architecture**: Tool definition (schema + routing) → Handler (business logic) → Client (auth + SDK).

### Naming Conventions

| Layer | Convention | Example |
|---|---|---|
| Tool files | `{action}-{entity}.tool.ts` | `create-customer.tool.ts` |
| Handler files | `{action}-quickbooks-{entity}.handler.ts` | `create-quickbooks-customer.handler.ts` |
| Tool names | Inconsistent: mix of `snake_case` and `kebab-case` | `create_customer` vs `create-bill` |
| Directories | `kebab-case` | `bill-payments/`, `journal-entries/` |

### Known Inconsistencies

1. **Tool naming**: Some tools use `snake_case` (`create_customer`) while others use `kebab-case` (`create-bill`). There is no consistent convention.
2. **CRUD coverage**: Not all entities support all CRUD operations (e.g., Account has no read/get/delete; Employee and Invoice have no delete).
3. **No centralized tool registry**: Tools are registered via import side effects rather than an explicit registry.

---

## Build & Runtime

- **Language**: TypeScript 5.8, compiled to ES2022 modules (ESM).
- **Module System**: ESNext modules (`"type": "module"` in package.json).
- **Build**: `tsc` compiles to `dist/`, then `shx chmod +x dist/*.js` makes the entry point executable.
- **Runtime**: Node.js with the compiled `dist/index.js` as entry point.
- **No tests**: The project has no test suite.
- **No HTTP server**: The MCP server uses stdio only (no SSE/HTTP transport). The only HTTP server is the temporary one used during the OAuth callback flow.
