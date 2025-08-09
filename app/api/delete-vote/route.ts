import { base } from "@/db/db";

export const dynamic = "force-dynamic";

export async function deleteVote(guestId: string, proposalId: string) {
  try {
    await base("Votes")
      .select({
        filterByFormula: `AND({guestId} = "${guestId}", {proposalId} = "${proposalId}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          base("Votes").destroy([record.getId()], function (err: string) {
            if (err) {
              console.error(err);
              return;
            }
          });
        });
        fetchNextPage();
      });
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}

export async function POST(req: Request) {
  const { guestId, proposalId } = (await req.json()) as {
    guestId: string;
    proposalId: string;
  };
  return deleteVote(guestId, proposalId);
}
