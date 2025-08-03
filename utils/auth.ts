import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "site-auth";
const AUTH_COOKIE_VALUE = "authenticated";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

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

export function isAuthenticated(request: NextRequest): boolean {
  if (!isPasswordProtectionEnabled()) {
    return true; // No protection if password not set
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  return authCookie?.value === AUTH_COOKIE_VALUE;
}

export function createAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: AUTH_COOKIE_VALUE,
    options: {
      maxAge: COOKIE_MAX_AGE,
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

export function requireAuth(request: NextRequest): NextResponse | null {
  if (!isPasswordProtectionEnabled()) {
    return null; // No protection needed
  }

  if (isAuthenticated(request)) {
    return null; // Already authenticated
  }

  // Redirect to login page
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.redirect(loginUrl);
}
