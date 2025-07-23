import { base } from "@/db/db";

type RSVPParams = {
  sessionId: string;
  guestId: string;
  remove?: boolean;
};

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const { sessionId, guestId, remove } = (await req.json()) as RSVPParams;

  if (!remove) {
    try {
      const records = await base("RSVPs").create([
        {
          fields: { Session: [sessionId], Guest: [guestId] },
        },
      ]);
      records.forEach((record) => console.log(record.getId()));
    } catch (err) {
      console.error(err);
      return;
    }
  } else {
    console.log("REMOVING RSVP", { sessionId, guestId });
    await base("RSVPs")
      .select({
        filterByFormula: `AND({Session ID} = "${sessionId}", {Guest ID} = "${guestId}")`,
      })
      .eachPage(function page(records: any, fetchNextPage: any) {
        console.log("RECORDS", { records });
        records.forEach(function (record: any) {
          base("RSVPs").destroy([record.getId()], function (err: string) {
            if (err) {
              console.error(err);
              return;
            }
          });
        });
        fetchNextPage();
      });
  }

  return Response.json({ success: true });
}
