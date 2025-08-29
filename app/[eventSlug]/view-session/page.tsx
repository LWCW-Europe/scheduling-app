import { ViewSession } from "./view-session";

export default function ViewSessionPage({
  params,
}: {
  params: { eventSlug: string };
  searchParams: { sessionID: string };
}) {
  const { eventSlug } = params;
  return (
    <div className="container mx-auto px-4 py-8">
      <ViewSession eventSlug={eventSlug} showBackBtn={true} />
    </div>
  );
}
