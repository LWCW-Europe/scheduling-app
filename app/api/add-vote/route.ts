import { base } from "@/db/db";
import { deleteVote } from "@/db/votes";
import { VoteChoice } from "@/app/votes";

type VoteParams = {
  proposal: string;
  guest: string;
  choice: VoteChoice;
};

export const dynamic = "force-dynamic"; // defaults to auto

// Replaces any existing vote by that user for that proposal
export async function POST(req: Request) {
  const { proposal, guest, choice } = (await req.json()) as VoteParams;
  try {
    await deleteVote(guest, proposal);
    const records = await base("Votes").create([
      {
        fields: { proposal: [proposal], guest: [guest], choice },
      },
    ]);
    records.forEach((record) => console.log(record.getId()));
  } catch (err) {
    console.error(err);
    return;
  }

  return Response.json({ success: true });
}
