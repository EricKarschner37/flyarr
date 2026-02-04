import { db } from "@/lib/db";
import { regions, airlinePrograms, airportRegionMappings } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
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

export default async function RegionsPage() {
  // Get regions with program names and airport counts
  const regionsData = await db
    .select({
      id: regions.id,
      name: regions.name,
      code: regions.code,
      programName: airlinePrograms.name,
      programCode: airlinePrograms.code,
    })
    .from(regions)
    .innerJoin(airlinePrograms, eq(regions.programId, airlinePrograms.id))
    .orderBy(airlinePrograms.name, regions.name);

  // Get airport counts per region
  const airportCounts = await db
    .select({
      regionId: airportRegionMappings.regionId,
      count: count(),
    })
    .from(airportRegionMappings)
    .groupBy(airportRegionMappings.regionId);

  const airportCountMap = Object.fromEntries(
    airportCounts.map((ac) => [ac.regionId, ac.count])
  );

  // Group by program
  const programGroups = regionsData.reduce(
    (acc, region) => {
      if (!acc[region.programCode]) {
        acc[region.programCode] = {
          programName: region.programName,
          regions: [],
        };
      }
      acc[region.programCode].regions.push(region);
      return acc;
    },
    {} as Record<string, { programName: string; regions: typeof regionsData }>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Regions</h1>
      </div>

      <div className="space-y-6">
        {Object.entries(programGroups).map(([programCode, { programName, regions: programRegions }]) => (
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
                    <TableHead>Region Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Airports</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programRegions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>
                        {region.code ? (
                          <code className="bg-muted px-2 py-1 rounded">
                            {region.code}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {airportCountMap[region.id] || 0} airports
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
