import { SessionModal } from "./modal";

export default function SessionModalPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  const { eventSlug } = params;
  return <SessionModal eventSlug={eventSlug} />;
}
