import { VotesProvider } from "@/app/context";
import { Suspense } from "react";
import { EventLayoutContent } from "./layout-content";

export default function EventLayout({
  modal,
  children,
  params,
}: {
  modal: React.ReactNode;
  children: React.ReactNode;
  params: { eventSlug: string };
}) {
  return (
    <VotesProvider eventSlug={params.eventSlug}>
      <Suspense fallback={<div>Loading...</div>}>
        <EventLayoutContent eventSlug={params.eventSlug}>
          {modal}
          {children}
          <div id="modal-root" />
        </EventLayoutContent>
      </Suspense>
    </VotesProvider>
  );
}
