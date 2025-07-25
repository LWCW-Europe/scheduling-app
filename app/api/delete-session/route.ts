import { base } from "@/db/db";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as { id: string };
  try {
    const records = await base("Sessions").destroy([params.id]);
    records?.forEach(function (record) {
      console.log(record.getId());
    });
  } catch (err) {
    console.error(err);
    return Response.error();
  }

  return Response.json({ success: true });
}
