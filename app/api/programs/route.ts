import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { airlinePrograms, alliances, transferPartnerships, awardCharts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const programs = await db
    .select({
      id: airlinePrograms.id,
      name: airlinePrograms.name,
      code: airlinePrograms.code,
      hasDynamicPricing: airlinePrograms.hasDynamicPricing,
      allianceId: airlinePrograms.allianceId,
      allianceName: alliances.name,
      allianceCode: alliances.code,
    })
    .from(airlinePrograms)
    .leftJoin(alliances, eq(airlinePrograms.allianceId, alliances.id))
    .orderBy(airlinePrograms.name);

  // Get transfer partner counts and award chart counts for each program
  const programsWithCounts = await Promise.all(
    programs.map(async (program) => {
      const [transferCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transferPartnerships)
        .where(eq(transferPartnerships.airlineProgramId, program.id));

      const [chartCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(awardCharts)
        .where(eq(awardCharts.programId, program.id));

      return {
        ...program,
        transferPartnerCount: Number(transferCount.count),
        awardChartCount: Number(chartCount.count),
      };
    })
  );

  return NextResponse.json(programsWithCounts);
}
