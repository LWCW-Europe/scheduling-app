"use client";
import Cookies from "js-cookie";
import { createContext, useState, useEffect, ReactNode } from "react";
import { Event } from "@/db/events";
import { Day } from "@/db/days";
import { Session } from "@/db/sessions";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { RSVP } from "@/db/rsvps";

// User Context
export interface UserContextType {
  user: string | null;
  setUser: ((u: string | null) => void) | null;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: null,
});

// Event Context
export interface EventContextType {
  event: Event | null;
  days: Day[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
  rsvps: RSVP[];
}

export const EventContext = createContext<EventContextType>({
  event: null,
  days: [],
  sessions: [],
  locations: [],
  guests: [],
  rsvps: [],
});

export function UserProvider({ children }: { children: ReactNode }) {
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

export function EventProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: EventContextType;
}) {
  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}
