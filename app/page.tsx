import SummaryPage from "./summary-page";
import { getEvents } from "@/db/events";
import { CONSTS } from "@/utils/constants";
import { redirect } from "next/navigation";
import { eventNameToSlug } from "@/utils/utils";

export default async function Home() {
  const events = await getEvents();
  const sortedEvents = events.sort((a, b) => {
    return new Date(a.Start).getTime() - new Date(b.Start).getTime();
  });
  if (CONSTS.MULTIPLE_EVENTS) {
    return <SummaryPage events={sortedEvents} />;
  } else {
    // Redirect to the single event page instead of rendering EventPage directly
    const eventSlug = eventNameToSlug(sortedEvents[0].Name);
    redirect(`/${eventSlug}`);
  }
}
