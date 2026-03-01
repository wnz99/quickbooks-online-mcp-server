# QuickBooks Online MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for QuickBooks Online. Provides 139 tools covering all 32 QBO entities plus reports, with full CRUD and search support.

Built with [FastMCP](https://github.com/punkpeye/fastmcp), [Bun](https://bun.sh), and the [node-quickbooks](https://github.com/mcohen01/node-quickbooks) SDK.

## Prerequisites

- [Bun](https://bun.sh) (runtime)
- A [QuickBooks Developer](https://developer.intuit.com/) account with an app configured
- OAuth 2.0 credentials (Client ID + Client Secret)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Required
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REFRESH_TOKEN=your_refresh_token
QUICKBOOKS_REALM_ID=your_realm_id
QUICKBOOKS_ENVIRONMENT=sandbox   # or "production"

# Optional
MCP_TRANSPORT=stdio              # "stdio" (default) or "http"
MCP_PORT=3000                    # HTTP port (default: 3000)
MCP_LOG_LEVEL=info               # "debug", "info", "warn", "error"
```

3. Get your credentials from the [Intuit Developer Portal](https://developer.intuit.com/):
   - Create or select an app
   - Copy the Client ID and Client Secret from the Keys section
   - Add `http://localhost:8000/callback` to the Redirect URIs

## Authentication

**If you already have a refresh token and realm ID**, add them to `.env` and you're ready to go.

**If you need to obtain tokens**, run the OAuth flow:

```bash
bun run auth
```

This starts a local server, opens your browser for QuickBooks authorization, and saves the tokens to `.env` automatically.

## Running

### stdio transport (for Claude Desktop, Cursor, etc.)

```bash
# Development (with hot reload)
bun run dev

# Production
bun run build && bun run start
```

### HTTP transport

```bash
# Development
bun run dev:http

# Production
bun run build && bun run start:http
```

The HTTP server listens on port 3000 (configurable via `MCP_PORT`) with a health check at `/health`.

### Docker

```bash
docker compose up
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "bun",
      "args": ["run", "/path/to/quickbooks-online-mcp-server/dist/index.js", "--stdio"],
      "env": {
        "QUICKBOOKS_CLIENT_ID": "your_client_id",
        "QUICKBOOKS_CLIENT_SECRET": "your_client_secret",
        "QUICKBOOKS_REFRESH_TOKEN": "your_refresh_token",
        "QUICKBOOKS_REALM_ID": "your_realm_id",
        "QUICKBOOKS_ENVIRONMENT": "sandbox"
      }
    }
  }
}
```

### Remote (HTTP transport)

If the server is running remotely (e.g., via Docker or a cloud host), use the streamable HTTP URL:

```json
{
  "mcpServers": {
    "quickbooks": {
      "url": "http://your-server-host:3000/mcp"
    }
  }
}
```

## Supported Entities

All tools follow the naming pattern `{action}_{entity}` (e.g., `create_invoice`, `search_customers`).

| Entity | create | get | update | delete | search |
| ------ | ------ | --- | ------ | ------ | ------ |
| Account | x | x | x | | x |
| Attachable | x | x | x | x | x |
| Bill | x | x | x | x | x |
| Bill Payment | x | x | x | x | x |
| Class | x | x | x | | x |
| Company Info | | x | x | | |
| Credit Memo | x | x | x | x | x |
| Customer | x | x | x | x | x |
| Department | x | x | x | | x |
| Deposit | x | x | x | x | x |
| Employee | x | x | x | | x |
| Estimate | x | x | x | x | x |
| Exchange Rate | | x | x | | |
| Invoice | x | x | x | x | x |
| Item | x | x | x | | x |
| Journal Code | x | x | x | x | x |
| Journal Entry | x | x | x | x | x |
| Payment | x | x | x | x | x |
| Payment Method | x | x | x | | x |
| Preferences | | x | x | | |
| Purchase | x | x | x | x | x |
| Purchase Order | x | x | x | x | x |
| Refund Receipt | x | x | x | x | x |
| Sales Receipt | x | x | x | x | x |
| Tax Agency | x | x | x | | x |
| Tax Code | | x | x | | x |
| Tax Rate | | x | x | | x |
| Term | x | x | x | | x |
| Time Activity | x | x | x | x | x |
| Transfer | x | | x | x | x |
| Vendor | x | x | x | x | x |
| Vendor Credit | x | x | x | x | x |

Plus `get_report` for financial reports (BalanceSheet, ProfitAndLoss, CashFlow, TrialBalance, etc.).

## Search

Search tools accept simple or advanced criteria:

```json
// Simple
{ "Name": "John" }

// Advanced
{
  "criteria": [
    { "field": "Name", "value": "John", "operator": "LIKE" },
    { "field": "Balance", "value": "0", "operator": ">" }
  ],
  "limit": 10,
  "offset": 0,
  "asc": "Name"
}
```

Supported operators: `=`, `LIKE`, `>`, `<`, `>=`, `<=`, `IN`

## Scripts

| Script | Description |
| ------ | ----------- |
| `bun run dev` | Start in stdio mode with hot reload |
| `bun run dev:http` | Start in HTTP mode with hot reload |
| `bun run build` | Compile TypeScript |
| `bun run start` | Run compiled server (stdio) |
| `bun run start:http` | Run compiled server (HTTP) |
| `bun run auth` | Run OAuth authentication flow |
| `bun run test` | Run tests |
| `bun run lint` | Lint code |
