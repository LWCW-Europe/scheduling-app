import { getRepositories } from "@/db/container";
import { VoteChoice } from "@/app/votes";

type VoteParams = {
  proposalId: string;
  guestId: string;
  choice: VoteChoice;
};

export const dynamic = "force-dynamic"; // defaults to auto

// Replaces any existing vote by that user for that proposal
export async function POST(req: Request) {
  const { proposalId, guestId, choice } = (await req.json()) as VoteParams;
  const repos = getRepositories();
  try {
    await repos.votes.deleteByGuestAndProposal(guestId, proposalId);
    const vote = await repos.votes.create({ proposalId, guestId, choice });
    console.log(vote.id);
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}
