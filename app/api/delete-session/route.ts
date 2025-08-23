import { getBase } from "@/db/db";
import type { Session } from "@/db/sessions";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id: string };
  let canEdit = true;
  await getBase()<Session>("Sessions")
    .select({
      fields: ["Attendee scheduled", "Blocker"],
      filterByFormula: `{ID} = "${id}"`,
    })
    .eachPage(function page(records, fetchNextPage) {
      if (
        records.some((r) => !r.fields["Attendee scheduled"] || r.fields.Blocker)
      ) {
        canEdit = false;
      }
      fetchNextPage();
    });
  if (!canEdit) {
    return new Response("Cannot delete via web app", { status: 400 });
  }

  try {
    // This deletes all RSVPs for the session
    await getBase()("RSVPs")
      .select({
        filterByFormula: `{Session ID} = "${id}"`,
      })
      .eachPage(function page(records, fetchNextPage) {
        const recordIds = records.map((record) => record.getId());
        if (recordIds.length > 0) {
          getBase()("RSVPs").destroy(recordIds, function (err) {
            if (err) {
              console.error("Error deleting RSVPs:", err);
            } else {
              console.log(
                `Deleted ${recordIds.length} RSVPs for session ${id}`
              );
            }
          });
        }
        fetchNextPage();
      });

    const records = await getBase()("Sessions").destroy([id]);
    records?.forEach(function (record) {
      console.log(`Deleted session: ${record.getId()}`);
    });
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}
