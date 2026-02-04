import { NextRequest, NextResponse } from "next/server";
import { findAwards, type CabinClass } from "@/lib/search/find-awards";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const cabin = searchParams.get("cabin") || "economy";
  const programs = searchParams.get("programs");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination are required" },
      { status: 400 }
    );
  }

  const enabledPrograms = programs ? programs.split(",") : [];

  const results = await findAwards({
    origin,
    destination,
    cabinClass: cabin as CabinClass,
    enabledCreditCardPrograms: enabledPrograms,
  });

  return NextResponse.json(results);
}
