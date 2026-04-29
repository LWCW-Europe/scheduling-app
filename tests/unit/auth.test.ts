import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isAuthCookieValid,
  createAuthCookie,
  verifyPassword,
  isPasswordProtectionEnabled,
  AUTH_COOKIE_NAME,
} from "@/utils/auth";

const VALID_SECRET = "0123456789abcdef0123456789abcdef"; // 32 chars
const OTHER_SECRET = "ffffffffffffffffffffffffffffffff"; // 32 chars, different

function withEnv(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
}

describe("isPasswordProtectionEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("false when SITE_PASSWORD unset", () => {
    withEnv({ SITE_PASSWORD: "" });
    expect(isPasswordProtectionEnabled()).toBe(false);
  });

  it("true when SITE_PASSWORD set", () => {
    withEnv({ SITE_PASSWORD: "secret" });
    expect(isPasswordProtectionEnabled()).toBe(true);
  });
});

describe("verifyPassword", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns true (no protection) when SITE_PASSWORD unset", () => {
    withEnv({ SITE_PASSWORD: "" });
    expect(verifyPassword("anything")).toBe(true);
  });

  it("rejects wrong password", () => {
    withEnv({ SITE_PASSWORD: "correct" });
    expect(verifyPassword("wrong")).toBe(false);
  });

  it("accepts correct password", () => {
    withEnv({ SITE_PASSWORD: "correct" });
    expect(verifyPassword("correct")).toBe(true);
  });
});

describe("createAuthCookie", () => {
  beforeEach(() => {
    withEnv({ SITE_PASSWORD: "pw", AUTH_SECRET: VALID_SECRET });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses the canonical cookie name", async () => {
    const c = await createAuthCookie();
    expect(c.name).toBe(AUTH_COOKIE_NAME);
  });

  it("sets httpOnly and lax sameSite", async () => {
    const c = await createAuthCookie();
    expect(c.options.httpOnly).toBe(true);
    expect(c.options.sameSite).toBe("lax");
  });

  it("sets a 7-day max-age (in seconds)", async () => {
    const c = await createAuthCookie();
    expect(c.options.maxAge).toBe(7 * 24 * 60 * 60);
  });

  it("produces a value of the form 'timestamp.signature'", async () => {
    const c = await createAuthCookie();
    expect(c.value).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
  });

  it("throws if AUTH_SECRET is missing", async () => {
    withEnv({ SITE_PASSWORD: "pw", AUTH_SECRET: "" });
    await expect(createAuthCookie()).rejects.toThrow(/AUTH_SECRET/);
  });

  it("throws if AUTH_SECRET is too short", async () => {
    withEnv({ SITE_PASSWORD: "pw", AUTH_SECRET: "short" });
    await expect(createAuthCookie()).rejects.toThrow(/at least 32/);
  });
});

describe("isAuthCookieValid", () => {
  beforeEach(() => {
    withEnv({ SITE_PASSWORD: "pw", AUTH_SECRET: VALID_SECRET });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns true when password protection is disabled (regardless of input)", async () => {
    withEnv({ SITE_PASSWORD: "" });
    expect(await isAuthCookieValid(undefined)).toBe(true);
    expect(await isAuthCookieValid("garbage")).toBe(true);
  });

  it("rejects undefined cookie", async () => {
    expect(await isAuthCookieValid(undefined)).toBe(false);
  });

  it("rejects empty cookie", async () => {
    expect(await isAuthCookieValid("")).toBe(false);
  });

  it("rejects the legacy 'authenticated' static value (replay protection)", async () => {
    expect(await isAuthCookieValid("authenticated")).toBe(false);
  });

  it("rejects cookie with no separator", async () => {
    expect(await isAuthCookieValid("nodothere")).toBe(false);
  });

  it("rejects cookie whose payload is not a plain integer", async () => {
    expect(await isAuthCookieValid("abc.signature")).toBe(false);
    expect(await isAuthCookieValid("1e10.signature")).toBe(false);
    expect(await isAuthCookieValid("0x10.signature")).toBe(false);
    expect(await isAuthCookieValid("12.5.signature")).toBe(false);
    expect(await isAuthCookieValid("-1.signature")).toBe(false);
    expect(await isAuthCookieValid(" 123.signature")).toBe(false);
  });

  it("rejects cookie whose signature is not valid base64url", async () => {
    const ts = Date.now().toString();
    expect(await isAuthCookieValid(`${ts}.!!!not_base64!!!`)).toBe(false);
  });

  it("rejects cookie with unsafe-large integer payload", async () => {
    // 2^53, just above Number.MAX_SAFE_INTEGER
    expect(await isAuthCookieValid("9007199254740993.sig")).toBe(false);
  });

  it("accepts a freshly issued cookie", async () => {
    const c = await createAuthCookie();
    expect(await isAuthCookieValid(c.value)).toBe(true);
  });

  it("rejects an expired cookie (>7 days old)", async () => {
    const realNow = Date.now;
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    Date.now = () => realNow() - eightDaysMs;
    const c = await createAuthCookie();
    Date.now = realNow;
    expect(await isAuthCookieValid(c.value)).toBe(false);
  });

  it("accepts a cookie just within the expiry window", async () => {
    const realNow = Date.now;
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    Date.now = () => realNow() - sixDaysMs;
    const c = await createAuthCookie();
    Date.now = realNow;
    expect(await isAuthCookieValid(c.value)).toBe(true);
  });

  it("rejects a future-dated cookie (negative age)", async () => {
    const realNow = Date.now;
    Date.now = () => realNow() + 60_000; // 1 minute in the future
    const c = await createAuthCookie();
    Date.now = realNow;
    expect(await isAuthCookieValid(c.value)).toBe(false);
  });

  it("rejects a cookie signed with a different AUTH_SECRET (forgery)", async () => {
    const c = await createAuthCookie();
    withEnv({ SITE_PASSWORD: "pw", AUTH_SECRET: OTHER_SECRET });
    expect(await isAuthCookieValid(c.value)).toBe(false);
  });

  it("rejects a cookie with the timestamp tampered (signature no longer matches)", async () => {
    const c = await createAuthCookie();
    const [ts, sig] = c.value.split(".");
    const tamperedTs = (Number(ts) - 1).toString();
    expect(await isAuthCookieValid(`${tamperedTs}.${sig}`)).toBe(false);
  });

  it("rejects a cookie with the signature tampered", async () => {
    const c = await createAuthCookie();
    const [ts, sig] = c.value.split(".");
    // Flip the first character of the signature to a different valid base64url char
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(await isAuthCookieValid(`${ts}.${flipped}`)).toBe(false);
  });
});
