"use client";
import Cookies from "js-cookie";
import { createContext, useState, useEffect, ReactNode } from "react";
import { Event } from "@/db/events";
import { Day } from "@/db/days";
import { Session } from "@/db/sessions";
import { Location } from "@/db/locations";
import { Guest } from "@/db/guests";
import { RSVP } from "@/db/rsvps";

export interface UserContextType {
  user: string | null;
  setUser: ((u: string | null) => void) | null;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: null,
});

interface ApiResponse {
  success: boolean;
  rsvps?: RSVP[];
}

export interface EventContextType {
  event: Event | null;
  days: Day[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
  rsvps: RSVP[];
  getRsvpsForSession: (sessionId: string) => RSVP[];
  updateRsvp: (
    guestId: string,
    sessionId: string,
    remove: boolean
  ) => Promise<boolean>;
}

export const EventContext = createContext<EventContextType>({
  event: null,
  days: [],
  sessions: [],
  locations: [],
  guests: [],
  rsvps: [],
  getRsvpsForSession: () => [],
  updateRsvp: async () => {
    await Promise.resolve();
    return false;
  },
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
  value: Omit<EventContextType, "getRsvpsForSession" | "updateRsvp">;
}) {
  const [rsvps, setRsvps] = useState<RSVP[]>(value.rsvps);

  useEffect(() => {
    setRsvps(value.rsvps);
  }, [value.rsvps]);

  // Add the getRsvpsForSession implementation here in the client component
  const getRsvpsForSession = (sessionId: string) => {
    return rsvps.filter(
      (rsvp) => rsvp.Session && rsvp.Session.includes(sessionId)
    );
  };

  // Add function to update RSVPs optimistically
  const updateRsvp = async (
    guestId: string,
    sessionId: string,
    remove: boolean
  ) => {
    try {
      // Optimistic update
      if (remove) {
        // Remove RSVP
        setRsvps((prevRsvps) =>
          prevRsvps.filter(
            (rsvp) =>
              !(
                rsvp.Guest?.includes(guestId) &&
                rsvp.Session?.includes(sessionId)
              )
          )
        );
      } else {
        // Add RSVP
        const newRsvp: Partial<RSVP> = {
          Guest: [guestId],
          Session: [sessionId],
        };
        // Cast to RSVP since we're providing the required fields
        setRsvps((prevRsvps) => [...prevRsvps, newRsvp as RSVP]);
      }

      // Make the actual API call
      const response = await fetch("/api/toggle-rsvp", {
        method: "POST",
        body: JSON.stringify({
          guestId,
          sessionId,
          remove,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setRsvps(value.rsvps);
        return false;
      }

      // Get the actual updated data from the server
      const data = (await response.json()) as ApiResponse;
      if (data.success) {
        // Update with actual server data if provided
        if (data.rsvps) {
          setRsvps(data.rsvps);
        }
        return true;
      } else {
        // Revert optimistic update
        setRsvps(value.rsvps);
        return false;
      }
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error updating RSVP:", error);
      setRsvps(value.rsvps);
      return false;
    }
  };

  const contextValue: EventContextType = {
    ...value,
    rsvps,
    getRsvpsForSession,
    updateRsvp,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}
