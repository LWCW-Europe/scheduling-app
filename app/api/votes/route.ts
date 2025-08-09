import { NextRequest, NextResponse } from "next/server";
import { getVotesByUser } from "@/db/votes";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user = searchParams.get("user");
  const event = searchParams.get("event");

  if (!user || !event) {
    return NextResponse.json(
      { error: "User and event parameters are required" },
      { status: 400 }
    );
  }

  try {
    const votes = await getVotesByUser(user, event);
    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
