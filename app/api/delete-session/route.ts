import { getRepositories } from "@/db/container";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id: string };
  const repos = getRepositories();

  const session = await repos.sessions.findById(id);
  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  if (!session.attendeeScheduled || session.blocker) {
    return new Response("Cannot delete via web app", { status: 400 });
  }

  try {
    await repos.sessions.delete(id);
    console.log(`Deleted session: ${id}`);
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}
