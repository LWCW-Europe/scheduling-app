import { getSessions } from "@/db/sessions";
import { getBase } from "@/db/db";
import { prepareToInsert, validateSession } from "../session-form-utils";
import type { SessionParams } from "../session-form-utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  const session = prepareToInsert(params);
  console.log(session);
  const existingSessions = await getSessions();
  const sessionValid = validateSession(session, existingSessions);
  if (sessionValid) {
    try {
      const records = await getBase()("Sessions").create([
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
