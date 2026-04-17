import { getRepositories } from "@/db/container";

type RSVPParams = {
  sessionId: string;
  guestId: string;
  remove?: boolean;
};

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const { sessionId, guestId, remove } = (await req.json()) as RSVPParams;
  const repos = getRepositories();

  if (!remove) {
    try {
      const rsvp = await repos.rsvps.create({ sessionId, guestId });
      console.log(rsvp.id);
    } catch (err) {
      console.error(err);
      return Response.error();
    }
  } else {
    console.log("REMOVING RSVP", { sessionId, guestId });
    try {
      await repos.rsvps.deleteBySessionAndGuest(sessionId, guestId);
    } catch (err) {
      console.error(err);
      return Response.error();
    }
  }

  return Response.json({ success: true });
}
