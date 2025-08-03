"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "../[eventSlug]/input";
import clsx from "clsx";
import { useFormState } from "react-dom";
import { loginAction } from "../actions/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/";
  const [state, formAction] = useFormState(loginAction, null);

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Access Required
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Please enter the password to access this site
        </p>
      </div>

      <form className="mt-8 space-y-6" action={formAction}>
        <input type="hidden" name="redirect" value={redirectTo} />

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter password"
            error={!!state?.error}
            errorMessage={state?.error}
            className="w-full"
          />
        </div>

        <div>
          <button
            type="submit"
            className={clsx(
              "group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500",
              "bg-rose-600 hover:bg-rose-700"
            )}
          >
            Access Site
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
