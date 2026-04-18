import { Suspense } from "react";
import { cookies } from "next/headers";

import { eventSlugToName } from "@/utils/utils";
import { SessionForm } from "./session-form";
import { getRepositories } from "@/db/container";
import { CONSTS } from "@/utils/constants";

export async function renderSessionForm(props: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await props.params;
  const currentUser = (await cookies()).get("user")?.value;
  const eventName = eventSlugToName(eventSlug);
  const repos = getRepositories();

  const event = await repos.events.findByName(eventName);
  if (!event) {
    return <div>Event not found</div>;
  }

  const [days, sessions, guests, locations, allProposals] = await Promise.all([
    repos.days.listByEvent(event.id),
    repos.sessions.listByEvent(event.id),
    repos.guests.list(),
    repos.locations.listBookable(),
    repos.sessionProposals.listByEvent(event.id),
  ]);

  const filteredLocations = CONSTS.MULTIPLE_EVENTS ? locations : locations;

  const currentUserProposals = allProposals.filter(
    (p) => currentUser && p.hosts.some((h) => h.id === currentUser)
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
