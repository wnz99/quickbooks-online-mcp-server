# Upstream port

Baseline: fork `386c84c`; Intuit upstream `31a1dd5c3e170e368dbff651abbaf61aabde6ed9`.
This is a behavioral port into the fork, not a merge of upstream's SDK architecture.

| Upstream improvement | Fork owner / result |
| --- | --- |
| Refresh-token rotation, concurrent refresh, sibling recovery, expiry guidance | `src/clients/quickbooksClient.ts`; keeps lazy initialization and adds hosted OAuth state validation and browser binding |
| Configurable token store, atomic save, symlink handling | Same client; absolute host-env path; regular files atomic; symlink targets written directly |
| CRUD restrictions and unsupported input warnings | `src/utils/registerTool.ts`; every tool uses the boundary; existing JSON response format retained |
| Search envelope and date filters | Existing QueryResponse extraction retained; `search.ts` now preserves criteria with pagination |
| Bill nesting, tax/class preservation, AST behavior | Existing `bill` input retained; richer passthrough schemas and read-merge-write operation; caller SyncToken still checked |
| Deposit required fields | Fetch current deposit and merge edits before writing |
| Invoice template fields, line tax codes, estimate conversion | Additive fields on the existing `create_invoice` interface |
| Subaccounts / account reparenting | Add `parent_id`; preserve structured ParentRef in patches |
| Journal validation and passthrough | Structured create/update validation; unmodeled QBO fields survive |
| Vendor credit class/tax/billability | Already supported through raw `vendorCredit` records; no second representation added |
| Payment references and currency/rate | Already supported through raw `payment` records; tested |
| Sales transaction per-line tax | Raw estimate/creditMemo/salesReceipt/refundReceipt records already forward QBO fields; invoices extended separately |
| Time activity ItemRef/ClassRef | Already supported through raw `timeActivity` records; tested |
| Preferences | Existing `get_preferences` retained |
| General ledger and Balance Sheet | Existing `get_report` retained; corrected method mapping and parameters; raw report options already support Classes |
| Attachment file sources and metadata inference | Old `attachable` metadata input retained; additive upload fields; upstream size/MIME/containment rules; DNS pinning added for hosted use |
| Invoice PDF, budgets and missing entity methods | Additive tools in `src/tools/additional.ts`; filesystem output remains disabled without an allowlist |
| Dependency floors/audit and CI | FastMCP 4.24.1 and Zod 4.6.7 upgraded at the user's request; scoped QBO overrides, decode-uri-component security fix, cross-platform build/lint/tests and native Bun High/Critical audit gate |

Preserved fork features: FastMCP registration, entity modules, shared execution/error formatting,
snake_case names, nested QBO arguments, Bun, stdio and stateless HTTP, optional bearer authentication,
health and legal pages, prompts/resources, currency references, currency guidance, and external exchange-rate fetching.
Upstream's separate report tools and legacy hyphen/read aliases are not introduced: the existing generic report and consistent get_* interfaces remain authoritative.
GitHub Claude assistant workflows are not imported; they require repository-specific automation/secrets and do not change server behavior.

## Verification and security limits

Tests use temporary token stores and mocked QBO operations. Compatibility checks include all 139 baseline tool names and existing argument/response conventions. No live company operations run during verification.

`bun run audit:production` uses Bun's native severity filter and fails on High/Critical production advisories. The FastMCP/Zod upgrade removes the Zod 3 High advisory. One moderate Hono adapter advisory remains in the raw audit; it concerns serveStatic middleware, which this server does not use. Do not interpret a passing severity gate as a zero-advisory audit.

Zod 4 migration follows the [official migration guide](https://zod.dev/v4/changelog): record schemas supply both key and value types, search criteria remain explicitly optional, defaults and passthrough behavior have regression coverage. FastMCP 4 keeps the same stdio/HTTP and tool-facing contracts, verified through real transport tests.

Invoice PDF size is checked after the SDK buffers the response, matching upstream; the cap limits returned data, not peak download memory.
Symlink token-store writes preserve volume links but are not atomic, matching upstream.
Uploads can read explicitly allowed server directories; in HTTP mode there are no default allowed directories.
Production deployments should set `MCP_API_KEY`, use HTTPS, and mount a persistent writable token store.

Imported source attribution and license: `THIRD_PARTY_NOTICES.md` and `third_party/intuit-LICENSE`.
