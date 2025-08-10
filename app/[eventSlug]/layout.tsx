"use client";

import { VotesProvider } from "@/app/context";

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
      {modal}
      {children}
      <div id="modal-root" />
    </VotesProvider>
  );
}
