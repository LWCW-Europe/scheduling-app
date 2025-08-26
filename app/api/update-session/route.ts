import { getSessions } from "@/db/sessions";
import { deleteRSVPsFromSessionByUsers } from "@/db/rsvps";
import { getBase } from "@/db/db";
import { prepareToInsert, validateSession } from "../session-form-utils";
import type { SessionParams } from "../session-form-utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  if (!params.id) {
    console.error("Session ID is required for update.");
    return new Response("Session ID is required", { status: 400 });
  }
  const session = prepareToInsert(params);
  const allSessions = (await getSessions()).filter(
    (s) => !session.Event || session.Event[0] === s.Event
  );
  const prevSession = allSessions.find((ses) => ses.ID === params.id);
  if (prevSession === undefined) {
    const msg = `Cannot find session with ID ${params.id}`;
    return new Response(msg, { status: 404 });
  }
  if (!prevSession["Attendee scheduled"] || prevSession.Blocker) {
    return new Response("Cannot edit via web app", { status: 400 });
  }
  const existingSessions = allSessions.filter((ses) => ses.ID !== params.id);
  const newHostIDs = params.hosts.map((h) => h.ID);
  const sessionValid = validateSession(session, existingSessions);
  if (sessionValid) {
    try {
      const records = await getBase()("Sessions").update([
        {
          id: params.id,
          fields: session,
        },
      ]);
      records?.forEach(function (record) {
        console.log(record.getId());
      });
    } catch (err) {
      console.error(err);
      return Response.error();
    }

    // Corner case: someone RSVPs to a session and is later added as a host
    // In this case, remove their RSVP
    deleteRSVPsFromSessionByUsers(params.id, newHostIDs);
    return Response.json({ success: true });
  } else {
    return Response.error();
  }
}
