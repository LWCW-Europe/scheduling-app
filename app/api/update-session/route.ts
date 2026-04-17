import { getRepositories } from "@/db/container";
import { prepareToInsert, validateSession } from "../session-form-utils";
import type { SessionParams } from "../session-form-utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  if (!params.id) {
    console.error("Session ID is required for update.");
    return new Response("Session ID is required", { status: 400 });
  }
  const repos = getRepositories();
  const input = prepareToInsert(params);
  const allSessions = (await repos.sessions.listScheduled()).filter(
    (s) => !input.eventId || s.eventId === input.eventId
  );
  const prevSession = allSessions.find((ses) => ses.id === params.id);
  if (prevSession === undefined) {
    const msg = `Cannot find session with ID ${params.id}`;
    return new Response(msg, { status: 404 });
  }
  if (!prevSession.attendeeScheduled || prevSession.blocker) {
    return new Response("Cannot edit via web app", { status: 400 });
  }
  const existingSessions = allSessions.filter((ses) => ses.id !== params.id);
  const newHostIds = input.hostIds;
  const sessionValid = validateSession(input, existingSessions);
  if (sessionValid) {
    try {
      const updated = await repos.sessions.update(params.id, input);
      console.log(updated.id);
    } catch (err) {
      console.error(err);
      return Response.error();
    }

    // Corner case: someone RSVPs to a session and is later added as a host
    // In this case, remove their RSVP
    void repos.rsvps.deleteBySessionAndGuests(params.id, newHostIds);
    return Response.json({ success: true });
  } else {
    return Response.error();
  }
}
