"use server";

import {
  verifyPassword,
  createAuthCookie,
  createLogoutCookie,
  isPasswordProtectionEnabled,
} from "@/utils/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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
    (await cookies()).set(createAuthCookie());
    redirect(redirectTo);
  }

  return { error: "Invalid password" };
}

export async function logoutAction() {
  (await cookies()).set(createLogoutCookie());
  redirect("/");
}
