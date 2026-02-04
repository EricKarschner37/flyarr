import { db } from "@/lib/db";
import { transferPartnerships, creditCardPrograms, airlinePrograms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
import { Clock, Zap } from "lucide-react";

export default async function TransfersPage() {
  const transfers = await db
    .select({
      id: transferPartnerships.id,
      ccName: creditCardPrograms.name,
      ccCode: creditCardPrograms.code,
      airlineName: airlinePrograms.name,
      airlineCode: airlinePrograms.code,
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
    .innerJoin(
      airlinePrograms,
      eq(transferPartnerships.airlineProgramId, airlinePrograms.id)
    )
    .orderBy(creditCardPrograms.name, airlinePrograms.name);

  // Group by credit card program
  const ccGroups = transfers.reduce(
    (acc, transfer) => {
      if (!acc[transfer.ccCode]) {
        acc[transfer.ccCode] = {
          ccName: transfer.ccName,
          transfers: [],
        };
      }
      acc[transfer.ccCode].transfers.push(transfer);
      return acc;
    },
    {} as Record<string, { ccName: string; transfers: typeof transfers }>
  );

  const formatTransferTime = (hours: number) => {
    if (hours === 0) return "Instant";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transfer Partnerships</h1>
      </div>

      <div className="space-y-6">
        {Object.entries(ccGroups).map(([ccCode, { ccName, transfers: ccTransfers }]) => (
          <Card key={ccCode}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ccName}
                <Badge variant="outline">{ccCode.replace("_", " ")}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Airline Program</TableHead>
                    <TableHead>Transfer Ratio</TableHead>
                    <TableHead>Transfer Time</TableHead>
                    <TableHead>Bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ccTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        {transfer.airlineName}
                        <span className="text-muted-foreground ml-2">
                          ({transfer.airlineCode})
                        </span>
                      </TableCell>
                      <TableCell>
                        {parseFloat(transfer.transferRatio || "1") === 1 ? (
                          "1:1"
                        ) : (
                          `1:${parseFloat(transfer.transferRatio || "1")}`
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatTransferTime(transfer.transferTimeHours)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transfer.isBonusActive && transfer.bonusRatio ? (
                          <Badge className="bg-green-500 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            +{Math.round((parseFloat(transfer.bonusRatio) - 1) * 100)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
