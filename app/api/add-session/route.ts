import { getRepositories } from "@/db/container";
import { prepareToInsert, validateSession } from "../session-form-utils";
import type { SessionParams } from "../session-form-utils";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as SessionParams;
  const repos = getRepositories();
  const input = prepareToInsert(params);
  const existingSessions = (await repos.sessions.listScheduled()).filter(
    (s) => !input.eventId || s.eventId === input.eventId
  );
  const sessionValid = validateSession(input, existingSessions);
  if (sessionValid) {
    try {
      const session = await repos.sessions.create(input);
      console.log(session.id);
    } catch (err) {
      console.error(err);
      return Response.error();
    }
    return Response.json({ success: true });
  } else {
    return Response.error();
  }
}
