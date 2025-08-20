"use client";

import { EventProvider } from "@/app/context";
import type { EventContextType } from "@/app/context";

export function EventProviderWrapper({
  eventContextValue,
  children,
}: {
  eventContextValue: Omit<
    EventContextType,
    "localSessions" | "userBusySessions" | "rsvpdForSession" | "updateRsvp"
  >;
  children: React.ReactNode;
}) {
  return <EventProvider value={eventContextValue}>{children}</EventProvider>;
}
