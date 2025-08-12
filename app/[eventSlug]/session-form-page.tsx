import { Suspense } from "react";
import { cookies } from "next/headers";

import { getEventByName } from "@/db/events";
import { eventSlugToName } from "@/utils/utils";
import { SessionForm } from "./session-form";
import { getDaysByEvent } from "@/db/days";
import { getSessionsByEvent } from "@/db/sessions";
import { getGuestsByEvent } from "@/db/guests";
import { getBookableLocations } from "@/db/locations";
import { CONSTS } from "@/utils/constants";
import { getSessionProposalsByEvent } from "@/db/sessionProposals";

export async function renderSessionForm(props: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = props.params;
  const currentUser = cookies().get("user")?.value;
  const eventName = eventSlugToName(eventSlug);
  const [event, days, sessions, guests, locations, allProposals] =
    await Promise.all([
      getEventByName(eventName),
      getDaysByEvent(eventName),
      getSessionsByEvent(eventName),
      getGuestsByEvent(eventName),
      getBookableLocations(),
      getSessionProposalsByEvent(eventName),
    ]);
  days.forEach((day) => {
    const dayStartMillis = new Date(day.Start).getTime();
    const dayEndMillis = new Date(day.End).getTime();
    day.Sessions = sessions.filter((s) => {
      const sessionStartMillis = new Date(s["Start time"]).getTime();
      const sessionEndMillis = new Date(s["End time"]).getTime();
      return (
        dayStartMillis <= sessionStartMillis && dayEndMillis >= sessionEndMillis
      );
    });
  });
  const filteredLocations = locations.filter(
    (location) =>
      location.Bookable &&
      (!CONSTS.MULTIPLE_EVENTS ||
        (event["Location names"] &&
          event["Location names"].includes(location.Name)))
  );
  const currentUserProposals = allProposals.filter(
    (p) => currentUser && p.hosts.includes(currentUser)
  );
  const hostlessProposals = allProposals.filter((p) => p.hosts.length === 0);
  const proposals = currentUserProposals.concat(hostlessProposals);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="max-w-2xl mx-auto pb-24">
        <SessionForm
          eventName={eventName}
          days={days}
          locations={filteredLocations}
          sessions={sessions}
          guests={guests}
          proposals={proposals}
        />
      </div>
    </Suspense>
  );
}
