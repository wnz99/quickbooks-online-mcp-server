import { afterEach, expect, it, vi } from "vitest";
import net from "node:net";
import { startServer } from "../src/server";

afterEach(() => vi.unstubAllEnvs());

async function unusedPort(): Promise<number> {
  const probe = net.createServer();
  await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
  const address = probe.address() as net.AddressInfo;
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return address.port;
}

it("serves hosted pages before connecting, protects MCP and OAuth, and preserves all tools", async () => {
  vi.stubEnv("MCP_API_KEY", "fixture-server-key");
  vi.stubEnv("QUICKBOOKS_CLIENT_ID", "fixture-client");
  vi.stubEnv("QUICKBOOKS_CLIENT_SECRET", "fixture-client-secret");
  vi.stubEnv("QUICKBOOKS_REDIRECT_URI", "https://example.test/callback");
  const port = await unusedPort();
  const server = await startServer({ transport: "http", port, logLevel: "error" });
  const base = `http://127.0.0.1:${port}`;
  try {
    expect((await fetch(`${base}/health`)).status).toBe(200);
    for (const page of ["eula", "privacy", "launch", "disconnect"]) expect((await fetch(`${base}/${page}`)).status).toBe(200);
    const login = await fetch(`${base}/auth`);
    expect(login.status).toBe(200);
    expect(await login.text()).toContain('type="password"');
    expect((await fetch(`${base}/auth`, { method: "POST", body: new URLSearchParams({ api_key: "wrong" }) })).status).toBe(401);
    const authorized = await fetch(`${base}/auth`, { method: "POST", body: new URLSearchParams({ api_key: "fixture-server-key" }), redirect: "manual" });
    expect(authorized.status).toBe(302);
    expect(authorized.headers.get("set-cookie")).toContain("HttpOnly");
    expect(new URL(authorized.headers.get("location")!).searchParams.get("state")).toHaveLength(48);
    expect((await fetch(`${base}/callback?code=fixture&state=forged`)).status).toBe(400);
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
    expect((await fetch(`${base}/mcp`, { method: "POST", headers, body })).status).toBe(401);
    const listed = await fetch(`${base}/mcp`, { method: "POST", headers: { ...headers, Authorization: "Bearer fixture-server-key" }, body });
    expect(listed.status).toBe(200);
    const text = await listed.text();
    expect(text).toContain('"fetch_exchange_rate"');
    expect(text).toContain('"get_invoice_pdf"');
    expect(text).toContain('"get_report"');
  } finally {
    await server.stop();
  }
}, 15000);
