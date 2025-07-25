import { base } from "@/db/db";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(req: Request) {
  const params = (await req.json()) as { id: string };
  await base("Sessions").destroy(
    [params.id],
    function (err: string, records: any) {
      if (err) {
        console.error(err);
        return Response.error();
      }
      records.forEach(function (record: any) {
        console.log(record.getId());
      });
    }
  );
  return Response.json({ success: true });
}
