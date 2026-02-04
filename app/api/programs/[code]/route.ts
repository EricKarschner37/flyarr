import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  airlinePrograms,
  alliances,
  transferPartnerships,
  creditCardPrograms,
  awardCharts,
  regions,
} from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Get the program
  const [program] = await db
    .select({
      id: airlinePrograms.id,
      name: airlinePrograms.name,
      code: airlinePrograms.code,
      hasDynamicPricing: airlinePrograms.hasDynamicPricing,
      searchUrlTemplate: airlinePrograms.searchUrlTemplate,
      allianceId: airlinePrograms.allianceId,
      allianceName: alliances.name,
      allianceCode: alliances.code,
    })
    .from(airlinePrograms)
    .leftJoin(alliances, eq(airlinePrograms.allianceId, alliances.id))
    .where(eq(airlinePrograms.code, code.toUpperCase()));

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Get transfer partners (credit card programs that transfer to this airline)
  const transfers = await db
    .select({
      creditCardProgramId: creditCardPrograms.id,
      creditCardProgramName: creditCardPrograms.name,
      creditCardProgramCode: creditCardPrograms.code,
      transferRatio: transferPartnerships.transferRatio,
      transferTimeHours: transferPartnerships.transferTimeHours,
      isBonusActive: transferPartnerships.isBonusActive,
      bonusRatio: transferPartnerships.bonusRatio,
    })
    .from(transferPartnerships)
    .innerJoin(
      creditCardPrograms,
      eq(transferPartnerships.creditCardProgramId, creditCardPrograms.id)
    )
    .where(eq(transferPartnerships.airlineProgramId, program.id))
    .orderBy(creditCardPrograms.name);

  // Get award charts with region names
  const charts = await db
    .select({
      id: awardCharts.id,
      cabinClass: awardCharts.cabinClass,
      partnerType: awardCharts.partnerType,
      minMiles: awardCharts.minMiles,
      maxMiles: awardCharts.maxMiles,
      typicalMiles: awardCharts.typicalMiles,
      isOneWay: awardCharts.isOneWay,
      notes: awardCharts.notes,
      originRegionId: awardCharts.originRegionId,
      destinationRegionId: awardCharts.destinationRegionId,
    })
    .from(awardCharts)
    .where(eq(awardCharts.programId, program.id))
    .orderBy(awardCharts.cabinClass, awardCharts.minMiles);

  // Get region names
  const programRegions = await db
    .select({
      id: regions.id,
      name: regions.name,
      code: regions.code,
    })
    .from(regions)
    .where(eq(regions.programId, program.id));

  const regionMap = new Map(programRegions.map((r) => [r.id, r]));

  const chartsWithRegions = charts.map((chart) => ({
    ...chart,
    originRegion: regionMap.get(chart.originRegionId) || null,
    destinationRegion: regionMap.get(chart.destinationRegionId) || null,
  }));

  // Get alliance partners (other programs in the same alliance)
  let alliancePartners: { id: number; name: string; code: string }[] = [];
  if (program.allianceId) {
    alliancePartners = await db
      .select({
        id: airlinePrograms.id,
        name: airlinePrograms.name,
        code: airlinePrograms.code,
      })
      .from(airlinePrograms)
      .where(
        and(
          eq(airlinePrograms.allianceId, program.allianceId),
          ne(airlinePrograms.id, program.id)
        )
      )
      .orderBy(airlinePrograms.name);
  }

  return NextResponse.json({
    program,
    transferPartners: transfers,
    awardCharts: chartsWithRegions,
    regions: programRegions,
    alliancePartners,
  });
}
