import { findAwards, type CabinClass } from "@/lib/search/find-awards";
import { ResultsTable } from "@/components/results-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane } from "lucide-react";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
    cabin?: string;
    programs?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { origin, destination, cabin, programs } = params;

  if (!origin || !destination) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Search</h1>
            <p className="text-muted-foreground mb-8">
              Please provide both origin and destination airports.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const cabinClass = (cabin as CabinClass) || "business";
  const enabledPrograms = programs ? programs.split(",") : [];

  const results = await findAwards({
    origin,
    destination,
    cabinClass,
    enabledCreditCardPrograms: enabledPrograms,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-2">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Search
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Plane className="h-8 w-8" />
              {origin} → {destination}
            </h1>
            <p className="text-muted-foreground mt-1">
              {cabinClass.charAt(0).toUpperCase() +
                cabinClass.slice(1).replace("_", " ")}{" "}
              Class •{" "}
              {results.length === 0
                ? "No results found"
                : `${results.length} program${results.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">
              No award options found for this route and cabin class.
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different route or cabin class, or check if you have credit
              card programs enabled.
            </p>
          </div>
        ) : (
          <ResultsTable results={results} enabledPrograms={enabledPrograms} />
        )}
      </div>
    </main>
  );
}
