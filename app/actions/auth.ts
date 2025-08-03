"use server";

import {
  verifyPassword,
  createAuthCookie,
  createLogoutCookie,
  isPasswordProtectionEnabled,
} from "@/utils/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Server actions must be async functions, even if they don't use await
// eslint-disable-next-line @typescript-eslint/require-await
export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/";

  if (!isPasswordProtectionEnabled()) {
    redirect(redirectTo);
  }

  if (!password) {
    return { error: "Password is required" };
  }

  if (verifyPassword(password)) {
    cookies().set(createAuthCookie());
    redirect(redirectTo);
  }

  return { error: "Invalid password" };
}

// Server actions must be async functions, even if they don't use await
// eslint-disable-next-line @typescript-eslint/require-await
export async function logoutAction() {
  cookies().set(createLogoutCookie());
  redirect("/");
}
