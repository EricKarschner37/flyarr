import { NextRequest, NextResponse } from "next/server";
import { searchAirports } from "@/lib/search/find-awards";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  try {
    const airports = await searchAirports(query);
    return NextResponse.json(airports);
  } catch (error) {
    console.error("Airport search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
