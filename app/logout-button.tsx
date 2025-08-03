"use client";

import { useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { logoutAction } from "./actions/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      // Dispatch custom event to notify other components of auth state change
      window.dispatchEvent(new CustomEvent("authStateChanged"));
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={() => void handleLogout()}
      disabled={isLoggingOut}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      title="Logout"
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
