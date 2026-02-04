"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchResult {
  code: string;
  name: string;
  city: string;
  country: string;
  isMetro?: boolean;
  airportCodes?: string[];
}

interface AirportComboboxProps {
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export function AirportCombobox({
  value,
  onSelect,
  placeholder = "Select airport...",
}: AirportComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(
    null
  );

  // Debounced search
  React.useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(search)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Search error:", e);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search]);

  // Load initial value if set
  React.useEffect(() => {
    if (value && !selectedResult) {
      fetch(`/api/airports?q=${value}`)
        .then((res) => res.json())
        .then((data: SearchResult[]) => {
          // Check if value is a metro code
          const metroResult = data.find((r) => r.isMetro && r.code === value);
          if (metroResult) {
            setSelectedResult(metroResult);
          } else {
            // Check if it's an individual airport
            const airport = data.find((r) => !r.isMetro && r.code === value);
            if (airport) {
              setSelectedResult(airport);
            }
          }
        })
        .catch(console.error);
    }
  }, [value, selectedResult]);

  // Separate metro results from individual airports
  const metroResults = results.filter((r) => r.isMetro);
  const airportResults = results.filter((r) => !r.isMetro);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedResult ? (
            <span className="truncate">
              {selectedResult.isMetro ? (
                <>
                  <span className="font-semibold">{selectedResult.code}</span> -{" "}
                  {selectedResult.city}{" "}
                  <span className="text-muted-foreground">
                    ({selectedResult.airportCodes?.join(", ")})
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{selectedResult.code}</span> -{" "}
                  {selectedResult.city}
                </>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search airports or cities..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!loading && search.length >= 2 && results.length === 0 && (
              <CommandEmpty>No airports found.</CommandEmpty>
            )}
            {!loading && search.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
            {!loading && metroResults.length > 0 && (
              <CommandGroup heading="Metro Areas">
                {metroResults.map((result) => (
                  <CommandItem
                    key={result.code}
                    value={result.code}
                    onSelect={() => {
                      onSelect(result.code);
                      setSelectedResult(result);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === result.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span>
                        <span className="font-semibold">{result.code}</span> -{" "}
                        {result.city}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.airportCodes?.join(", ")}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && airportResults.length > 0 && (
              <CommandGroup heading="Airports">
                {airportResults.map((result) => (
                  <CommandItem
                    key={result.code}
                    value={result.code}
                    onSelect={() => {
                      onSelect(result.code);
                      setSelectedResult(result);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === result.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        <span className="font-semibold">{result.code}</span> -{" "}
                        {result.city}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
