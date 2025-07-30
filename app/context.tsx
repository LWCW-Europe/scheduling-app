"use client";
import Cookies from "js-cookie";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
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

export interface EventContextType {
  event: Event | null;
  days: Day[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
  rsvps: RSVP[];
  rsvpdForSession: (sessionId: string) => boolean;
  localSessions: Session[];
  userBusySessions: () => Session[];
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
  localSessions: [],
  userBusySessions: () => [],
  rsvpdForSession: () => false,
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
  value: Omit<
    EventContextType,
    "localSessions" | "userBusySessions" | "rsvpdForSession" | "updateRsvp"
  >;
}) {
  const { user } = useContext(UserContext);
  const valueSessions = value.days.map((d) => d.Sessions).flat();
  const [rsvps, setRsvps] = useState<RSVP[]>(value.rsvps);
  // contains all optimistic updates
  const [localSessions, setLocalSessions] = useState<Session[]>(valueSessions);

  useEffect(() => {
    setRsvps(value.rsvps);
  }, [value.rsvps]);

  // Fetch RSVPs when user changes
  useEffect(() => {
    const fetchUserRsvps = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/rsvps?user=${user}`);
          if (response.ok) {
            const userRsvps = (await response.json()) as RSVP[];
            setRsvps(userRsvps);
          }
        } catch (error) {
          console.error("Error fetching user RSVPs:", error);
        }
      } else {
        // Reset RSVPs when user logs out
        setRsvps([]);
      }
    };

    void fetchUserRsvps();
  }, [user]);

  function userBusySessions() {
    if (user) {
      const sessionsWithRSVP = rsvps.map((r) => r.Session).flat();
      return valueSessions.filter(
        (ses) => sessionsWithRSVP.includes(ses.ID) || ses.Hosts?.includes(user)
      );
    } else {
      return [];
    }
  }

  const rsvpdForSession = (sessionId: string) => {
    return rsvps.some(
      (rsvp) => rsvp.Session && rsvp.Session.includes(sessionId)
    );
  };

  // update RSVPs optimistically
  const updateRsvp = async (
    guestId: string,
    sessionId: string,
    remove: boolean
  ) => {
    try {
      const countChange = remove ? -1 : 1;
      const newSessions = localSessions.map((session) => {
        if (session.ID === sessionId) {
          return {
            ...session,
            ["Num RSVPs"]: session["Num RSVPs"] + countChange,
          };
        } else {
          return session;
        }
      });
      setLocalSessions(newSessions);
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
        setLocalSessions(valueSessions);
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error updating RSVP:", error);
      setRsvps(value.rsvps);
      setLocalSessions(valueSessions);
      return false;
    }
  };

  const contextValue: EventContextType = {
    ...value,
    rsvps,
    localSessions,
    userBusySessions,
    rsvpdForSession,
    updateRsvp,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}
