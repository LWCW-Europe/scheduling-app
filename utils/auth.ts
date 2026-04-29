import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "site-auth";
const COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_SEC * 1000;

export function isPasswordProtectionEnabled(): boolean {
  return !!process.env.SITE_PASSWORD;
}

export function isPasswordProtectionEnabledServer(): boolean {
  return !!process.env.SITE_PASSWORD;
}

export function verifyPassword(inputPassword: string): boolean {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return true; // No protection if password not set
  }
  return inputPassword === sitePassword;
}

const MIN_AUTH_SECRET_LENGTH = 32;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable must be set when SITE_PASSWORD is set"
    );
  }
  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters; generate one with \`openssl rand -base64 32\``
    );
  }
  return secret;
}

const encoder = new TextEncoder();

async function importHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const padded =
    s.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (s.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signCookieValue(): Promise<string> {
  const issuedAt = Date.now().toString();
  const key = await importHmacKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(issuedAt));
  return `${issuedAt}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

export async function isAuthCookieValid(
  value: string | undefined
): Promise<boolean> {
  if (!isPasswordProtectionEnabled()) return true;
  if (!value) return false;

  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  if (!/^\d+$/.test(payload)) return false;
  const issuedAt = Number(payload);
  if (!Number.isSafeInteger(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  if (age < 0 || age > COOKIE_MAX_AGE_MS) return false;

  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    sigBytes = base64UrlToBytes(sig);
  } catch {
    return false;
  }

  const key = await importHmacKey("verify");
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return isAuthCookieValid(cookie);
}

export async function createAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: await signCookieValue(),
    options: {
      maxAge: COOKIE_MAX_AGE_SEC,
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export function createLogoutCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    options: {
      maxAge: 0,
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  if (!isPasswordProtectionEnabled()) {
    return null;
  }
  if (await isAuthenticated(request)) {
    return null;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.redirect(loginUrl);
}
