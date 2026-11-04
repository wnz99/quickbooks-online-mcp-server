import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";

const oauth = vi.hoisted(() => ({ refresh: vi.fn(), exchange: vi.fn() }));
vi.mock("intuit-oauth", () => ({ default: class {
  static scopes = { Accounting: "accounting" };
  refreshUsingToken = oauth.refresh;
  createToken = oauth.exchange;
  authorizeUri({ state }: { state: string }) { return `https://example.test/auth?state=${state}`; }
} }));
vi.mock("node-quickbooks", () => ({ default: class {} }));
import { QuickbooksClient } from "../src/clients/quickbooksClient";

const config = { clientId: "fixture-id", clientSecret: "fixture-secret", refreshToken: "seed", realmId: "123", environment: "production", redirectUri: "https://example.test/callback" };
beforeEach(() => { vi.clearAllMocks(); fs.writeFileSync(process.env.QUICKBOOKS_TOKEN_STORE_PATH!, ""); });
afterEach(() => vi.unstubAllEnvs());

describe("token resilience", () => {
  it("shares concurrent refresh and persists rotation before restart", async () => {
    oauth.refresh.mockResolvedValue({ token: { access_token: "access-fixture", refresh_token: "rotated", expires_in: 3600 } });
    const client = new QuickbooksClient(config);
    await Promise.all([client.authenticate(), client.authenticate(), client.authenticate()]);
    expect(oauth.refresh).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync(process.env.QUICKBOOKS_TOKEN_STORE_PATH!, "utf8")).toContain("QUICKBOOKS_REFRESH_TOKEN=rotated");
    await client.authenticate();
    expect(oauth.refresh).toHaveBeenCalledTimes(1);
  });
  it("recovers a sibling rotation after invalid_grant", async () => {
    fs.writeFileSync(process.env.QUICKBOOKS_TOKEN_STORE_PATH!, 'QUICKBOOKS_REFRESH_TOKEN="sibling" # comment\n');
    oauth.refresh.mockRejectedValueOnce(new Error("invalid_grant")).mockResolvedValueOnce({ token: { access_token: "access-fixture" } });
    await new QuickbooksClient(config).authenticate();
    expect(oauth.refresh.mock.calls.map(call => call[0])).toEqual(["seed", "sibling"]);
  });
  it("keeps transient failures retryable without substituting the disk token", async () => {
    fs.writeFileSync(process.env.QUICKBOOKS_TOKEN_STORE_PATH!, "QUICKBOOKS_REFRESH_TOKEN=stale\n");
    oauth.refresh.mockRejectedValueOnce(new Error("status code 503")).mockResolvedValueOnce({ token: { access_token: "access-fixture" } });
    const client = new QuickbooksClient(config);
    await expect(client.authenticate()).rejects.toThrow("503");
    await client.authenticate();
    expect(oauth.refresh.mock.calls.map(call => call[0])).toEqual(["seed", "seed"]);
  });
  it("fails production reauthorization without opening a local flow", async () => {
    oauth.refresh.mockRejectedValue(new Error("invalid_grant"));
    await expect(new QuickbooksClient(config).authenticate()).rejects.toThrow("Re-authorize");
  });
  it.skipIf(process.platform === "win32")("preserves a relative token-store symlink when saving rotation", async () => {
    const store = process.env.QUICKBOOKS_TOKEN_STORE_PATH!;
    fs.unlinkSync(store);
    fs.symlinkSync("target.env", store);
    oauth.refresh.mockResolvedValue({ token: { access_token: "access-fixture", refresh_token: "rotated" } });
    await new QuickbooksClient(config).authenticate();
    expect(fs.lstatSync(store).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(store, "utf8")).toContain("rotated");
    fs.unlinkSync(store);
  });
});

describe("hosted OAuth", () => {
  it("waits for a reconnect before refreshing, keeping company and tokens together", async () => {
    let resolveExchange!: (value: unknown) => void;
    oauth.exchange.mockReturnValue(new Promise(resolve => { resolveExchange = resolve; }));
    oauth.refresh.mockResolvedValue({ token: { access_token: "new-company-access", refresh_token: "new-company-rotated" } });
    const client = new QuickbooksClient(config);
    const state = new URL(client.getAuthorizationUrl()).searchParams.get("state");
    const callback = client.handleOAuthCallback(`https://example.test/callback?state=${state}&code=c&realmId=new-company`);
    const authentication = client.authenticate();
    await Promise.resolve();
    expect(oauth.refresh).not.toHaveBeenCalled();
    resolveExchange({ token: { refresh_token: "new-company-refresh" } });
    await Promise.all([callback, authentication]);
    expect(oauth.refresh).toHaveBeenCalledWith("new-company-refresh");
    const saved = fs.readFileSync(process.env.QUICKBOOKS_TOKEN_STORE_PATH!, "utf8");
    expect(saved).toContain("QUICKBOOKS_REALM_ID=new-company");
    expect(saved).toContain("QUICKBOOKS_REFRESH_TOKEN=new-company-rotated");
  });
  it("rejects unknown state before exchanging a code", async () => {
    await expect(new QuickbooksClient(config).handleOAuthCallback("https://example.test/callback?state=forged&code=c")).rejects.toThrow("state");
    expect(oauth.exchange).not.toHaveBeenCalled();
  });
  it("consumes state before awaiting exchange, preventing replay", async () => {
    const client = new QuickbooksClient(config);
    const state = new URL(client.getAuthorizationUrl()).searchParams.get("state");
    oauth.exchange.mockResolvedValue({ token: { refresh_token: "connected" } });
    const url = `https://example.test/callback?state=${state}&code=c&realmId=123`;
    await Promise.all([client.handleOAuthCallback(url), expect(client.handleOAuthCallback(url)).rejects.toThrow("state")]);
    expect(oauth.exchange).toHaveBeenCalledTimes(1);
  });
  it("expires outstanding state", async () => {
    const client = new QuickbooksClient(config);
    const state = new URL(client.getAuthorizationUrl()).searchParams.get("state");
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60 * 1000);
    await expect(client.handleOAuthCallback(`https://example.test/callback?state=${state}`)).rejects.toThrow("state");
    vi.restoreAllMocks();
  });
});
