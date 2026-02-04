"use client";

import { type AwardResult } from "@/lib/search/find-awards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Clock, Zap, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ResultsTableProps {
  results: AwardResult[];
  enabledPrograms: string[];
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatTransferTime(hours: number): string {
  if (hours === 0) return "Instant";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ResultsTable({ results }: ResultsTableProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Program</TableHead>
              <TableHead>Cost (Miles)</TableHead>
              <TableHead>Transfer Options</TableHead>
              <TableHead className="w-[100px]">Regions</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="font-medium">{result.airlineProgram.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.airlineProgram.alliance && (
                      <Badge variant="outline" className="text-xs mr-2">
                        {result.airlineProgram.alliance}
                      </Badge>
                    )}
                    {result.airlineProgram.hasDynamicPricing && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Dynamic
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-lg">
                    {result.awardCost.minMiles === result.awardCost.maxMiles ? (
                      formatNumber(result.awardCost.minMiles)
                    ) : (
                      <>
                        {formatNumber(result.awardCost.minMiles)} -{" "}
                        {formatNumber(result.awardCost.maxMiles)}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.awardCost.isOneWay ? "one-way" : "round-trip"}
                    {result.awardCost.typicalMiles &&
                      result.awardCost.minMiles !== result.awardCost.maxMiles && (
                        <span className="ml-2">
                          (typical: {formatNumber(result.awardCost.typicalMiles)})
                        </span>
                      )}
                  </div>
                  {result.awardCost.notes && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Info className="h-3 w-3 mr-1" />
                          Notes
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <p className="text-sm">{result.awardCost.notes}</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </TableCell>
                <TableCell>
                  {result.transferOptions.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No transfer partners from your cards
                    </span>
                  ) : (
                    <div className="space-y-1">
                      {result.transferOptions.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Badge variant="outline">
                            {option.creditCardProgram.code.replace("_", " ")}
                          </Badge>
                          <span className="font-medium">
                            {formatNumber(option.pointsNeeded)} pts
                          </span>
                          <span className="text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTransferTime(option.transferTimeHours)}
                          </span>
                          {option.isBonusActive && option.bonusRatio && (
                            <Badge className="bg-green-500 text-white">
                              +{Math.round((option.bonusRatio - 1) * 100)}% bonus
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground">
                    {result.airlineProgram.pricingModel === "distance" ? (
                      // For distance-based programs, show the distance band from notes or destination region
                      result.awardCost.notes || result.destinationRegion
                    ) : (
                      // For region-based programs, show origin → destination
                      <>{result.originRegion} → {result.destinationRegion}</>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {result.airlineProgram.searchUrl ? (
                    <Button asChild size="sm">
                      <a
                        href={result.airlineProgram.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Search
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No direct link
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {results.map((result, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {result.airlineProgram.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {result.airlineProgram.alliance && (
                      <Badge variant="outline" className="text-xs">
                        {result.airlineProgram.alliance}
                      </Badge>
                    )}
                    {result.airlineProgram.hasDynamicPricing && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Dynamic
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">
                    {result.awardCost.minMiles === result.awardCost.maxMiles ? (
                      formatNumber(result.awardCost.minMiles)
                    ) : (
                      <>
                        {formatNumber(result.awardCost.minMiles)} -{" "}
                        {formatNumber(result.awardCost.maxMiles)}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.awardCost.isOneWay ? "one-way" : "round-trip"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {result.airlineProgram.pricingModel === "distance" ? (
                  result.awardCost.notes || result.destinationRegion
                ) : (
                  <>{result.originRegion} → {result.destinationRegion}</>
                )}
              </div>

              {result.transferOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Transfer Options:</div>
                  {result.transferOptions.map((option, optIdx) => (
                    <div
                      key={optIdx}
                      className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                    >
                      <Badge variant="outline">
                        {option.creditCardProgram.code.replace("_", " ")}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatNumber(option.pointsNeeded)} pts
                        </span>
                        <span className="text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTransferTime(option.transferTimeHours)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.airlineProgram.searchUrl && (
                <Button asChild className="w-full">
                  <a
                    href={result.airlineProgram.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Search on {result.airlineProgram.name}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
