import { db } from "@/lib/db";
import { airlinePrograms, alliances, transferPartnerships, awardCharts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, ArrowRight, CreditCard, Table2 } from "lucide-react";

async function getPrograms() {
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

  return programsWithCounts;
}

function getAllianceColor(allianceCode: string | null): string {
  switch (allianceCode) {
    case "STAR":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "OW":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "ST":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms();

  // Group by alliance
  const starAlliance = programs.filter((p) => p.allianceCode === "STAR");
  const oneworld = programs.filter((p) => p.allianceCode === "OW");
  const skyteam = programs.filter((p) => p.allianceCode === "ST");
  const independent = programs.filter((p) => !p.allianceCode);

  const renderProgramCard = (program: (typeof programs)[0]) => (
    <Link key={program.code} href={`/programs/${program.code.toLowerCase()}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{program.name}</CardTitle>
            {program.hasDynamicPricing && (
              <Badge variant="secondary" className="text-xs">
                Dynamic
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{program.code}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>{program.transferPartnerCount} transfer partners</span>
            </div>
            <div className="flex items-center gap-1">
              <Table2 className="h-4 w-4" />
              <span>{program.awardChartCount} routes</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-sm text-primary">
            View details <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderSection = (
    title: string,
    description: string,
    programList: typeof programs,
    badgeClass: string
  ) => (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge className={badgeClass}>{title}</Badge>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programList.map(renderProgramCard)}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            &larr; Back to Search
          </Link>
          <div className="flex items-center gap-3">
            <Plane className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Award Programs</h1>
              <p className="text-muted-foreground">
                Browse all {programs.length} airline loyalty programs
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {starAlliance.length > 0 &&
            renderSection(
              "Star Alliance",
              `${starAlliance.length} programs`,
              starAlliance,
              getAllianceColor("STAR")
            )}

          {oneworld.length > 0 &&
            renderSection(
              "Oneworld",
              `${oneworld.length} programs`,
              oneworld,
              getAllianceColor("OW")
            )}

          {skyteam.length > 0 &&
            renderSection(
              "SkyTeam",
              `${skyteam.length} programs`,
              skyteam,
              getAllianceColor("ST")
            )}

          {independent.length > 0 &&
            renderSection(
              "Independent",
              `${independent.length} programs`,
              independent,
              getAllianceColor(null)
            )}
        </div>
      </div>
    </main>
  );
}
