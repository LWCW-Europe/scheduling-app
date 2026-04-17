import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/db/container";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json(
      { error: "User parameter is required" },
      { status: 400 }
    );
  }

  try {
    const rsvps = await getRepositories().rsvps.listByGuest(user);
    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
