import { NextRequest, NextResponse } from "next/server";
import { resolveAirportCodes, getMetroInfo } from "@/lib/search/find-awards";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    const airportCodes = await resolveAirportCodes(code);
    const metroInfo = await getMetroInfo(code);

    return NextResponse.json({
      code,
      airportCodes,
      isMetro: metroInfo !== null,
      metroName: metroInfo?.name,
    });
  } catch (error) {
    console.error("Airport resolution error:", error);
    return NextResponse.json({ error: "Resolution failed" }, { status: 500 });
  }
}
