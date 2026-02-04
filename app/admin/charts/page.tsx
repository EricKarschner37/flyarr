import { db } from "@/lib/db";
import { awardCharts, airlinePrograms, regions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChartsPage() {
  const originRegions = alias(regions, "originRegions");
  const destRegions = alias(regions, "destRegions");

  const charts = await db
    .select({
      id: awardCharts.id,
      programName: airlinePrograms.name,
      programCode: airlinePrograms.code,
      originRegion: originRegions.name,
      destRegion: destRegions.name,
      cabinClass: awardCharts.cabinClass,
      partnerType: awardCharts.partnerType,
      minMiles: awardCharts.minMiles,
      maxMiles: awardCharts.maxMiles,
      typicalMiles: awardCharts.typicalMiles,
      isOneWay: awardCharts.isOneWay,
      notes: awardCharts.notes,
    })
    .from(awardCharts)
    .innerJoin(airlinePrograms, eq(awardCharts.programId, airlinePrograms.id))
    .innerJoin(originRegions, eq(awardCharts.originRegionId, originRegions.id))
    .innerJoin(destRegions, eq(awardCharts.destinationRegionId, destRegions.id))
    .orderBy(airlinePrograms.name, awardCharts.cabinClass);

  // Group by program
  const programGroups = charts.reduce(
    (acc, chart) => {
      if (!acc[chart.programCode]) {
        acc[chart.programCode] = {
          programName: chart.programName,
          charts: [],
        };
      }
      acc[chart.programCode].charts.push(chart);
      return acc;
    },
    {} as Record<string, { programName: string; charts: typeof charts }>
  );

  const formatCabinClass = (cabin: string) => {
    return cabin
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Award Charts</h1>
      </div>

      <div className="space-y-6">
        {Object.entries(programGroups).map(([programCode, { programName, charts: programCharts }]) => (
          <Card key={programCode}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {programName}
                <Badge variant="outline">{programCode}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Cabin</TableHead>
                    <TableHead>Partner Type</TableHead>
                    <TableHead>Miles</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programCharts.map((chart) => (
                    <TableRow key={chart.id}>
                      <TableCell className="font-medium">
                        {chart.originRegion} → {chart.destRegion}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatCabinClass(chart.cabinClass)}
                        </Badge>
                      </TableCell>
                      <TableCell>{chart.partnerType}</TableCell>
                      <TableCell>
                        {chart.minMiles === chart.maxMiles ? (
                          chart.minMiles.toLocaleString()
                        ) : (
                          <>
                            {chart.minMiles.toLocaleString()} - {chart.maxMiles.toLocaleString()}
                          </>
                        )}
                        {chart.typicalMiles &&
                          chart.minMiles !== chart.maxMiles && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (typical: {chart.typicalMiles.toLocaleString()})
                            </span>
                          )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={chart.isOneWay ? "default" : "outline"}>
                          {chart.isOneWay ? "One-way" : "Round-trip"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {chart.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
