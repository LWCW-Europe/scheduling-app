"use client";
import Cookies from "js-cookie";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import type {
  Event,
  Day,
  Session,
  Location,
  Guest,
  Rsvp,
} from "@/db/repositories/interfaces";
import { Vote, voteChoiceToEmoji } from "@/app/votes";

export type DayWithSessions = Day & { sessions: Session[] };

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
  days: DayWithSessions[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
  rsvps: Rsvp[];
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

export interface VotesContextType {
  votes: Vote[];
  setVotes: (votes: Vote[]) => void;
  addVote: (vote: Vote) => void;
  removeVote: (proposalId: string) => void;
  updateVote: (proposalId: string, choice: Vote["choice"]) => void;
  hasVoted: (proposalId: string) => boolean;
  getVote: (proposalId: string) => Vote | undefined;
  proposalVoteEmoji: (proposalId: string) => string;
  isLoading: boolean;
}

export const VotesContext = createContext<VotesContextType>({
  votes: [],
  setVotes: () => {},
  addVote: () => {},
  removeVote: () => {},
  updateVote: () => {},
  hasVoted: () => false,
  getVote: () => undefined,
  proposalVoteEmoji: () => "",
  isLoading: false,
});

export function UserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: string | null;
}) {
  const [user, setUser] = useState<string | null>(initialUser);

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
  const valueSessions = value.days.flatMap((d) => d.sessions);
  // value.rsvps seeds the initial state once. The user-change effect below
  // is the only authoritative source of subsequent updates (plus optimistic
  // mutations in updateRsvp). Server-side revalidation is not used for RSVPs.
  const [rsvps, setRsvps] = useState<Rsvp[]>(value.rsvps);
  // contains all optimistic updates
  const [localSessions, setLocalSessions] = useState<Session[]>(valueSessions);

  // Fetch RSVPs when user changes
  useEffect(() => {
    const fetchUserRsvps = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/rsvps?user=${user}`);
          if (response.ok) {
            const userRsvps = (await response.json()) as Rsvp[];
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
      const sessionsWithRSVP = rsvps.map((r) => r.sessionId);
      return valueSessions.filter(
        (ses) =>
          sessionsWithRSVP.includes(ses.id) ||
          ses.hosts.some((h) => h.id === user)
      );
    } else {
      return [];
    }
  }

  const rsvpdForSession = (sessionId: string) => {
    return rsvps.some((rsvp) => rsvp.sessionId === sessionId);
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
        if (session.id === sessionId) {
          return {
            ...session,
            numRsvps: session.numRsvps + countChange,
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
              !(rsvp.guestId === guestId && rsvp.sessionId === sessionId)
          )
        );
      } else {
        // Add RSVP
        const newRsvp: Rsvp = { id: "", guestId, sessionId };
        setRsvps((prevRsvps) => [...prevRsvps, newRsvp]);
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

export function VotesProvider({
  children,
  eventSlug,
}: {
  children: ReactNode;
  eventSlug: string;
}) {
  const { user } = useContext(UserContext);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Convert eventSlug to eventName (simple conversion for now)
  const eventName = eventSlug.replace(/-/g, " ");

  useEffect(() => {
    const fetchVotes = async () => {
      if (!user) {
        setVotes([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/votes?user=${user}&event=${eventName}`
        );
        if (response.ok) {
          const fetchedVotes = (await response.json()) as Vote[];
          setVotes((prev) => {
            // Preserve optimistic votes not yet reflected on the server
            const optimistic = prev.filter(
              (pv) =>
                !fetchedVotes.some(
                  (fv) =>
                    fv.proposalId === pv.proposalId && fv.guestId === pv.guestId
                )
            );
            return [...fetchedVotes, ...optimistic];
          });
        } else {
          console.error("Failed to fetch votes");
          setVotes([]);
        }
      } catch (error) {
        console.error("Error fetching votes:", error);
        setVotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVotes();
  }, [user, eventName]);

  const addVote = (vote: Vote) => {
    setVotes((prev) => {
      const existingIndex = prev.findIndex(
        (v) => v.proposalId === vote.proposalId && v.guestId === vote.guestId
      );
      if (existingIndex >= 0) {
        // Update existing vote
        const newVotes = [...prev];
        newVotes[existingIndex] = vote;
        return newVotes;
      } else {
        // Add new vote
        return [...prev, vote];
      }
    });
  };

  const removeVote = (proposalId: string) => {
    setVotes((prev) =>
      prev.filter((v) => !(v.proposalId === proposalId && v.guestId === user))
    );
  };

  const updateVote = (proposalId: string, choice: Vote["choice"]) => {
    if (!user) return;

    setVotes((prev) => {
      const existingIndex = prev.findIndex(
        (v) => v.proposalId === proposalId && v.guestId === user
      );
      if (existingIndex >= 0) {
        const newVotes = [...prev];
        newVotes[existingIndex] = { ...newVotes[existingIndex], choice };
        return newVotes;
      } else {
        // Add new vote if none exists
        return [...prev, { id: "", proposalId, guestId: user, choice }];
      }
    });
  };

  const hasVoted = (proposalId: string) => {
    return votes.some((v) => v.proposalId === proposalId && v.guestId === user);
  };

  const getVote = (proposalId: string) => {
    return votes.find((v) => v.proposalId === proposalId && v.guestId === user);
  };

  const proposalVoteEmoji = (proposalId: string) => {
    const choice = getVote(proposalId)?.choice;
    return choice ? voteChoiceToEmoji(choice) : "-";
  };

  const contextValue: VotesContextType = {
    votes,
    setVotes,
    addVote,
    removeVote,
    updateVote,
    hasVoted,
    getVote,
    proposalVoteEmoji,
    isLoading,
  };

  return (
    <VotesContext.Provider value={contextValue}>
      {children}
    </VotesContext.Provider>
  );
}
