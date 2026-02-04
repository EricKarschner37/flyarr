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
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plane, CreditCard, ArrowRight, Clock, Users } from "lucide-react";

interface Props {
  params: Promise<{ code: string }>;
}

async function getProgramDetails(code: string) {
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
    return null;
  }

  // Get transfer partners
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

  // Get award charts
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

  // Get regions
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

  // Get alliance partners
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

  return {
    program,
    transferPartners: transfers,
    awardCharts: chartsWithRegions,
    regions: programRegions,
    alliancePartners,
  };
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

function getCabinLabel(cabin: string): string {
  const labels: Record<string, string> = {
    economy: "Economy",
    premium_economy: "Premium Economy",
    business: "Business",
    first: "First",
  };
  return labels[cabin] || cabin;
}

function formatTransferTime(hours: number): string {
  if (hours === 0) return "Instant";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default async function ProgramDetailsPage({ params }: Props) {
  const { code } = await params;
  const data = await getProgramDetails(code);

  if (!data) {
    notFound();
  }

  const { program, transferPartners, awardCharts, alliancePartners } = data;

  // Group charts by cabin class
  const chartsByCabin = awardCharts.reduce(
    (acc, chart) => {
      const cabin = chart.cabinClass;
      if (!acc[cabin]) acc[cabin] = [];
      acc[cabin].push(chart);
      return acc;
    },
    {} as Record<string, typeof awardCharts>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/programs"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            &larr; Back to Programs
          </Link>
          <div className="flex items-center gap-4">
            <Plane className="h-10 w-10" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{program.name}</h1>
                {program.hasDynamicPricing && (
                  <Badge variant="secondary">Dynamic Pricing</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">{program.code}</span>
                {program.allianceName && (
                  <Badge className={getAllianceColor(program.allianceCode)}>
                    {program.allianceName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Transfer Partners */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Transfer Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transferPartners.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No credit card transfer partners available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transferPartners.map((partner) => (
                      <div
                        key={partner.creditCardProgramId}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {partner.creditCardProgramName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {parseFloat(partner.transferRatio || "1")}:1 ratio
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTransferTime(partner.transferTimeHours)}
                            </span>
                          </div>
                        </div>
                        {partner.isBonusActive && partner.bonusRatio && (
                          <Badge className="bg-green-100 text-green-800">
                            {parseFloat(partner.bonusRatio)}x Bonus
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alliance Partners */}
            {alliancePartners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Alliance Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Book flights on these {program.allianceName} partners using{" "}
                    {program.name} miles:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alliancePartners.map((partner) => (
                      <Link
                        key={partner.code}
                        href={`/programs/${partner.code.toLowerCase()}`}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                        >
                          {partner.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Award Charts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Award Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {awardCharts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-lg mb-2">No award chart available.</p>
                    {program.hasDynamicPricing && (
                      <p className="text-sm">
                        This program uses dynamic pricing. Award costs vary
                        based on demand.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(chartsByCabin).map(([cabin, charts]) => (
                      <div key={cabin}>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Badge variant="outline">{getCabinLabel(cabin)}</Badge>
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Route</TableHead>
                              <TableHead className="text-right">Miles</TableHead>
                              <TableHead className="text-right">Type</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {charts.map((chart) => (
                              <TableRow key={chart.id}>
                                <TableCell>
                                  <span className="font-medium">
                                    {chart.originRegion?.name || "Unknown"}
                                  </span>
                                  <ArrowRight className="inline h-3 w-3 mx-1" />
                                  <span className="font-medium">
                                    {chart.destinationRegion?.name || "Unknown"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {chart.minMiles === chart.maxMiles
                                    ? chart.minMiles.toLocaleString()
                                    : `${chart.minMiles.toLocaleString()}-${chart.maxMiles.toLocaleString()}`}
                                </TableCell>
                                <TableCell className="text-right">
                                  {chart.isOneWay ? "One-way" : "Round-trip"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {chart.notes || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
