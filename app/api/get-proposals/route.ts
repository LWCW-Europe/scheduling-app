import { NextRequest, NextResponse } from "next/server";

import { getSessionProposalsByEvent } from "@/db/sessionProposals";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventName = searchParams.get("eventName");

  if (!eventName) {
    return NextResponse.json(
      { error: "eventName parameter is required" },
      { status: 400 }
    );
  }

  try {
    const proposals = await getSessionProposalsByEvent(eventName);
    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
