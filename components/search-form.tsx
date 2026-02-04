"use client";

import * as React from "react";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AirportCombobox } from "@/components/airport-combobox";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { Plane, ArrowRight, Loader2 } from "lucide-react";
import { ResultsTable } from "@/components/results-table";
import { type AwardResult } from "@/lib/search/find-awards";

const CABIN_CLASSES = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const CREDIT_CARD_PROGRAMS = [
  { code: "AMEX_MR", name: "Amex MR" },
  { code: "CHASE_UR", name: "Chase UR" },
  { code: "CITI_TY", name: "Citi TY" },
  { code: "CAPITAL_ONE", name: "Capital One" },
  { code: "BILT", name: "Bilt" },
];

const COOKIE_NAME = "flyarr_search_prefs";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

interface SearchPreferences {
  origin?: string;
  destination?: string;
  cabinClass?: string;
  enabledPrograms?: string[];
  isDateRange?: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function loadPreferences(): SearchPreferences {
  const cookie = getCookie(COOKIE_NAME);
  if (cookie) {
    try {
      return JSON.parse(cookie);
    } catch {
      return {};
    }
  }
  return {};
}

function savePreferences(prefs: SearchPreferences): void {
  setCookie(COOKIE_NAME, JSON.stringify(prefs), COOKIE_MAX_AGE);
}

export function SearchForm() {
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Initialize state with defaults
  const [origin, setOrigin] = React.useState<string>("");
  const [destination, setDestination] = React.useState<string>("");
  const [cabinClass, setCabinClass] = React.useState<string>("economy");
  const [enabledPrograms, setEnabledPrograms] = React.useState<string[]>(
    CREDIT_CARD_PROGRAMS.map((p) => p.code)
  );
  const [isDateRange, setIsDateRange] = React.useState<boolean>(false);
  const [singleDate, setSingleDate] = React.useState<Date | undefined>(
    addDays(new Date(), 30)
  );
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), 30),
    to: addDays(new Date(), 37),
  });

  // Results state
  const [results, setResults] = React.useState<AwardResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Load preferences from cookie on mount
  React.useEffect(() => {
    const prefs = loadPreferences();
    if (prefs.origin) setOrigin(prefs.origin);
    if (prefs.destination) setDestination(prefs.destination);
    if (prefs.cabinClass) setCabinClass(prefs.cabinClass);
    if (prefs.enabledPrograms) setEnabledPrograms(prefs.enabledPrograms);
    if (prefs.isDateRange !== undefined) setIsDateRange(prefs.isDateRange);
    setIsHydrated(true);
  }, []);

  // Save preferences to cookie whenever they change
  React.useEffect(() => {
    if (!isHydrated) return;
    savePreferences({
      origin,
      destination,
      cabinClass,
      enabledPrograms,
      isDateRange,
    });
  }, [origin, destination, cabinClass, enabledPrograms, isDateRange, isHydrated]);

  const toggleProgram = (code: string) => {
    setEnabledPrograms((prev) => {
      return prev.includes(code)
        ? prev.filter((p) => p !== code)
        : [...prev, code];
    });
  };

  const handleSearch = async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams({
      origin,
      destination,
      cabin: cabinClass,
      programs: enabledPrograms.join(","),
    });

    // Add date parameters
    if (isDateRange && dateRange?.from) {
      params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange.to) {
        params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      }
    } else if (singleDate) {
      params.set("date", format(singleDate, "yyyy-MM-dd"));
    }

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Disable past dates
  const disablePastDates = (date: Date) => {
    return date < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const cabinLabel = CABIN_CLASSES.find((c) => c.value === cabinClass)?.label || cabinClass;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Search Award Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Route Selection */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <AirportCombobox
              value={origin}
              onSelect={setOrigin}
              placeholder="Origin airport..."
            />
          </div>
          <div className="hidden md:flex items-center justify-center pb-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <AirportCombobox
              value={destination}
              onSelect={setDestination}
              placeholder="Destination airport..."
            />
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Travel Date</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="date-range-toggle"
                checked={isDateRange}
                onCheckedChange={setIsDateRange}
              />
              <Label htmlFor="date-range-toggle" className="text-sm cursor-pointer">
                Flexible dates
              </Label>
            </div>
          </div>
          {isDateRange ? (
            <DateRangePicker
              dateRange={dateRange}
              onSelect={setDateRange}
              placeholder="Select date range..."
              disabled={disablePastDates}
            />
          ) : (
            <DatePicker
              date={singleDate}
              onSelect={setSingleDate}
              placeholder="Select travel date..."
              disabled={disablePastDates}
            />
          )}
        </div>

        {/* Cabin Class */}
        <div className="space-y-2">
          <Label>Cabin Class</Label>
          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select cabin class" />
            </SelectTrigger>
            <SelectContent>
              {CABIN_CLASSES.map((cabin) => (
                <SelectItem key={cabin.value} value={cabin.value}>
                  {cabin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Credit Card Programs */}
        <div className="space-y-3">
          <Label>Your Credit Card Programs</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {CREDIT_CARD_PROGRAMS.map((program) => (
              <div
                key={program.code}
                className="flex items-center space-x-2 p-2 rounded-lg border"
              >
                <Switch
                  id={program.code}
                  checked={enabledPrograms.includes(program.code)}
                  onCheckedChange={() => toggleProgram(program.code)}
                />
                <Label htmlFor={program.code} className="text-sm cursor-pointer">
                  {program.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full"
          size="lg"
          disabled={!origin || !destination || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search Award Options"
          )}
        </Button>
      </CardContent>
    </Card>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center gap-3">
                <Plane className="h-6 w-6" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {origin} <ArrowRight className="inline h-5 w-5 mx-1" /> {destination}
                  </h2>
                  <p className="text-muted-foreground">
                    {cabinLabel} Class •{" "}
                    {results.length === 0
                      ? "No results found"
                      : `${results.length} program${results.length === 1 ? "" : "s"} found`}
                  </p>
                </div>
              </div>

              {/* Results */}
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">No award options found for this route and cabin class.</p>
                  <p className="text-sm">
                    Try a different route or cabin class, or check if you have credit card programs enabled.
                  </p>
                </div>
              ) : (
                <ResultsTable results={results} enabledPrograms={enabledPrograms} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
