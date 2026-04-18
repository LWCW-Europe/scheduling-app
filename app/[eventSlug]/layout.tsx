import { VotesProvider } from "@/app/context";
import { Suspense } from "react";
import { EventLayoutContent } from "./layout-content";

export default async function EventLayout({
  modal,
  children,
  params,
}: {
  modal: React.ReactNode;
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  return (
    <VotesProvider eventSlug={eventSlug}>
      <Suspense fallback={<div>Loading...</div>}>
        <EventLayoutContent eventSlug={eventSlug}>
          {modal}
          {children}
          <div id="modal-root" />
        </EventLayoutContent>
      </Suspense>
    </VotesProvider>
  );
}
