import { EventDisplay } from "./event";
import { Suspense } from "react";

export default function EventPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventDisplay />
    </Suspense>
  );
}
