export const dynamic = "force-dynamic";

import SummaryPage from "./summary-page";
import { getRepositories } from "@/db/container";
import { CONSTS } from "@/utils/constants";
import { redirect } from "next/navigation";
import { eventNameToSlug } from "@/utils/utils";

export default async function Home() {
  const repos = getRepositories();
  const events = await repos.events.list();
  const sortedEvents = events.sort((a, b) => {
    return a.start.getTime() - b.start.getTime();
  });
  if (CONSTS.MULTIPLE_EVENTS) {
    return <SummaryPage events={sortedEvents} />;
  } else {
    const eventSlug = eventNameToSlug(sortedEvents[0].name);
    redirect(`/${eventSlug}`);
  }
}
