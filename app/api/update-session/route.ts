import { getSessions } from "@/db/sessions";
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
  const existingSessions = (await getSessions()).filter(ses => ses.ID !== params.id);
  const sessionValid = validateSession(session, existingSessions);
  if (sessionValid) {
    await base("Sessions").update(
      [
        {
          id: params.id,
          fields: session,
        },
      ],
      function (err: string, records) {
        if (err) {
          console.error(err);
          return Response.error();
        }
        records?.forEach(function (record) {
          console.log(record.getId());
        });
      }
    );
    return Response.json({ success: true });
  } else {
    return Response.error();
  }
}
