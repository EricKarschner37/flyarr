import { db } from "@/lib/db";
import { airlinePrograms, alliances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default async function ProgramsPage() {
  const programs = await db
    .select({
      id: airlinePrograms.id,
      name: airlinePrograms.name,
      code: airlinePrograms.code,
      hasDynamicPricing: airlinePrograms.hasDynamicPricing,
      searchUrlTemplate: airlinePrograms.searchUrlTemplate,
      allianceName: alliances.name,
    })
    .from(airlinePrograms)
    .leftJoin(alliances, eq(airlinePrograms.allianceId, alliances.id))
    .orderBy(airlinePrograms.name);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Airline Programs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Alliance</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Search URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded">
                      {program.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {program.allianceName ? (
                      <Badge variant="outline">{program.allianceName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {program.hasDynamicPricing ? (
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        Dynamic
                      </Badge>
                    ) : (
                      <Badge>Fixed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {program.searchUrlTemplate ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
