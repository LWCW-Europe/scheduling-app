import { NextRequest, NextResponse } from "next/server";
import { getRSVPsBySession } from "@/db/rsvps";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session parameter is required" },
      { status: 400 }
    );
  }

  try {
    const rsvps = await getRSVPsBySession(sessionId);
    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
