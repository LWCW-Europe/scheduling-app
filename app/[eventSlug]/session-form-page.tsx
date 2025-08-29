import { Suspense } from "react";

import { eventSlugToName } from "@/utils/utils";
import { SessionForm } from "./session-form";

export function renderSessionForm(props: { params: { eventSlug: string } }) {
  const { eventSlug } = props.params;
  const eventName = eventSlugToName(eventSlug);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="max-w-2xl mx-auto pb-24">
        <SessionForm eventName={eventName} />
      </div>
    </Suspense>
  );
}
