import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/db/container";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user = searchParams.get("user");
  const eventName = searchParams.get("event");

  if (!user || !eventName) {
    return NextResponse.json(
      { error: "User and event parameters are required" },
      { status: 400 }
    );
  }

  try {
    const repos = getRepositories();
    const event = await repos.events.findByName(eventName);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const votes = await repos.votes.listByGuestAndEvent(user, event.id);
    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}
