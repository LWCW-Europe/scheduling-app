"use client";
import Cookies from "js-cookie";
import { createContext, useState, useEffect } from "react";

// Create context provider
export const UserContext = createContext<{
  user: string | null;
  setUser: ((u: string | null) => void) | null;
}>({ user: null, setUser: null });

export function Context({ children }: Readonly<{ children: React.ReactNode }>) {
  // Create current User context from cookie
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      setUser(userCookie);
    }
  }, []);

  const setCurrentUser = (user: string | null) => {
    if (user) {
      setUser(user);
      Cookies.set("user", user);
    } else {
      setUser(null);
      Cookies.remove("user");
    }
  };
  return (
    <UserContext.Provider value={{ user, setUser: setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}
