import { deleteVote } from "@/db/votes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { guestId, proposalId } = (await req.json()) as {
    guestId: string;
    proposalId: string;
  };

  try {
    await deleteVote(guestId, proposalId);
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.error();
  }
}
