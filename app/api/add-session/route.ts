import { getSessions } from "@/db/sessions";
import { base } from "@/db/db";
import { prepareToInsert, validateSession } from "../session_utils";
import type { SessionParams } from "../session_utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  const session = prepareToInsert(params);
  console.log(session);
  const existingSessions = await getSessions();
  const sessionValid = validateSession(session, existingSessions);
  if (sessionValid) {
    try {
      const records = await base("Sessions").create([
        {
          fields: session,
        },
      ]);
      records.forEach((record) => console.log(record.getId()));
    } catch (err) {
      console.error(err);
      return Response.error();
    }
    return Response.json({ success: true });
  } else {
    return Response.error();
  }
}
