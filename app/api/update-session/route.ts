import { getSessions } from "@/db/sessions";
import { deleteRSVPsFromSessionByUsers } from "@/db/rsvps";
import { base } from "@/db/db";
import { prepareToInsert, validateSession } from "../session_utils";
import type { SessionParams } from "../session_utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  if (!params.id) {
    console.error("Session ID is required for update.");
    return new Response("Session ID is required", { status: 400 });
  }
  const session = prepareToInsert(params);
  const existingSessions = (await getSessions()).filter(
    (ses) => ses.ID !== params.id
  );
  const newHostIDs = params.hosts.map((h) => h.ID);
  const sessionValid = validateSession(session, existingSessions);
  if (sessionValid) {
    try {
      const records = await base("Sessions").update([
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
