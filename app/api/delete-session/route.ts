import { base } from "@/db/db";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as { id: string };
  try {
    // This deletes all RSVPs for the session
    await base("RSVPs")
      .select({
        filterByFormula: `{Session} = "${params.id}"`,
      })
      .eachPage(function page(records, fetchNextPage) {
        const recordIds = records.map((record) => record.getId());
        if (recordIds.length > 0) {
          base("RSVPs").destroy(recordIds, function (err) {
            if (err) {
              console.error("Error deleting RSVPs:", err);
            } else {
              console.log(
                `Deleted ${recordIds.length} RSVPs for session ${params.id}`
              );
            }
          });
        }
        fetchNextPage();
      });

    const records = await base("Sessions").destroy([params.id]);
    records?.forEach(function (record) {
      console.log(`Deleted session: ${record.getId()}`);
    });
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}
