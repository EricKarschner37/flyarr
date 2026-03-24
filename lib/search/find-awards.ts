import { db } from "@/lib/db";
import {
  airports,
  airlinePrograms,
  awardCharts,
  regions,
  airportRegionMappings,
  transferPartnerships,
  creditCardPrograms,
  alliances,
  airlineRoutes,
} from "@/lib/db/schema";
import { eq, and, inArray, isNull, lte, gte, or } from "drizzle-orm";

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface SearchParams {
  origin: string; // Airport code
  destination: string; // Airport code
  cabinClass: CabinClass;
  enabledCreditCardPrograms: string[]; // Credit card program codes
}

export interface AwardResult {
  airlineProgram: {
    id: number;
    name: string;
    code: string;
    hasDynamicPricing: boolean;
    pricingModel: string;
    searchUrl: string | null;
    alliance: string | null;
  };
  awardCost: {
    minMiles: number;
    maxMiles: number;
    typicalMiles: number | null;
    isOneWay: boolean;
    notes: string | null;
  };
  transferOptions: {
    creditCardProgram: {
      id: number;
      name: string;
      code: string;
    };
    transferRatio: number;
    transferTimeHours: number;
    pointsNeeded: number; // Award cost / transfer ratio
    isBonusActive: boolean;
    bonusRatio: number | null;
  }[];
  originRegion: string;
  destinationRegion: string;
}

// Check if an airline (or its alliance partners) operates a route between any of the origin/destination airports
async function hasRouteAvailability(
  programId: number,
  allianceId: number | null,
  partnerType: string,
  originCodes: string[],
  destinationCodes: string[]
): Promise<boolean> {
  // Build list of airline program IDs to check
  let programIdsToCheck = [programId];

  // For partner or any awards, include alliance partners
  if ((partnerType === "partner" || partnerType === "any") && allianceId) {
    const alliancePrograms = await db
      .select({ id: airlinePrograms.id })
      .from(airlinePrograms)
      .where(eq(airlinePrograms.allianceId, allianceId));
    programIdsToCheck = alliancePrograms.map((p) => p.id);
  }

  // Check if any of these airlines operate a route between origin and destination
  const routeExists = await db
    .select({ id: airlineRoutes.id })
    .from(airlineRoutes)
    .where(
      and(
        inArray(airlineRoutes.airlineProgramId, programIdsToCheck),
        inArray(airlineRoutes.originAirportCode, originCodes),
        inArray(airlineRoutes.destinationAirportCode, destinationCodes)
      )
    )
    .limit(1);

  return routeExists.length > 0;
}

// Calculate great-circle distance between two points using the haversine formula
function haversineDistanceMi(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Build transfer options for a given program and chart cost
async function getTransferOptions(
  programId: number,
  minMiles: number,
  enabledCreditCardPrograms: string[]
): Promise<AwardResult["transferOptions"]> {
  if (enabledCreditCardPrograms.length === 0) return [];

  const ccPrograms = await db
    .select()
    .from(creditCardPrograms)
    .where(inArray(creditCardPrograms.code, enabledCreditCardPrograms));

  const ccIds = ccPrograms.map((p) => p.id);
  if (ccIds.length === 0) return [];

  const transfers = await db
    .select({
      ccId: creditCardPrograms.id,
      ccName: creditCardPrograms.name,
      ccCode: creditCardPrograms.code,
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
    .where(
      and(
        eq(transferPartnerships.airlineProgramId, programId),
        inArray(transferPartnerships.creditCardProgramId, ccIds)
      )
    );

  return transfers.map((t) => {
    const ratio = parseFloat(t.transferRatio || "1");
    const effectiveRatio =
      t.isBonusActive && t.bonusRatio ? parseFloat(t.bonusRatio) : ratio;
    const pointsNeeded = Math.ceil(minMiles / effectiveRatio);

    return {
      creditCardProgram: {
        id: t.ccId,
        name: t.ccName,
        code: t.ccCode,
      },
      transferRatio: ratio,
      transferTimeHours: t.transferTimeHours,
      pointsNeeded,
      isBonusActive: t.isBonusActive,
      bonusRatio: t.bonusRatio ? parseFloat(t.bonusRatio) : null,
    };
  });
}

// Generate a search URL from the template
function buildSearchUrl(
  template: string | null,
  originCode: string,
  destinationCode: string
): string | null {
  if (!template) return null;
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);
  const dateStr = futureDate.toISOString().split("T")[0];
  return template
    .replace("{origin}", originCode)
    .replace("{destination}", destinationCode)
    .replace("{date}", dateStr);
}

// Format a distance band label for display (e.g., "0–700 mi")
function distanceBandLabel(minDist: number | null, maxDist: number | null): string {
  if (minDist == null && maxDist == null) return "Any distance";
  if (maxDist == null) return `${minDist!.toLocaleString()}+ mi`;
  if (minDist == null || minDist === 0) return `Under ${maxDist.toLocaleString()} mi`;
  return `${minDist.toLocaleString()}–${maxDist.toLocaleString()} mi`;
}

export async function findAwards(params: SearchParams): Promise<AwardResult[]> {
  const { origin, destination, cabinClass, enabledCreditCardPrograms } = params;

  // Resolve metro codes to individual airport codes
  const originCodes = await resolveAirportCodes(origin);
  const destinationCodes = await resolveAirportCodes(destination);

  if (originCodes.length === 0 || destinationCodes.length === 0) {
    return [];
  }

  // Get all airline programs
  const programs = await db
    .select({
      programId: airlinePrograms.id,
      programName: airlinePrograms.name,
      programCode: airlinePrograms.code,
      hasDynamicPricing: airlinePrograms.hasDynamicPricing,
      pricingModel: airlinePrograms.pricingModel,
      searchUrlTemplate: airlinePrograms.searchUrlTemplate,
      allianceId: airlinePrograms.allianceId,
      allianceName: alliances.name,
    })
    .from(airlinePrograms)
    .leftJoin(alliances, eq(airlinePrograms.allianceId, alliances.id));

  const results: AwardResult[] = [];

  for (const program of programs) {
    const searchUrl = buildSearchUrl(
      program.searchUrlTemplate,
      originCodes[0],
      destinationCodes[0]
    );

    if (program.pricingModel === "distance") {
      // ── Distance-based program (Alaska, BA Avios, etc.) ──
      // Get coordinates for one airport from each group
      const originAirport = await db
        .select({ lat: airports.lat, lng: airports.lng })
        .from(airports)
        .where(inArray(airports.code, originCodes))
        .limit(1);
      const destAirport = await db
        .select({ lat: airports.lat, lng: airports.lng })
        .from(airports)
        .where(inArray(airports.code, destinationCodes))
        .limit(1);

      if (
        originAirport.length === 0 ||
        destAirport.length === 0 ||
        !originAirport[0].lat ||
        !originAirport[0].lng ||
        !destAirport[0].lat ||
        !destAirport[0].lng
      )
        continue;

      const distanceMi = haversineDistanceMi(
        parseFloat(originAirport[0].lat),
        parseFloat(originAirport[0].lng),
        parseFloat(destAirport[0].lat),
        parseFloat(destAirport[0].lng)
      );

      // Query award charts where distance falls within [minDistanceMi, maxDistanceMi]
      const chartEntries = await db
        .select()
        .from(awardCharts)
        .where(
          and(
            eq(awardCharts.programId, program.programId),
            eq(awardCharts.cabinClass, cabinClass),
            lte(awardCharts.minDistanceMi, Math.round(distanceMi)),
            or(
              isNull(awardCharts.maxDistanceMi),
              gte(awardCharts.maxDistanceMi, Math.round(distanceMi))
            )
          )
        );

      if (chartEntries.length === 0) continue;

      for (const chart of chartEntries) {
        const routeAvailable = await hasRouteAvailability(
          program.programId,
          program.allianceId,
          chart.partnerType,
          originCodes,
          destinationCodes
        );
        if (!routeAvailable) continue;

        const transferOptions = await getTransferOptions(
          program.programId,
          chart.minMiles,
          enabledCreditCardPrograms
        );

        const bandLabel = distanceBandLabel(chart.minDistanceMi, chart.maxDistanceMi);

        results.push({
          airlineProgram: {
            id: program.programId,
            name: program.programName,
            code: program.programCode,
            hasDynamicPricing: program.hasDynamicPricing,
            pricingModel: program.pricingModel,
            searchUrl,
            alliance: program.allianceName,
          },
          awardCost: {
            minMiles: chart.minMiles,
            maxMiles: chart.maxMiles,
            typicalMiles: chart.typicalMiles,
            isOneWay: chart.isOneWay,
            notes: chart.notes,
          },
          originRegion: bandLabel,
          destinationRegion: bandLabel,
          transferOptions,
        });
      }
    } else {
      // ── Region-based program ──
      const originMapping = await db
        .select({
          regionId: airportRegionMappings.regionId,
          regionName: regions.name,
        })
        .from(airportRegionMappings)
        .innerJoin(regions, eq(airportRegionMappings.regionId, regions.id))
        .where(
          and(
            inArray(airportRegionMappings.airportCode, originCodes),
            eq(airportRegionMappings.programId, program.programId)
          )
        )
        .limit(1);

      if (originMapping.length === 0) continue;

      const destMapping = await db
        .select({
          regionId: airportRegionMappings.regionId,
          regionName: regions.name,
        })
        .from(airportRegionMappings)
        .innerJoin(regions, eq(airportRegionMappings.regionId, regions.id))
        .where(
          and(
            inArray(airportRegionMappings.airportCode, destinationCodes),
            eq(airportRegionMappings.programId, program.programId)
          )
        )
        .limit(1);

      if (destMapping.length === 0) continue;

      // Return ALL matching chart entries (different partner types) instead of LIMIT 1
      const chartEntries = await db
        .select()
        .from(awardCharts)
        .where(
          and(
            eq(awardCharts.programId, program.programId),
            eq(awardCharts.originRegionId, originMapping[0].regionId),
            eq(awardCharts.destinationRegionId, destMapping[0].regionId),
            eq(awardCharts.cabinClass, cabinClass)
          )
        );

      if (chartEntries.length === 0) continue;

      for (const chart of chartEntries) {
        const routeAvailable = await hasRouteAvailability(
          program.programId,
          program.allianceId,
          chart.partnerType,
          originCodes,
          destinationCodes
        );
        if (!routeAvailable) continue;

        const transferOptions = await getTransferOptions(
          program.programId,
          chart.minMiles,
          enabledCreditCardPrograms
        );

        results.push({
          airlineProgram: {
            id: program.programId,
            name: program.programName,
            code: program.programCode,
            hasDynamicPricing: program.hasDynamicPricing,
            pricingModel: program.pricingModel,
            searchUrl,
            alliance: program.allianceName,
          },
          awardCost: {
            minMiles: chart.minMiles,
            maxMiles: chart.maxMiles,
            typicalMiles: chart.typicalMiles,
            isOneWay: chart.isOneWay,
            notes: chart.notes,
          },
          originRegion: originMapping[0].regionName,
          destinationRegion: destMapping[0].regionName,
          transferOptions,
        });
      }
    }
  }

  // Sort by minimum miles required
  results.sort((a, b) => a.awardCost.minMiles - b.awardCost.minMiles);

  return results;
}

export async function getAirports() {
  return db.select().from(airports).orderBy(airports.city);
}

// Metro area display names
const METRO_NAMES: Record<string, string> = {
  NYC: "New York",
  CHI: "Chicago",
  WAS: "Washington D.C.",
  DFW: "Dallas/Fort Worth",
  MIA: "Miami",
  SFO: "San Francisco Bay Area",
  LON: "London",
  PAR: "Paris",
  TYO: "Tokyo",
  SEL: "Seoul",
  BJS: "Beijing",
  SHA: "Shanghai",
  OSA: "Osaka",
  BKK: "Bangkok",
  IST: "Istanbul",
  ROM: "Rome",
  MIL: "Milan",
  SAO: "São Paulo",
  RIO: "Rio de Janeiro",
  BUE: "Buenos Aires",
};

export interface SearchResult {
  code: string;
  name: string;
  city: string;
  country: string;
  isMetro?: boolean;
  airportCodes?: string[]; // For metro areas, list of airport codes
}

export async function searchAirports(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const upperQuery = query.toUpperCase();
  const lowerQuery = query.toLowerCase();

  const allAirports = await db.select().from(airports);

  // Build metro area groups
  const metroGroups = new Map<string, typeof allAirports>();
  for (const airport of allAirports) {
    if (airport.metro) {
      if (!metroGroups.has(airport.metro)) {
        metroGroups.set(airport.metro, []);
      }
      metroGroups.get(airport.metro)!.push(airport);
    }
  }

  const results: SearchResult[] = [];
  const addedMetros = new Set<string>();

  // Check if query matches any metro codes or metro names first
  for (const [metroCode, metroAirports] of metroGroups) {
    const metroName = METRO_NAMES[metroCode] || metroCode;
    if (
      metroCode.includes(upperQuery) ||
      metroName.toLowerCase().includes(lowerQuery)
    ) {
      if (!addedMetros.has(metroCode)) {
        results.push({
          code: metroCode,
          name: `All ${metroName} Airports`,
          city: metroName,
          country: metroAirports[0]?.country || "",
          isMetro: true,
          airportCodes: metroAirports.map((a) => a.code),
        });
        addedMetros.add(metroCode);
      }
    }
  }

  // Filter individual airports
  const matchingAirports = allAirports.filter(
    (airport) =>
      airport.code.toUpperCase().includes(upperQuery) ||
      airport.city.toLowerCase().includes(lowerQuery) ||
      airport.name.toLowerCase().includes(lowerQuery)
  );

  // Add metro options for cities with multiple airports (if not already added)
  for (const airport of matchingAirports) {
    if (airport.metro && !addedMetros.has(airport.metro)) {
      const metroAirports = metroGroups.get(airport.metro)!;
      const metroName = METRO_NAMES[airport.metro] || airport.metro;
      results.push({
        code: airport.metro,
        name: `All ${metroName} Airports`,
        city: metroName,
        country: airport.country,
        isMetro: true,
        airportCodes: metroAirports.map((a) => a.code),
      });
      addedMetros.add(airport.metro);
    }
  }

  // Add individual airports
  for (const airport of matchingAirports) {
    results.push({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      isMetro: false,
    });
  }

  return results.slice(0, 15);
}

export async function getCreditCardPrograms() {
  return db.select().from(creditCardPrograms);
}

// Resolve a code (metro or airport) to a list of airport codes
export async function resolveAirportCodes(code: string): Promise<string[]> {
  const allAirports = await db.select().from(airports);

  // Check if it's a metro code
  const metroAirports = allAirports.filter((a) => a.metro === code);
  if (metroAirports.length > 0) {
    return metroAirports.map((a) => a.code);
  }

  // Check if it's a direct airport code
  const directMatch = allAirports.find((a) => a.code === code);
  if (directMatch) {
    return [directMatch.code];
  }

  return [];
}

// Get metro info by code
export async function getMetroInfo(code: string): Promise<{
  code: string;
  name: string;
  airportCodes: string[];
} | null> {
  const allAirports = await db.select().from(airports);
  const metroAirports = allAirports.filter((a) => a.metro === code);

  if (metroAirports.length > 0) {
    return {
      code,
      name: METRO_NAMES[code] || code,
      airportCodes: metroAirports.map((a) => a.code),
    };
  }

  return null;
}
