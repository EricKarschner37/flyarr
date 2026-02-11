import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";
import airportsData from "../data/airports.json";

const connectionString = process.env.DATABASE_URL!;

async function seed() {
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Seed Alliances
  console.log("Seeding alliances...");
  await db
    .insert(schema.alliances)
    .values({ name: "Star Alliance", code: "STAR" })
    .onConflictDoNothing();
  await db
    .insert(schema.alliances)
    .values({ name: "OneWorld", code: "OW" })
    .onConflictDoNothing();
  await db
    .insert(schema.alliances)
    .values({ name: "SkyTeam", code: "ST" })
    .onConflictDoNothing();

  // Fetch alliances for use
  const alliances = await db.select().from(schema.alliances);
  const allianceMap = Object.fromEntries(alliances.map((a) => [a.code, a.id]));

  // Seed Credit Card Programs
  console.log("Seeding credit card programs...");
  await db
    .insert(schema.creditCardPrograms)
    .values([
      { name: "American Express Membership Rewards", code: "AMEX_MR" },
      { name: "Chase Ultimate Rewards", code: "CHASE_UR" },
      { name: "Citi ThankYou Points", code: "CITI_TY" },
      { name: "Capital One Miles", code: "CAPITAL_ONE" },
      { name: "Bilt Rewards", code: "BILT" },
    ])
    .onConflictDoNothing();

  const ccPrograms = await db.select().from(schema.creditCardPrograms);
  const ccMap = Object.fromEntries(ccPrograms.map((p) => [p.code, p.id]));

  // Seed Airline Programs
  console.log("Seeding airline programs...");
  await db
    .insert(schema.airlinePrograms)
    .values([
      // Star Alliance
      {
        name: "United MileagePlus",
        code: "UNITED",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: true,
        searchUrlTemplate:
          "https://www.united.com/en/us/fsr/choose-flights?f={origin}&t={destination}&d={date}&tt=1&at=1&sc=7&px=1&taxng=1&newHP=True&clm=7&st=bestmatches&tqp=A",
      },
      {
        name: "ANA Mileage Club",
        code: "ANA",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.ana.co.jp/en/us/amc/award-reservation/",
      },
      {
        name: "Air Canada Aeroplan",
        code: "AEROPLAN",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0={origin}&dest0={destination}&departureDate0={date}&ADT=1&YTH=0&CHD=0&INF=0&INS=0&marketCode=INT",
      },
      {
        name: "Avianca LifeMiles",
        code: "LIFEMILES",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.lifemiles.com/booking/flights",
      },
      {
        name: "Turkish Miles&Smiles",
        code: "TURKISH",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: false,
        searchUrlTemplate: "https://www.turkishairlines.com/en-int/",
      },
      // OneWorld
      {
        name: "American AAdvantage",
        code: "AADVANTAGE",
        allianceId: allianceMap.OW,
        hasDynamicPricing: true,
        searchUrlTemplate:
          "https://www.aa.com/booking/search?locale=en_US",
      },
      {
        name: "British Airways Executive Club",
        code: "AVIOS_BA",
        allianceId: allianceMap.OW,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.britishairways.com/travel/redeem/execclub/_gf/en_us",
      },
      {
        name: "Cathay Pacific Asia Miles",
        code: "ASIA_MILES",
        allianceId: allianceMap.OW,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.cathaypacific.com/cx/en_US/book-a-trip/redeem-flights/redeem-flight-awards.html",
      },
      {
        name: "Qantas Frequent Flyer",
        code: "QANTAS",
        allianceId: allianceMap.OW,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.qantas.com/au/en/book-a-trip/flights/use-points.html",
      },
      {
        name: "Alaska Mileage Plan",
        code: "ALASKA",
        allianceId: allianceMap.OW, // Now part of OneWorld
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.alaskaair.com/booking/flight-search",
      },
      // SkyTeam
      {
        name: "Delta SkyMiles",
        code: "DELTA",
        allianceId: allianceMap.ST,
        hasDynamicPricing: true,
        searchUrlTemplate:
          "https://www.delta.com/flight-search/search-results?bookingCode=AS&cacheKeySuffix=1234567890",
      },
      {
        name: "Air France/KLM Flying Blue",
        code: "FLYING_BLUE",
        allianceId: allianceMap.ST,
        hasDynamicPricing: true,
        searchUrlTemplate:
          "https://www.airfrance.us/FR/en/local/resainfovol/avancement/rechercherAvecMiles.do",
      },
      {
        name: "Korean Air SKYPASS",
        code: "KOREAN",
        allianceId: allianceMap.ST,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.koreanair.com/us/en/booking/booking/award",
      },
      // Non-alliance
      {
        name: "Singapore KrisFlyer",
        code: "KRISFLYER",
        allianceId: allianceMap.STAR,
        hasDynamicPricing: true,
        searchUrlTemplate:
          "https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/redeem/",
      },
      {
        name: "Emirates Skywards",
        code: "EMIRATES",
        allianceId: null,
        hasDynamicPricing: false,
        searchUrlTemplate:
          "https://www.emirates.com/us/english/plan-and-book/redeem-miles/",
      },
    ])
    .onConflictDoNothing();

  const airlinePrograms = await db.select().from(schema.airlinePrograms);
  const airlineMap = Object.fromEntries(
    airlinePrograms.map((p) => [p.code, p.id])
  );

  // Seed Transfer Partnerships
  console.log("Seeding transfer partnerships...");
  const transferPartnershipData = [
    // Amex MR transfers
    { cc: "AMEX_MR", airline: "ANA", ratio: "1.0", hours: 48 },
    { cc: "AMEX_MR", airline: "AEROPLAN", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "AVIOS_BA", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "DELTA", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "FLYING_BLUE", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "KRISFLYER", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "EMIRATES", ratio: "1.0", hours: 0 },
    { cc: "AMEX_MR", airline: "ASIA_MILES", ratio: "1.0", hours: 0 },
    // Chase UR transfers
    { cc: "CHASE_UR", airline: "UNITED", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "AEROPLAN", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "AVIOS_BA", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "FLYING_BLUE", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "KRISFLYER", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "KOREAN", ratio: "1.0", hours: 0 },
    { cc: "CHASE_UR", airline: "AADVANTAGE", ratio: "1.0", hours: 24 },
    // Citi TY transfers
    { cc: "CITI_TY", airline: "LIFEMILES", ratio: "1.0", hours: 0 },
    { cc: "CITI_TY", airline: "FLYING_BLUE", ratio: "1.0", hours: 0 },
    { cc: "CITI_TY", airline: "TURKISH", ratio: "1.0", hours: 0 },
    { cc: "CITI_TY", airline: "ASIA_MILES", ratio: "1.0", hours: 0 },
    { cc: "CITI_TY", airline: "QANTAS", ratio: "1.0", hours: 0 },
    { cc: "CITI_TY", airline: "KRISFLYER", ratio: "1.0", hours: 0 },
    // Capital One transfers
    { cc: "CAPITAL_ONE", airline: "LIFEMILES", ratio: "1.0", hours: 0 },
    { cc: "CAPITAL_ONE", airline: "FLYING_BLUE", ratio: "1.0", hours: 0 },
    { cc: "CAPITAL_ONE", airline: "TURKISH", ratio: "1.0", hours: 0 },
    { cc: "CAPITAL_ONE", airline: "AVIOS_BA", ratio: "1.0", hours: 0 },
    { cc: "CAPITAL_ONE", airline: "QANTAS", ratio: "1.0", hours: 0 },
    { cc: "CAPITAL_ONE", airline: "AEROPLAN", ratio: "1.0", hours: 0 },
    // Bilt transfers
    { cc: "BILT", airline: "AEROPLAN", ratio: "1.0", hours: 0 },
    { cc: "BILT", airline: "ANA", ratio: "1.0", hours: 48 },
    { cc: "BILT", airline: "UNITED", ratio: "1.0", hours: 0 },
    { cc: "BILT", airline: "AADVANTAGE", ratio: "1.0", hours: 0 },
    { cc: "BILT", airline: "AVIOS_BA", ratio: "1.0", hours: 0 },
    { cc: "BILT", airline: "FLYING_BLUE", ratio: "1.0", hours: 0 },
    { cc: "BILT", airline: "TURKISH", ratio: "1.0", hours: 0 },
  ];

  for (const tp of transferPartnershipData) {
    if (ccMap[tp.cc] && airlineMap[tp.airline]) {
      await db
        .insert(schema.transferPartnerships)
        .values({
          creditCardProgramId: ccMap[tp.cc],
          airlineProgramId: airlineMap[tp.airline],
          transferRatio: tp.ratio,
          transferTimeHours: tp.hours,
        })
        .onConflictDoNothing();
    }
  }

  // Seed Airports
  console.log("Seeding airports...");
  for (const airport of airportsData) {
    await db
      .insert(schema.airports)
      .values({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        countryCode: airport.countryCode,
        lat: String(airport.lat),
        lng: String(airport.lng),
        metro: airport.metro,
      })
      .onConflictDoNothing();
  }

  // Seed Regions for ANA (as an example of fixed award chart)
  console.log("Seeding regions...");
  const anaId = airlineMap.ANA;
  const anaRegions = [
    { programId: anaId, name: "Japan", code: "JAPAN" },
    { programId: anaId, name: "Korea", code: "KOREA" },
    { programId: anaId, name: "Asia 1", code: "ASIA1" }, // China, Hong Kong, Taiwan, etc.
    { programId: anaId, name: "Asia 2", code: "ASIA2" }, // Southeast Asia
    { programId: anaId, name: "Hawaii", code: "HAWAII" },
    { programId: anaId, name: "North America", code: "NA" },
    { programId: anaId, name: "Europe", code: "EUROPE" },
    { programId: anaId, name: "Oceania", code: "OCEANIA" },
  ];

  for (const region of anaRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  // Get ANA regions
  const regions = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, anaId));
  const anaRegionMap = Object.fromEntries(regions.map((r) => [r.code, r.id]));

  // Seed Airport-Region Mappings for ANA
  console.log("Seeding airport-region mappings...");
  const anaMappings = [
    // Japan
    { airports: ["NRT", "HND", "KIX", "NGO", "FUK", "CTS"], region: "JAPAN" },
    // Korea
    { airports: ["ICN", "GMP"], region: "KOREA" },
    // Asia 1 (China, HK, Taiwan)
    {
      airports: ["HKG", "TPE", "PEK", "PKX", "PVG", "SHA", "CAN", "SZX"],
      region: "ASIA1",
    },
    // Asia 2 (Southeast Asia)
    {
      airports: ["SIN", "BKK", "MNL", "KUL", "SGN", "HAN", "CGK"],
      region: "ASIA2",
    },
    // Hawaii
    { airports: ["HNL"], region: "HAWAII" },
    // North America
    {
      airports: [
        "JFK",
        "LAX",
        "SFO",
        "ORD",
        "MIA",
        "BOS",
        "SEA",
        "DFW",
        "ATL",
        "DEN",
        "IAD",
        "EWR",
        "PHX",
        "LAS",
        "YYZ",
        "YVR",
        "YUL",
        "YYC",
        "MEX",
        "CUN",
      ],
      region: "NA",
    },
    // Europe
    {
      airports: [
        "LHR",
        "LGW",
        "CDG",
        "ORY",
        "FRA",
        "MUC",
        "AMS",
        "MAD",
        "BCN",
        "FCO",
        "MXP",
        "ZRH",
        "VIE",
        "CPH",
        "ARN",
        "OSL",
        "HEL",
        "DUB",
        "LIS",
        "ATH",
        "IST",
      ],
      region: "EUROPE",
    },
    // Oceania
    {
      airports: ["SYD", "MEL", "BNE", "PER", "AKL"],
      region: "OCEANIA",
    },
  ];

  for (const mapping of anaMappings) {
    const regionId = anaRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: anaId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Seed ANA Award Chart (Round-trip prices, Business Class)
  console.log("Seeding award charts...");
  const anaBusinessCharts = [
    // From North America
    { from: "NA", to: "JAPAN", min: 75000, max: 75000, typical: 75000 },
    { from: "NA", to: "ASIA1", min: 85000, max: 85000, typical: 85000 },
    { from: "NA", to: "ASIA2", min: 90000, max: 90000, typical: 90000 },
    { from: "NA", to: "HAWAII", min: 60000, max: 60000, typical: 60000 },
    { from: "NA", to: "EUROPE", min: 88000, max: 88000, typical: 88000 },
    // From Japan
    { from: "JAPAN", to: "NA", min: 75000, max: 75000, typical: 75000 },
    { from: "JAPAN", to: "ASIA1", min: 40000, max: 40000, typical: 40000 },
    { from: "JAPAN", to: "ASIA2", min: 55000, max: 55000, typical: 55000 },
    { from: "JAPAN", to: "EUROPE", min: 80000, max: 80000, typical: 80000 },
    { from: "JAPAN", to: "HAWAII", min: 60000, max: 60000, typical: 60000 },
    { from: "JAPAN", to: "OCEANIA", min: 65000, max: 65000, typical: 65000 },
    // From Europe
    { from: "EUROPE", to: "JAPAN", min: 80000, max: 80000, typical: 80000 },
    { from: "EUROPE", to: "NA", min: 88000, max: 88000, typical: 88000 },
  ];

  for (const chart of anaBusinessCharts) {
    const originId = anaRegionMap[chart.from];
    const destId = anaRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: anaId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: "business",
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: false,
          notes: "ANA partner award - round-trip",
        })
        .onConflictDoNothing();
    }
  }

  // Add similar data for Aeroplan (simplified)
  const aeroplanId = airlineMap.AEROPLAN;
  const aeroplanRegions = [
    { programId: aeroplanId, name: "North America - Short", code: "NA_SHORT" },
    { programId: aeroplanId, name: "North America - Long", code: "NA_LONG" },
    { programId: aeroplanId, name: "Pacific", code: "PACIFIC" },
    { programId: aeroplanId, name: "Atlantic", code: "ATLANTIC" },
    { programId: aeroplanId, name: "South America", code: "SA" },
  ];

  for (const region of aeroplanRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const aeroplanRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, aeroplanId));
  const aeroplanRegionMap = Object.fromEntries(
    aeroplanRegionsDb.map((r) => [r.code, r.id])
  );

  // Aeroplan airport mappings
  const aeroplanMappings = [
    {
      airports: [
        "JFK",
        "LAX",
        "SFO",
        "ORD",
        "MIA",
        "BOS",
        "SEA",
        "DFW",
        "ATL",
        "DEN",
        "IAD",
        "EWR",
        "PHX",
        "LAS",
        "HNL",
        "YYZ",
        "YVR",
        "YUL",
        "YYC",
        "MEX",
        "CUN",
      ],
      region: "NA_LONG",
    },
    {
      airports: [
        "NRT",
        "HND",
        "KIX",
        "ICN",
        "HKG",
        "SIN",
        "BKK",
        "TPE",
        "SYD",
        "MEL",
        "AKL",
        "PEK",
        "PVG",
      ],
      region: "PACIFIC",
    },
    {
      airports: [
        "LHR",
        "CDG",
        "FRA",
        "AMS",
        "MAD",
        "BCN",
        "FCO",
        "ZRH",
        "VIE",
        "IST",
        "DXB",
        "DOH",
      ],
      region: "ATLANTIC",
    },
    {
      airports: ["GRU", "GIG", "EZE", "SCL", "BOG", "LIM"],
      region: "SA",
    },
  ];

  for (const mapping of aeroplanMappings) {
    const regionId = aeroplanRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: aeroplanId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Aeroplan Business Class charts (one-way)
  const aeroplanBusinessCharts = [
    {
      from: "NA_LONG",
      to: "PACIFIC",
      min: 75000,
      max: 75000,
      typical: 75000,
      notes: "Fixed rate",
    },
    {
      from: "NA_LONG",
      to: "ATLANTIC",
      min: 60000,
      max: 60000,
      typical: 60000,
      notes: "Fixed rate",
    },
    {
      from: "NA_LONG",
      to: "SA",
      min: 55000,
      max: 55000,
      typical: 55000,
      notes: "Fixed rate",
    },
  ];

  for (const chart of aeroplanBusinessCharts) {
    const originId = aeroplanRegionMap[chart.from];
    const destId = aeroplanRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: aeroplanId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: "business",
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add United (dynamic pricing example)
  const unitedId = airlineMap.UNITED;
  const unitedRegions = [
    { programId: unitedId, name: "Domestic US", code: "US" },
    { programId: unitedId, name: "Japan", code: "JAPAN" },
    { programId: unitedId, name: "Europe", code: "EUROPE" },
    { programId: unitedId, name: "Asia Pacific", code: "APAC" },
  ];

  for (const region of unitedRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const unitedRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, unitedId));
  const unitedRegionMap = Object.fromEntries(
    unitedRegionsDb.map((r) => [r.code, r.id])
  );

  // United airport mappings
  const unitedMappings = [
    {
      airports: [
        "JFK",
        "LAX",
        "SFO",
        "ORD",
        "MIA",
        "BOS",
        "SEA",
        "DFW",
        "ATL",
        "DEN",
        "IAD",
        "EWR",
        "PHX",
        "LAS",
        "HNL",
      ],
      region: "US",
    },
    { airports: ["NRT", "HND", "KIX", "NGO", "FUK"], region: "JAPAN" },
    {
      airports: [
        "LHR",
        "CDG",
        "FRA",
        "AMS",
        "MAD",
        "FCO",
        "ZRH",
        "VIE",
        "IST",
      ],
      region: "EUROPE",
    },
    {
      airports: [
        "ICN",
        "HKG",
        "SIN",
        "BKK",
        "TPE",
        "PEK",
        "PVG",
        "SYD",
        "MEL",
      ],
      region: "APAC",
    },
  ];

  for (const mapping of unitedMappings) {
    const regionId = unitedRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: unitedId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // United dynamic pricing (ranges)
  const unitedBusinessCharts = [
    {
      from: "US",
      to: "JAPAN",
      min: 70000,
      max: 180000,
      typical: 88000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "EUROPE",
      min: 60000,
      max: 150000,
      typical: 77000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "APAC",
      min: 75000,
      max: 200000,
      typical: 100000,
      notes: "Dynamic pricing",
    },
  ];

  for (const chart of unitedBusinessCharts) {
    const originId = unitedRegionMap[chart.from];
    const destId = unitedRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: unitedId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: "business",
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add United domestic charts (economy and business)
  const unitedDomesticCharts = [
    // Economy
    {
      from: "US",
      to: "US",
      cabin: "economy",
      min: 5000,
      max: 17500,
      typical: 12500,
      notes: "Dynamic pricing - short haul to transcontinental",
    },
    // Business/First
    {
      from: "US",
      to: "US",
      cabin: "business",
      min: 12000,
      max: 50000,
      typical: 30000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "US",
      cabin: "first",
      min: 15000,
      max: 70000,
      typical: 40000,
      notes: "Dynamic pricing",
    },
  ];

  for (const chart of unitedDomesticCharts) {
    const originId = unitedRegionMap[chart.from];
    const destId = unitedRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: unitedId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: chart.cabin,
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add American Airlines (AAdvantage) domestic charts
  const aaId = airlineMap.AADVANTAGE;
  const aaRegions = [
    { programId: aaId, name: "Domestic US", code: "US" },
    { programId: aaId, name: "Hawaii", code: "HAWAII" },
    { programId: aaId, name: "Europe", code: "EUROPE" },
    { programId: aaId, name: "Asia Pacific", code: "APAC" },
  ];

  for (const region of aaRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const aaRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, aaId));
  const aaRegionMap = Object.fromEntries(aaRegionsDb.map((r) => [r.code, r.id]));

  // American Airlines airport mappings
  const aaMappings = [
    {
      airports: [
        "JFK",
        "LAX",
        "SFO",
        "ORD",
        "MIA",
        "BOS",
        "SEA",
        "DFW",
        "ATL",
        "DEN",
        "IAD",
        "EWR",
        "PHX",
        "LAS",
        "CLT",
        "PHL",
      ],
      region: "US",
    },
    { airports: ["HNL", "OGG", "KOA", "LIH"], region: "HAWAII" },
    {
      airports: ["LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "BCN", "DUB"],
      region: "EUROPE",
    },
    {
      airports: ["NRT", "HND", "HKG", "SYD", "MEL", "AKL"],
      region: "APAC",
    },
  ];

  for (const mapping of aaMappings) {
    const regionId = aaRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: aaId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // American Airlines domestic charts
  const aaCharts = [
    {
      from: "US",
      to: "US",
      cabin: "economy",
      min: 7500,
      max: 35000,
      typical: 12500,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "US",
      cabin: "business",
      min: 15000,
      max: 60000,
      typical: 25000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "US",
      cabin: "first",
      min: 15000,
      max: 70000,
      typical: 30000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "HAWAII",
      cabin: "economy",
      min: 22500,
      max: 50000,
      typical: 35000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "EUROPE",
      cabin: "business",
      min: 57500,
      max: 150000,
      typical: 85000,
      notes: "Dynamic pricing",
    },
  ];

  for (const chart of aaCharts) {
    const originId = aaRegionMap[chart.from];
    const destId = aaRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: aaId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: chart.cabin,
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add Delta SkyMiles domestic charts
  const deltaId = airlineMap.DELTA;
  const deltaRegions = [
    { programId: deltaId, name: "Domestic US", code: "US" },
    { programId: deltaId, name: "Hawaii", code: "HAWAII" },
    { programId: deltaId, name: "Europe", code: "EUROPE" },
    { programId: deltaId, name: "Asia Pacific", code: "APAC" },
  ];

  for (const region of deltaRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const deltaRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, deltaId));
  const deltaRegionMap = Object.fromEntries(
    deltaRegionsDb.map((r) => [r.code, r.id])
  );

  // Delta airport mappings
  const deltaMappings = [
    {
      airports: [
        "JFK",
        "LAX",
        "SFO",
        "ORD",
        "MIA",
        "BOS",
        "SEA",
        "DFW",
        "ATL",
        "DEN",
        "IAD",
        "EWR",
        "PHX",
        "LAS",
        "MSP",
        "DTW",
        "SLC",
      ],
      region: "US",
    },
    { airports: ["HNL", "OGG", "KOA", "LIH"], region: "HAWAII" },
    {
      airports: ["LHR", "CDG", "FRA", "AMS", "FCO", "BCN", "MUC"],
      region: "EUROPE",
    },
    {
      airports: ["NRT", "HND", "ICN", "PVG", "SYD"],
      region: "APAC",
    },
  ];

  for (const mapping of deltaMappings) {
    const regionId = deltaRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: deltaId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Delta domestic charts
  const deltaCharts = [
    {
      from: "US",
      to: "US",
      cabin: "economy",
      min: 5000,
      max: 40000,
      typical: 15000,
      notes: "Dynamic pricing - varies widely",
    },
    {
      from: "US",
      to: "US",
      cabin: "business",
      min: 15000,
      max: 80000,
      typical: 35000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "US",
      cabin: "first",
      min: 20000,
      max: 100000,
      typical: 45000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "HAWAII",
      cabin: "economy",
      min: 20000,
      max: 60000,
      typical: 35000,
      notes: "Dynamic pricing",
    },
    {
      from: "US",
      to: "EUROPE",
      cabin: "business",
      min: 75000,
      max: 250000,
      typical: 120000,
      notes: "Dynamic pricing - Delta One",
    },
  ];

  for (const chart of deltaCharts) {
    const originId = deltaRegionMap[chart.from];
    const destId = deltaRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: deltaId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: chart.cabin,
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add Alaska Mileage Plan domestic charts (distance-based, fixed pricing)
  const alaskaId = airlineMap.ALASKA;
  const alaskaRegions = [
    { programId: alaskaId, name: "Short Haul (under 700mi)", code: "SHORT" },
    { programId: alaskaId, name: "Medium Haul (700-1400mi)", code: "MEDIUM" },
    { programId: alaskaId, name: "Long Haul (1400-2100mi)", code: "LONG" },
    { programId: alaskaId, name: "Transcontinental (2100+mi)", code: "TRANSCON" },
    { programId: alaskaId, name: "Hawaii", code: "HAWAII" },
  ];

  for (const region of alaskaRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const alaskaRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, alaskaId));
  const alaskaRegionMap = Object.fromEntries(
    alaskaRegionsDb.map((r) => [r.code, r.id])
  );

  // Alaska uses distance-based pricing, so we map airports to distance bands
  // For simplicity, we'll categorize common routes
  const alaskaMappings = [
    // Short haul examples (SEA-PDX, LAX-SFO, etc.)
    { airports: ["SEA", "PDX", "SFO", "SJC", "OAK"], region: "SHORT" },
    // Medium haul (SEA-LAX, SFO-PHX, etc.)
    { airports: ["LAX", "PHX", "DEN", "SLC"], region: "MEDIUM" },
    // Long haul (SEA-DFW, LAX-ORD, etc.)
    { airports: ["DFW", "ORD", "MSP", "ATL"], region: "LONG" },
    // Transcontinental (SEA-JFK, LAX-BOS, etc.)
    { airports: ["JFK", "EWR", "BOS", "IAD", "MIA"], region: "TRANSCON" },
    { airports: ["HNL", "OGG", "KOA", "LIH"], region: "HAWAII" },
  ];

  for (const mapping of alaskaMappings) {
    const regionId = alaskaRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: alaskaId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Alaska charts (distance-based fixed pricing)
  const alaskaCharts = [
    // Short haul
    {
      from: "SHORT",
      to: "SHORT",
      cabin: "economy",
      min: 4500,
      max: 4500,
      typical: 4500,
      notes: "Fixed - under 700 miles",
    },
    {
      from: "SHORT",
      to: "SHORT",
      cabin: "first",
      min: 13500,
      max: 13500,
      typical: 13500,
      notes: "Fixed - under 700 miles",
    },
    // Medium haul
    {
      from: "SHORT",
      to: "MEDIUM",
      cabin: "economy",
      min: 7500,
      max: 7500,
      typical: 7500,
      notes: "Fixed - 700-1400 miles",
    },
    {
      from: "SHORT",
      to: "MEDIUM",
      cabin: "first",
      min: 22500,
      max: 22500,
      typical: 22500,
      notes: "Fixed - 700-1400 miles",
    },
    // Long haul
    {
      from: "SHORT",
      to: "LONG",
      cabin: "economy",
      min: 12500,
      max: 12500,
      typical: 12500,
      notes: "Fixed - 1400-2100 miles",
    },
    {
      from: "SHORT",
      to: "LONG",
      cabin: "first",
      min: 37500,
      max: 37500,
      typical: 37500,
      notes: "Fixed - 1400-2100 miles",
    },
    // Transcontinental
    {
      from: "SHORT",
      to: "TRANSCON",
      cabin: "economy",
      min: 17500,
      max: 17500,
      typical: 17500,
      notes: "Fixed - 2100+ miles",
    },
    {
      from: "SHORT",
      to: "TRANSCON",
      cabin: "first",
      min: 52500,
      max: 52500,
      typical: 52500,
      notes: "Fixed - 2100+ miles",
    },
    // Hawaii
    {
      from: "SHORT",
      to: "HAWAII",
      cabin: "economy",
      min: 17500,
      max: 17500,
      typical: 17500,
      notes: "Fixed pricing",
    },
    {
      from: "SHORT",
      to: "HAWAII",
      cabin: "first",
      min: 52500,
      max: 52500,
      typical: 52500,
      notes: "Fixed pricing",
    },
  ];

  for (const chart of alaskaCharts) {
    const originId = alaskaRegionMap[chart.from];
    const destId = alaskaRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: alaskaId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: chart.cabin,
          partnerType: "any",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Add British Airways Avios domestic US charts (for AA flights)
  const aviosId = airlineMap.AVIOS_BA;
  const aviosRegions = [
    { programId: aviosId, name: "Short Haul (under 650mi)", code: "SHORT" },
    { programId: aviosId, name: "Zone 2 (651-1150mi)", code: "ZONE2" },
    { programId: aviosId, name: "Zone 3 (1151-2000mi)", code: "ZONE3" },
    { programId: aviosId, name: "Zone 4 (2001-3000mi)", code: "ZONE4" },
    { programId: aviosId, name: "Europe", code: "EUROPE" },
  ];

  for (const region of aviosRegions) {
    await db.insert(schema.regions).values(region).onConflictDoNothing();
  }

  const aviosRegionsDb = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.programId, aviosId));
  const aviosRegionMap = Object.fromEntries(
    aviosRegionsDb.map((r) => [r.code, r.id])
  );

  // Avios uses distance-based pricing for AA/Alaska flights
  const aviosMappings = [
    // Short haul examples
    { airports: ["DCA", "PHL", "BOS", "JFK", "EWR"], region: "SHORT" },
    // Zone 2
    { airports: ["CLT", "ATL", "ORD", "DTW"], region: "ZONE2" },
    // Zone 3
    { airports: ["DFW", "MIA", "DEN", "MSP"], region: "ZONE3" },
    // Zone 4 (transcontinental)
    { airports: ["LAX", "SFO", "SEA", "PHX", "LAS"], region: "ZONE4" },
    // Europe
    { airports: ["LHR", "LGW", "CDG", "MAD", "BCN", "DUB"], region: "EUROPE" },
  ];

  for (const mapping of aviosMappings) {
    const regionId = aviosRegionMap[mapping.region];
    if (regionId) {
      for (const airportCode of mapping.airports) {
        await db
          .insert(schema.airportRegionMappings)
          .values({
            airportCode,
            regionId,
            programId: aviosId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Avios charts (distance-based fixed pricing for AA flights - post Dec 2025)
  const aviosCharts = [
    // Short haul (under 650 miles)
    {
      from: "SHORT",
      to: "SHORT",
      cabin: "economy",
      min: 13500,
      max: 13500,
      typical: 13500,
      notes: "Fixed - under 650 miles on AA",
    },
    {
      from: "SHORT",
      to: "SHORT",
      cabin: "business",
      min: 27000,
      max: 27000,
      typical: 27000,
      notes: "Fixed - under 650 miles on AA",
    },
    // Zone 2 (651-1150 miles)
    {
      from: "SHORT",
      to: "ZONE2",
      cabin: "economy",
      min: 18000,
      max: 18000,
      typical: 18000,
      notes: "Fixed - 651-1150 miles on AA",
    },
    {
      from: "SHORT",
      to: "ZONE2",
      cabin: "business",
      min: 36000,
      max: 36000,
      typical: 36000,
      notes: "Fixed - 651-1150 miles on AA",
    },
    // Zone 3 (1151-2000 miles)
    {
      from: "SHORT",
      to: "ZONE3",
      cabin: "economy",
      min: 20500,
      max: 20500,
      typical: 20500,
      notes: "Fixed - 1151-2000 miles on AA",
    },
    {
      from: "SHORT",
      to: "ZONE3",
      cabin: "business",
      min: 45500,
      max: 45500,
      typical: 45500,
      notes: "Fixed - 1151-2000 miles on AA",
    },
    // Zone 4 (2001-3000 miles - transcontinental)
    {
      from: "SHORT",
      to: "ZONE4",
      cabin: "economy",
      min: 22500,
      max: 22500,
      typical: 22500,
      notes: "Fixed - 2001-3000 miles on AA",
    },
    {
      from: "SHORT",
      to: "ZONE4",
      cabin: "business",
      min: 56500,
      max: 56500,
      typical: 56500,
      notes: "Fixed - 2001-3000 miles on AA",
    },
    // Europe
    {
      from: "SHORT",
      to: "EUROPE",
      cabin: "economy",
      min: 26000,
      max: 26000,
      typical: 26000,
      notes: "Fixed pricing",
    },
    {
      from: "SHORT",
      to: "EUROPE",
      cabin: "business",
      min: 52000,
      max: 52000,
      typical: 52000,
      notes: "Fixed pricing",
    },
  ];

  for (const chart of aviosCharts) {
    const originId = aviosRegionMap[chart.from];
    const destId = aviosRegionMap[chart.to];
    if (originId && destId) {
      await db
        .insert(schema.awardCharts)
        .values({
          programId: aviosId,
          originRegionId: originId,
          destinationRegionId: destId,
          cabinClass: chart.cabin,
          partnerType: "partner",
          minMiles: chart.min,
          maxMiles: chart.max,
          typicalMiles: chart.typical,
          isOneWay: true,
          notes: chart.notes,
        })
        .onConflictDoNothing();
    }
  }

  // Seed Airline Routes (which airport pairs each airline operates)
  console.log("Seeding airline routes...");

  // Helper to add routes (adds both directions)
  async function addRoutes(
    airlineId: number,
    routes: Array<{ from: string; to: string }>
  ) {
    for (const route of routes) {
      // Add both directions for each route
      await db
        .insert(schema.airlineRoutes)
        .values({
          airlineProgramId: airlineId,
          originAirportCode: route.from,
          destinationAirportCode: route.to,
        })
        .onConflictDoNothing();
      await db
        .insert(schema.airlineRoutes)
        .values({
          airlineProgramId: airlineId,
          originAirportCode: route.to,
          destinationAirportCode: route.from,
        })
        .onConflictDoNothing();
    }
  }

  // United routes (major hubs: EWR, ORD, IAD, DEN, SFO, LAX, IAH)
  const unitedRoutes = [
    // EWR hub routes
    { from: "EWR", to: "LAX" },
    { from: "EWR", to: "SFO" },
    { from: "EWR", to: "ORD" },
    { from: "EWR", to: "DEN" },
    { from: "EWR", to: "MIA" },
    { from: "EWR", to: "LHR" },
    { from: "EWR", to: "FRA" },
    { from: "EWR", to: "NRT" },
    { from: "EWR", to: "HND" },
    // ORD hub routes
    { from: "ORD", to: "LAX" },
    { from: "ORD", to: "SFO" },
    { from: "ORD", to: "DEN" },
    { from: "ORD", to: "NRT" },
    { from: "ORD", to: "LHR" },
    { from: "ORD", to: "FRA" },
    // SFO hub routes
    { from: "SFO", to: "NRT" },
    { from: "SFO", to: "HND" },
    { from: "SFO", to: "HKG" },
    { from: "SFO", to: "SIN" },
    { from: "SFO", to: "SYD" },
    { from: "SFO", to: "DEN" },
    { from: "SFO", to: "LAX" },
    // LAX hub routes
    { from: "LAX", to: "NRT" },
    { from: "LAX", to: "HND" },
    { from: "LAX", to: "SYD" },
    { from: "LAX", to: "MEL" },
    { from: "LAX", to: "LHR" },
    { from: "LAX", to: "DEN" },
    // DEN hub routes
    { from: "DEN", to: "NRT" },
    { from: "DEN", to: "LHR" },
    { from: "DEN", to: "FRA" },
    // IAD routes
    { from: "IAD", to: "LHR" },
    { from: "IAD", to: "FRA" },
    { from: "IAD", to: "NRT" },
    // HNL routes
    { from: "SFO", to: "HNL" },
    { from: "LAX", to: "HNL" },
    { from: "DEN", to: "HNL" },
  ];
  await addRoutes(unitedId, unitedRoutes);

  // ANA routes (hub: NRT, HND)
  const anaRoutes = [
    // To North America
    { from: "NRT", to: "JFK" },
    { from: "NRT", to: "LAX" },
    { from: "NRT", to: "SFO" },
    { from: "NRT", to: "ORD" },
    { from: "NRT", to: "IAD" },
    { from: "NRT", to: "SEA" },
    { from: "NRT", to: "YVR" },
    { from: "HND", to: "JFK" },
    { from: "HND", to: "LAX" },
    { from: "HND", to: "SFO" },
    { from: "HND", to: "ORD" },
    // To Europe
    { from: "NRT", to: "LHR" },
    { from: "NRT", to: "FRA" },
    { from: "NRT", to: "CDG" },
    { from: "HND", to: "LHR" },
    { from: "HND", to: "FRA" },
    // To Asia
    { from: "NRT", to: "HKG" },
    { from: "NRT", to: "SIN" },
    { from: "NRT", to: "BKK" },
    { from: "NRT", to: "PEK" },
    { from: "NRT", to: "PVG" },
    { from: "HND", to: "HKG" },
    { from: "HND", to: "ICN" },
    // To Oceania
    { from: "NRT", to: "SYD" },
    { from: "HND", to: "SYD" },
    // To Hawaii
    { from: "NRT", to: "HNL" },
    { from: "HND", to: "HNL" },
    // Domestic Japan (sample)
    { from: "HND", to: "KIX" },
    { from: "HND", to: "CTS" },
    { from: "HND", to: "FUK" },
  ];
  await addRoutes(anaId, anaRoutes);

  // American Airlines routes (hubs: DFW, CLT, MIA, ORD, PHX, PHL, LAX, JFK)
  const aaRoutes = [
    // DFW hub
    { from: "DFW", to: "JFK" },
    { from: "DFW", to: "LAX" },
    { from: "DFW", to: "MIA" },
    { from: "DFW", to: "ORD" },
    { from: "DFW", to: "LHR" },
    { from: "DFW", to: "NRT" },
    { from: "DFW", to: "HKG" },
    { from: "DFW", to: "HNL" },
    // JFK routes
    { from: "JFK", to: "LAX" },
    { from: "JFK", to: "MIA" },
    { from: "JFK", to: "LHR" },
    { from: "JFK", to: "CDG" },
    { from: "JFK", to: "NRT" },
    // LAX routes
    { from: "LAX", to: "SYD" },
    { from: "LAX", to: "HKG" },
    { from: "LAX", to: "NRT" },
    { from: "LAX", to: "LHR" },
    { from: "LAX", to: "HNL" },
    // MIA routes
    { from: "MIA", to: "LHR" },
    { from: "MIA", to: "MAD" },
    { from: "MIA", to: "GRU" },
    // CLT routes
    { from: "CLT", to: "JFK" },
    { from: "CLT", to: "LAX" },
    { from: "CLT", to: "LHR" },
    // PHX routes
    { from: "PHX", to: "JFK" },
    { from: "PHX", to: "DFW" },
  ];
  await addRoutes(aaId, aaRoutes);

  // Delta routes (hubs: ATL, MSP, DTW, SLC, SEA, LAX, JFK, BOS)
  const deltaRoutes = [
    // ATL hub (major international gateway)
    { from: "ATL", to: "JFK" },
    { from: "ATL", to: "LAX" },
    { from: "ATL", to: "MIA" },
    { from: "ATL", to: "ORD" },
    { from: "ATL", to: "DEN" },
    { from: "ATL", to: "LHR" },
    { from: "ATL", to: "CDG" },
    { from: "ATL", to: "AMS" },
    { from: "ATL", to: "NRT" },
    { from: "ATL", to: "ICN" },
    { from: "ATL", to: "HNL" },
    // JFK routes
    { from: "JFK", to: "LAX" },
    { from: "JFK", to: "SFO" },
    { from: "JFK", to: "LHR" },
    { from: "JFK", to: "CDG" },
    { from: "JFK", to: "FCO" },
    { from: "JFK", to: "BCN" },
    // LAX routes
    { from: "LAX", to: "SYD" },
    { from: "LAX", to: "NRT" },
    { from: "LAX", to: "PVG" },
    { from: "LAX", to: "HNL" },
    // SEA routes
    { from: "SEA", to: "NRT" },
    { from: "SEA", to: "ICN" },
    { from: "SEA", to: "AMS" },
    { from: "SEA", to: "LHR" },
    // MSP routes
    { from: "MSP", to: "AMS" },
    { from: "MSP", to: "CDG" },
    { from: "MSP", to: "ICN" },
    // DTW routes
    { from: "DTW", to: "AMS" },
    { from: "DTW", to: "CDG" },
    { from: "DTW", to: "NRT" },
    // DEN routes (no direct United competitor routes to match reality)
    { from: "DEN", to: "ATL" },
    { from: "DEN", to: "MSP" },
    { from: "DEN", to: "JFK" },
  ];
  await addRoutes(deltaId, deltaRoutes);

  // Alaska routes (hubs: SEA, LAX, SFO, PDX, ANC)
  const alaskaRoutes = [
    // SEA hub
    { from: "SEA", to: "LAX" },
    { from: "SEA", to: "SFO" },
    { from: "SEA", to: "PDX" },
    { from: "SEA", to: "ANC" },
    { from: "SEA", to: "JFK" },
    { from: "SEA", to: "BOS" },
    { from: "SEA", to: "DFW" },
    { from: "SEA", to: "PHX" },
    { from: "SEA", to: "DEN" },
    { from: "SEA", to: "HNL" },
    { from: "SEA", to: "OGG" },
    { from: "SEA", to: "KOA" },
    { from: "SEA", to: "LIH" },
    // LAX routes
    { from: "LAX", to: "SFO" },
    { from: "LAX", to: "PDX" },
    { from: "LAX", to: "JFK" },
    { from: "LAX", to: "BOS" },
    { from: "LAX", to: "HNL" },
    { from: "LAX", to: "OGG" },
    // SFO routes
    { from: "SFO", to: "JFK" },
    { from: "SFO", to: "BOS" },
    { from: "SFO", to: "HNL" },
    // PDX routes
    { from: "PDX", to: "HNL" },
    { from: "PDX", to: "PHX" },
    { from: "PDX", to: "DEN" },
    // Note: Alaska doesn't fly NYC to DEN - this is the scenario the user mentioned
  ];
  await addRoutes(alaskaId, alaskaRoutes);

  // Aeroplan (Air Canada) routes (hubs: YYZ, YVR, YUL, YYC)
  const aeroplanRoutes = [
    // YYZ hub
    { from: "YYZ", to: "JFK" },
    { from: "YYZ", to: "LAX" },
    { from: "YYZ", to: "SFO" },
    { from: "YYZ", to: "ORD" },
    { from: "YYZ", to: "DEN" },
    { from: "YYZ", to: "LHR" },
    { from: "YYZ", to: "FRA" },
    { from: "YYZ", to: "CDG" },
    { from: "YYZ", to: "NRT" },
    { from: "YYZ", to: "HND" },
    { from: "YYZ", to: "HKG" },
    { from: "YYZ", to: "PVG" },
    { from: "YYZ", to: "GRU" },
    // YVR hub
    { from: "YVR", to: "NRT" },
    { from: "YVR", to: "HND" },
    { from: "YVR", to: "HKG" },
    { from: "YVR", to: "SYD" },
    { from: "YVR", to: "LHR" },
    { from: "YVR", to: "SFO" },
    { from: "YVR", to: "LAX" },
    // YUL hub
    { from: "YUL", to: "CDG" },
    { from: "YUL", to: "LHR" },
    { from: "YUL", to: "FRA" },
    { from: "YUL", to: "NRT" },
  ];
  await addRoutes(aeroplanId, aeroplanRoutes);

  // Turkish Airlines routes (hub: IST)
  const turkishId = airlineMap.TURKISH;
  const turkishRoutes = [
    // North America
    { from: "IST", to: "JFK" },
    { from: "IST", to: "LAX" },
    { from: "IST", to: "ORD" },
    { from: "IST", to: "SFO" },
    { from: "IST", to: "MIA" },
    { from: "IST", to: "ATL" },
    { from: "IST", to: "DFW" },
    { from: "IST", to: "IAH" },
    { from: "IST", to: "SEA" },
    { from: "IST", to: "BOS" },
    { from: "IST", to: "IAD" },
    { from: "IST", to: "DEN" },
    { from: "IST", to: "DTW" },
    { from: "IST", to: "YUL" },
    { from: "IST", to: "YYZ" },
    { from: "IST", to: "YVR" },
    { from: "IST", to: "MEX" },
    { from: "IST", to: "CUN" },
    // South America
    { from: "IST", to: "GRU" },
    { from: "IST", to: "EZE" },
    { from: "IST", to: "BOG" },
    { from: "IST", to: "SCL" },
    // Europe
    { from: "IST", to: "LHR" },
    { from: "IST", to: "LGW" },
    { from: "IST", to: "CDG" },
    { from: "IST", to: "FRA" },
    { from: "IST", to: "MUC" },
    { from: "IST", to: "AMS" },
    { from: "IST", to: "MAD" },
    { from: "IST", to: "BCN" },
    { from: "IST", to: "FCO" },
    { from: "IST", to: "MXP" },
    { from: "IST", to: "ZRH" },
    { from: "IST", to: "VIE" },
    { from: "IST", to: "DUB" },
    { from: "IST", to: "LIS" },
    { from: "IST", to: "CPH" },
    { from: "IST", to: "ARN" },
    { from: "IST", to: "HEL" },
    { from: "IST", to: "OSL" },
    { from: "IST", to: "ATH" },
    // Middle East & Africa
    { from: "IST", to: "DXB" },
    { from: "IST", to: "AUH" },
    { from: "IST", to: "DOH" },
    { from: "IST", to: "TLV" },
    { from: "IST", to: "JNB" },
    { from: "IST", to: "CPT" },
    { from: "IST", to: "CAI" },
    // Asia
    { from: "IST", to: "NRT" },
    { from: "IST", to: "HND" },
    { from: "IST", to: "KIX" },
    { from: "IST", to: "ICN" },
    { from: "IST", to: "PVG" },
    { from: "IST", to: "PEK" },
    { from: "IST", to: "HKG" },
    { from: "IST", to: "TPE" },
    { from: "IST", to: "SIN" },
    { from: "IST", to: "KUL" },
    { from: "IST", to: "BKK" },
    { from: "IST", to: "SGN" },
    { from: "IST", to: "HAN" },
    { from: "IST", to: "MNL" },
    { from: "IST", to: "CGK" },
    { from: "IST", to: "DEL" },
    { from: "IST", to: "BOM" },
    // Oceania
    { from: "IST", to: "SYD" },
    { from: "IST", to: "MEL" },
  ];
  if (turkishId) await addRoutes(turkishId, turkishRoutes);

  // British Airways routes (hub: LHR)
  const baId = airlineMap.AVIOS_BA;
  const baRoutes = [
    // North America
    { from: "LHR", to: "JFK" },
    { from: "LHR", to: "LAX" },
    { from: "LHR", to: "SFO" },
    { from: "LHR", to: "BOS" },
    { from: "LHR", to: "MIA" },
    { from: "LHR", to: "ORD" },
    { from: "LHR", to: "DFW" },
    { from: "LHR", to: "IAD" },
    { from: "LHR", to: "EWR" },
    { from: "LHR", to: "SEA" },
    { from: "LHR", to: "ATL" },
    { from: "LHR", to: "DEN" },
    { from: "LHR", to: "PHX" },
    { from: "LHR", to: "LAS" },
    { from: "LHR", to: "SAN" },
    { from: "LHR", to: "IAH" },
    { from: "LHR", to: "AUS" },
    { from: "LHR", to: "BNA" },
    { from: "LHR", to: "PHL" },
    { from: "LHR", to: "YYZ" },
    { from: "LHR", to: "YVR" },
    { from: "LHR", to: "YUL" },
    { from: "LHR", to: "MEX" },
    { from: "LHR", to: "CUN" },
    // Europe
    { from: "LHR", to: "CDG" },
    { from: "LHR", to: "AMS" },
    { from: "LHR", to: "FRA" },
    { from: "LHR", to: "MUC" },
    { from: "LHR", to: "ZRH" },
    { from: "LHR", to: "BCN" },
    { from: "LHR", to: "MAD" },
    { from: "LHR", to: "FCO" },
    { from: "LHR", to: "MXP" },
    { from: "LHR", to: "LIS" },
    { from: "LHR", to: "DUB" },
    { from: "LHR", to: "ATH" },
    { from: "LHR", to: "CPH" },
    { from: "LHR", to: "ARN" },
    { from: "LHR", to: "OSL" },
    { from: "LHR", to: "HEL" },
    { from: "LHR", to: "VIE" },
    { from: "LHR", to: "IST" },
    // Middle East
    { from: "LHR", to: "DXB" },
    { from: "LHR", to: "AUH" },
    { from: "LHR", to: "DOH" },
    { from: "LHR", to: "TLV" },
    // Asia
    { from: "LHR", to: "DEL" },
    { from: "LHR", to: "BOM" },
    { from: "LHR", to: "HKG" },
    { from: "LHR", to: "SIN" },
    { from: "LHR", to: "BKK" },
    { from: "LHR", to: "KUL" },
    { from: "LHR", to: "HND" },
    { from: "LHR", to: "PVG" },
    { from: "LHR", to: "TPE" },
    // Africa
    { from: "LHR", to: "JNB" },
    { from: "LHR", to: "CPT" },
    { from: "LHR", to: "CAI" },
    // South America
    { from: "LHR", to: "GRU" },
    { from: "LHR", to: "GIG" },
    { from: "LHR", to: "EZE" },
    { from: "LHR", to: "SCL" },
    { from: "LHR", to: "LIM" },
    // Australia
    { from: "LHR", to: "SYD" },
  ];
  if (baId) await addRoutes(baId, baRoutes);

  // Cathay Pacific routes (hub: HKG)
  const cathayId = airlineMap.ASIA_MILES;
  const cathayRoutes = [
    // North America
    { from: "HKG", to: "JFK" },
    { from: "HKG", to: "LAX" },
    { from: "HKG", to: "SFO" },
    { from: "HKG", to: "ORD" },
    { from: "HKG", to: "BOS" },
    { from: "HKG", to: "DFW" },
    { from: "HKG", to: "IAD" },
    { from: "HKG", to: "YYZ" },
    { from: "HKG", to: "YVR" },
    // Europe
    { from: "HKG", to: "LHR" },
    { from: "HKG", to: "CDG" },
    { from: "HKG", to: "FRA" },
    { from: "HKG", to: "AMS" },
    { from: "HKG", to: "MXP" },
    { from: "HKG", to: "MAD" },
    { from: "HKG", to: "BCN" },
    { from: "HKG", to: "ZRH" },
    { from: "HKG", to: "FCO" },
    { from: "HKG", to: "MUC" },
    // Australia & New Zealand
    { from: "HKG", to: "SYD" },
    { from: "HKG", to: "MEL" },
    { from: "HKG", to: "BNE" },
    { from: "HKG", to: "PER" },
    { from: "HKG", to: "AKL" },
    // Japan
    { from: "HKG", to: "NRT" },
    { from: "HKG", to: "HND" },
    { from: "HKG", to: "KIX" },
    { from: "HKG", to: "NGO" },
    { from: "HKG", to: "FUK" },
    { from: "HKG", to: "CTS" },
    // Asia
    { from: "HKG", to: "ICN" },
    { from: "HKG", to: "PEK" },
    { from: "HKG", to: "PVG" },
    { from: "HKG", to: "SHA" },
    { from: "HKG", to: "CAN" },
    { from: "HKG", to: "SZX" },
    { from: "HKG", to: "TPE" },
    { from: "HKG", to: "BKK" },
    { from: "HKG", to: "SIN" },
    { from: "HKG", to: "KUL" },
    { from: "HKG", to: "MNL" },
    { from: "HKG", to: "CGK" },
    { from: "HKG", to: "SGN" },
    { from: "HKG", to: "HAN" },
    { from: "HKG", to: "DEL" },
    { from: "HKG", to: "BOM" },
    // Middle East
    { from: "HKG", to: "DXB" },
    { from: "HKG", to: "AUH" },
    { from: "HKG", to: "DOH" },
    { from: "HKG", to: "TLV" },
  ];
  if (cathayId) await addRoutes(cathayId, cathayRoutes);

  // Qantas routes (hubs: SYD, MEL)
  const qantasId = airlineMap.QANTAS;
  const qantasRoutes = [
    // North America
    { from: "SYD", to: "LAX" },
    { from: "SYD", to: "DFW" },
    { from: "SYD", to: "SFO" },
    { from: "MEL", to: "LAX" },
    { from: "MEL", to: "SFO" },
    { from: "BNE", to: "LAX" },
    { from: "SYD", to: "HNL" },
    { from: "MEL", to: "HNL" },
    // Europe
    { from: "PER", to: "LHR" },
    // Asia
    { from: "SYD", to: "SIN" },
    { from: "MEL", to: "SIN" },
    { from: "BNE", to: "SIN" },
    { from: "PER", to: "SIN" },
    { from: "SYD", to: "HKG" },
    { from: "MEL", to: "HKG" },
    { from: "BNE", to: "HKG" },
    { from: "SYD", to: "HND" },
    { from: "MEL", to: "HND" },
    { from: "MEL", to: "NRT" },
    { from: "BNE", to: "NRT" },
    { from: "SYD", to: "MNL" },
    { from: "MEL", to: "MNL" },
    { from: "SYD", to: "BKK" },
    { from: "SYD", to: "ICN" },
    // Africa
    { from: "SYD", to: "JNB" },
    { from: "PER", to: "JNB" },
    // South America
    { from: "SYD", to: "SCL" },
    // New Zealand
    { from: "SYD", to: "AKL" },
    { from: "MEL", to: "AKL" },
    { from: "BNE", to: "AKL" },
    { from: "PER", to: "AKL" },
  ];
  if (qantasId) await addRoutes(qantasId, qantasRoutes);

  // Air France/KLM Flying Blue routes (hubs: CDG, AMS)
  const flyingBlueId = airlineMap.FLYING_BLUE;
  const flyingBlueRoutes = [
    // Air France from CDG - North America
    { from: "CDG", to: "ATL" },
    { from: "CDG", to: "BOS" },
    { from: "CDG", to: "DEN" },
    { from: "CDG", to: "DFW" },
    { from: "CDG", to: "DTW" },
    { from: "CDG", to: "EWR" },
    { from: "CDG", to: "IAD" },
    { from: "CDG", to: "IAH" },
    { from: "CDG", to: "JFK" },
    { from: "CDG", to: "LAX" },
    { from: "CDG", to: "MIA" },
    { from: "CDG", to: "MSP" },
    { from: "CDG", to: "MCO" },
    { from: "CDG", to: "ORD" },
    { from: "CDG", to: "PHX" },
    { from: "CDG", to: "SEA" },
    { from: "CDG", to: "SFO" },
    { from: "CDG", to: "YUL" },
    { from: "CDG", to: "YVR" },
    { from: "CDG", to: "YYZ" },
    // Air France from CDG - Asia
    { from: "CDG", to: "BKK" },
    { from: "CDG", to: "DEL" },
    { from: "CDG", to: "HKG" },
    { from: "CDG", to: "HND" },
    { from: "CDG", to: "ICN" },
    { from: "CDG", to: "KIX" },
    { from: "CDG", to: "MNL" },
    { from: "CDG", to: "PEK" },
    { from: "CDG", to: "PVG" },
    { from: "CDG", to: "SGN" },
    { from: "CDG", to: "SIN" },
    // Air France from CDG - South America
    { from: "CDG", to: "BOG" },
    { from: "CDG", to: "EZE" },
    { from: "CDG", to: "GIG" },
    { from: "CDG", to: "GRU" },
    { from: "CDG", to: "LIM" },
    { from: "CDG", to: "SCL" },
    // Air France from CDG - Middle East/Africa
    { from: "CDG", to: "CAI" },
    { from: "CDG", to: "DXB" },
    { from: "CDG", to: "TLV" },
    { from: "CDG", to: "CPT" },
    { from: "CDG", to: "JNB" },
    { from: "CDG", to: "MEX" },
    // KLM from AMS - North America
    { from: "AMS", to: "ATL" },
    { from: "AMS", to: "AUS" },
    { from: "AMS", to: "BOS" },
    { from: "AMS", to: "DEN" },
    { from: "AMS", to: "DFW" },
    { from: "AMS", to: "DTW" },
    { from: "AMS", to: "EWR" },
    { from: "AMS", to: "IAD" },
    { from: "AMS", to: "IAH" },
    { from: "AMS", to: "JFK" },
    { from: "AMS", to: "LAS" },
    { from: "AMS", to: "LAX" },
    { from: "AMS", to: "MIA" },
    { from: "AMS", to: "MSP" },
    { from: "AMS", to: "ORD" },
    { from: "AMS", to: "PDX" },
    { from: "AMS", to: "SAN" },
    { from: "AMS", to: "SEA" },
    { from: "AMS", to: "SFO" },
    { from: "AMS", to: "SLC" },
    { from: "AMS", to: "YUL" },
    { from: "AMS", to: "YVR" },
    { from: "AMS", to: "YYC" },
    { from: "AMS", to: "YYZ" },
    // KLM from AMS - Asia
    { from: "AMS", to: "BKK" },
    { from: "AMS", to: "BOM" },
    { from: "AMS", to: "CGK" },
    { from: "AMS", to: "DEL" },
    { from: "AMS", to: "HKG" },
    { from: "AMS", to: "ICN" },
    { from: "AMS", to: "KUL" },
    { from: "AMS", to: "MNL" },
    { from: "AMS", to: "NRT" },
    { from: "AMS", to: "PEK" },
    { from: "AMS", to: "PVG" },
    { from: "AMS", to: "SIN" },
    { from: "AMS", to: "TPE" },
    // KLM from AMS - South America
    { from: "AMS", to: "BOG" },
    { from: "AMS", to: "EZE" },
    { from: "AMS", to: "GIG" },
    { from: "AMS", to: "GRU" },
    { from: "AMS", to: "LIM" },
    // KLM from AMS - Middle East/Africa
    { from: "AMS", to: "AUH" },
    { from: "AMS", to: "CAI" },
    { from: "AMS", to: "DOH" },
    { from: "AMS", to: "DXB" },
    { from: "AMS", to: "TLV" },
    { from: "AMS", to: "CPT" },
    { from: "AMS", to: "JNB" },
    { from: "AMS", to: "MEX" },
  ];
  if (flyingBlueId) await addRoutes(flyingBlueId, flyingBlueRoutes);

  // Korean Air routes (hub: ICN)
  const koreanId = airlineMap.KOREAN;
  const koreanRoutes = [
    // North America
    { from: "ICN", to: "JFK" },
    { from: "ICN", to: "LAX" },
    { from: "ICN", to: "SFO" },
    { from: "ICN", to: "SEA" },
    { from: "ICN", to: "ORD" },
    { from: "ICN", to: "DFW" },
    { from: "ICN", to: "ATL" },
    { from: "ICN", to: "IAD" },
    { from: "ICN", to: "BOS" },
    { from: "ICN", to: "LAS" },
    { from: "ICN", to: "HNL" },
    { from: "ICN", to: "YYZ" },
    { from: "ICN", to: "YVR" },
    // Europe
    { from: "ICN", to: "LHR" },
    { from: "ICN", to: "CDG" },
    { from: "ICN", to: "FRA" },
    { from: "ICN", to: "AMS" },
    { from: "ICN", to: "FCO" },
    { from: "ICN", to: "MXP" },
    { from: "ICN", to: "MAD" },
    { from: "ICN", to: "ZRH" },
    { from: "ICN", to: "VIE" },
    { from: "ICN", to: "IST" },
    // Japan
    { from: "ICN", to: "NRT" },
    { from: "ICN", to: "HND" },
    { from: "GMP", to: "HND" },
    { from: "ICN", to: "KIX" },
    { from: "ICN", to: "NGO" },
    { from: "ICN", to: "FUK" },
    { from: "ICN", to: "CTS" },
    // China
    { from: "ICN", to: "PEK" },
    { from: "ICN", to: "PVG" },
    { from: "ICN", to: "CAN" },
    { from: "ICN", to: "SZX" },
    // Southeast Asia
    { from: "ICN", to: "BKK" },
    { from: "ICN", to: "SIN" },
    { from: "ICN", to: "HKG" },
    { from: "ICN", to: "MNL" },
    { from: "ICN", to: "SGN" },
    { from: "ICN", to: "HAN" },
    { from: "ICN", to: "KUL" },
    { from: "ICN", to: "CGK" },
    { from: "ICN", to: "TPE" },
    // India
    { from: "ICN", to: "DEL" },
    { from: "ICN", to: "BOM" },
    // Middle East
    { from: "ICN", to: "DXB" },
    { from: "ICN", to: "TLV" },
    // Oceania
    { from: "ICN", to: "SYD" },
    { from: "ICN", to: "AKL" },
  ];
  if (koreanId) await addRoutes(koreanId, koreanRoutes);

  // Singapore Airlines routes (hub: SIN)
  const krisId = airlineMap.KRISFLYER;
  const krisRoutes = [
    // North America
    { from: "SIN", to: "JFK" },
    { from: "SIN", to: "EWR" },
    { from: "SIN", to: "LAX" },
    { from: "SIN", to: "SFO" },
    { from: "SIN", to: "SEA" },
    { from: "SIN", to: "IAH" },
    // Europe
    { from: "SIN", to: "LHR" },
    { from: "SIN", to: "LGW" },
    { from: "SIN", to: "CDG" },
    { from: "SIN", to: "FRA" },
    { from: "SIN", to: "MUC" },
    { from: "SIN", to: "ZRH" },
    { from: "SIN", to: "AMS" },
    { from: "SIN", to: "CPH" },
    { from: "SIN", to: "MXP" },
    { from: "SIN", to: "FCO" },
    { from: "SIN", to: "BCN" },
    { from: "SIN", to: "IST" },
    // Australia & New Zealand
    { from: "SIN", to: "SYD" },
    { from: "SIN", to: "MEL" },
    { from: "SIN", to: "BNE" },
    { from: "SIN", to: "PER" },
    { from: "SIN", to: "AKL" },
    // Northeast Asia
    { from: "SIN", to: "NRT" },
    { from: "SIN", to: "HND" },
    { from: "SIN", to: "KIX" },
    { from: "SIN", to: "NGO" },
    { from: "SIN", to: "FUK" },
    { from: "SIN", to: "CTS" },
    { from: "SIN", to: "ICN" },
    { from: "SIN", to: "HKG" },
    { from: "SIN", to: "TPE" },
    // China
    { from: "SIN", to: "PEK" },
    { from: "SIN", to: "PVG" },
    { from: "SIN", to: "CAN" },
    { from: "SIN", to: "SZX" },
    // Southeast Asia
    { from: "SIN", to: "BKK" },
    { from: "SIN", to: "HAN" },
    { from: "SIN", to: "SGN" },
    { from: "SIN", to: "KUL" },
    { from: "SIN", to: "CGK" },
    { from: "SIN", to: "MNL" },
    // India
    { from: "SIN", to: "DEL" },
    { from: "SIN", to: "BOM" },
    // Middle East & Africa
    { from: "SIN", to: "DXB" },
    { from: "SIN", to: "TLV" },
    { from: "SIN", to: "JNB" },
    { from: "SIN", to: "CPT" },
  ];
  if (krisId) await addRoutes(krisId, krisRoutes);

  // Emirates routes (hub: DXB)
  const emiratesId = airlineMap.EMIRATES;
  const emiratesRoutes = [
    // North America
    { from: "DXB", to: "JFK" },
    { from: "DXB", to: "EWR" },
    { from: "DXB", to: "LAX" },
    { from: "DXB", to: "SFO" },
    { from: "DXB", to: "IAD" },
    { from: "DXB", to: "IAH" },
    { from: "DXB", to: "DFW" },
    { from: "DXB", to: "ORD" },
    { from: "DXB", to: "BOS" },
    { from: "DXB", to: "SEA" },
    { from: "DXB", to: "MIA" },
    { from: "DXB", to: "MCO" },
    { from: "DXB", to: "YYZ" },
    { from: "DXB", to: "YUL" },
    // Latin America
    { from: "DXB", to: "MEX" },
    { from: "DXB", to: "GRU" },
    { from: "DXB", to: "GIG" },
    { from: "DXB", to: "EZE" },
    { from: "DXB", to: "BOG" },
    // Europe - UK
    { from: "DXB", to: "LHR" },
    { from: "DXB", to: "LGW" },
    { from: "DXB", to: "STN" },
    // Europe - Continental
    { from: "DXB", to: "CDG" },
    { from: "DXB", to: "FRA" },
    { from: "DXB", to: "MUC" },
    { from: "DXB", to: "AMS" },
    { from: "DXB", to: "ZRH" },
    { from: "DXB", to: "VIE" },
    { from: "DXB", to: "FCO" },
    { from: "DXB", to: "MXP" },
    { from: "DXB", to: "BCN" },
    { from: "DXB", to: "MAD" },
    { from: "DXB", to: "LIS" },
    { from: "DXB", to: "ATH" },
    { from: "DXB", to: "CPH" },
    { from: "DXB", to: "ARN" },
    { from: "DXB", to: "OSL" },
    { from: "DXB", to: "HEL" },
    { from: "DXB", to: "DUB" },
    { from: "DXB", to: "IST" },
    // Middle East & Africa
    { from: "DXB", to: "TLV" },
    { from: "DXB", to: "CAI" },
    { from: "DXB", to: "JNB" },
    { from: "DXB", to: "CPT" },
    // India
    { from: "DXB", to: "DEL" },
    { from: "DXB", to: "BOM" },
    // Southeast Asia
    { from: "DXB", to: "SIN" },
    { from: "DXB", to: "BKK" },
    { from: "DXB", to: "KUL" },
    { from: "DXB", to: "CGK" },
    { from: "DXB", to: "MNL" },
    { from: "DXB", to: "SGN" },
    { from: "DXB", to: "HAN" },
    // East Asia
    { from: "DXB", to: "HKG" },
    { from: "DXB", to: "PVG" },
    { from: "DXB", to: "PEK" },
    { from: "DXB", to: "CAN" },
    { from: "DXB", to: "SZX" },
    { from: "DXB", to: "ICN" },
    { from: "DXB", to: "TPE" },
    { from: "DXB", to: "HND" },
    { from: "DXB", to: "NRT" },
    { from: "DXB", to: "KIX" },
    // Australia / New Zealand
    { from: "DXB", to: "SYD" },
    { from: "DXB", to: "MEL" },
    { from: "DXB", to: "BNE" },
    { from: "DXB", to: "PER" },
    { from: "DXB", to: "AKL" },
  ];
  if (emiratesId) await addRoutes(emiratesId, emiratesRoutes);

  // Avianca LifeMiles routes (hub: BOG)
  const lifemilesId = airlineMap.LIFEMILES;
  const lifemilesRoutes = [
    // North America
    { from: "BOG", to: "MIA" },
    { from: "BOG", to: "JFK" },
    { from: "BOG", to: "LAX" },
    { from: "BOG", to: "ORD" },
    { from: "BOG", to: "DFW" },
    { from: "BOG", to: "IAD" },
    { from: "BOG", to: "FLL" },
    { from: "BOG", to: "MCO" },
    { from: "BOG", to: "TPA" },
    { from: "BOG", to: "BOS" },
    { from: "BOG", to: "SFO" },
    { from: "BOG", to: "YYZ" },
    // South America
    { from: "BOG", to: "LIM" },
    { from: "BOG", to: "GRU" },
    { from: "BOG", to: "GIG" },
    { from: "BOG", to: "EZE" },
    { from: "BOG", to: "SCL" },
    // Mexico/Caribbean
    { from: "BOG", to: "MEX" },
    { from: "BOG", to: "CUN" },
    // Europe
    { from: "BOG", to: "MAD" },
    { from: "BOG", to: "BCN" },
    { from: "BOG", to: "LHR" },
    { from: "BOG", to: "CDG" },
  ];
  if (lifemilesId) await addRoutes(lifemilesId, lifemilesRoutes);

  console.log("Seeding complete!");
  await client.end();
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
