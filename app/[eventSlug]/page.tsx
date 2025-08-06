import { EventPhase, getCurrentPhase } from "../utils/events";
import { eventSlugToName, getEventByName } from "@/db/events";
import EventPage from "./event-page";
import { redirect } from "next/navigation";

export default async function Page(props: { params: { eventSlug: string } }) {
  const { eventSlug } = props.params;
  const eventName = eventSlugToName(eventSlug);
  const event = await getEventByName(eventName);

  if (!event) {
    return "Event not found: " + eventName;
  }

  const phase = getCurrentPhase(event);

  if (phase === EventPhase.SCHEDULING) {
    return <EventPage event={event} />;
  } else if (phase === EventPhase.VOTING || phase === EventPhase.PROPOSAL) {
    redirect(`/${eventSlug}/proposals`);
  } else {
    return "Event unavailable: " + eventName;
  }
}
