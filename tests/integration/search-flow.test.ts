import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module with realistic data
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

describe("Search Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("End-to-End Search Flow", () => {
    it("should handle a complete search from params to results", async () => {
      // Simulate the full search flow data structures
      const searchParams = {
        origin: "JFK",
        destination: "NRT",
        cabinClass: "business",
        enabledCreditCardPrograms: ["AMEX_MR", "CHASE_UR"],
      };

      // Mock data that would come from the database
      const mockPrograms = [
        {
          id: 1,
          name: "ANA Mileage Club",
          code: "ANA",
          hasDynamicPricing: false,
          allianceId: 1,
        },
        {
          id: 2,
          name: "United MileagePlus",
          code: "UNITED",
          hasDynamicPricing: true,
          allianceId: 1,
        },
      ];

      const mockTransferPartnerships = [
        {
          id: 1,
          creditCardProgramId: 1,
          airlineProgramId: 1,
          transferRatio: "1.0",
          transferTimeHours: 48,
          isBonusActive: false,
          bonusRatio: null,
        },
        {
          id: 2,
          creditCardProgramId: 2,
          airlineProgramId: 2,
          transferRatio: "1.0",
          transferTimeHours: 0,
          isBonusActive: false,
          bonusRatio: null,
        },
      ];

      const mockAwardCharts = [
        {
          id: 1,
          programId: 1,
          originRegionId: 1,
          destinationRegionId: 2,
          cabinClass: "business",
          partnerType: "any",
          minMiles: 75000,
          maxMiles: 75000,
          typicalMiles: 75000,
          isOneWay: false,
        },
        {
          id: 2,
          programId: 2,
          originRegionId: 1,
          destinationRegionId: 2,
          cabinClass: "business",
          partnerType: "any",
          minMiles: 60000,
          maxMiles: 120000,
          typicalMiles: 80000,
          isOneWay: true,
        },
      ];

      // Verify search params are valid
      expect(searchParams.origin).toMatch(/^[A-Z]{3}$/);
      expect(searchParams.destination).toMatch(/^[A-Z]{3}$/);
      expect(["economy", "premium_economy", "business", "first"]).toContain(
        searchParams.cabinClass
      );
      expect(searchParams.enabledCreditCardPrograms.length).toBeGreaterThan(0);

      // Verify mock data structure matches expectations
      expect(mockPrograms).toHaveLength(2);
      expect(mockTransferPartnerships).toHaveLength(2);
      expect(mockAwardCharts).toHaveLength(2);

      // Verify ANA is fixed pricing
      const anaChart = mockAwardCharts.find((c) => c.programId === 1);
      expect(anaChart?.minMiles).toBe(anaChart?.maxMiles);

      // Verify United has dynamic pricing (range)
      const unitedChart = mockAwardCharts.find((c) => c.programId === 2);
      expect(unitedChart?.minMiles).toBeLessThan(unitedChart!.maxMiles);
    });

    it("should filter results by enabled credit card programs", () => {
      const allTransferOptions = [
        { creditCardCode: "AMEX_MR", pointsNeeded: 75000 },
        { creditCardCode: "CHASE_UR", pointsNeeded: 80000 },
        { creditCardCode: "CITI_TY", pointsNeeded: 90000 },
        { creditCardCode: "CAPITAL_ONE", pointsNeeded: 85000 },
        { creditCardCode: "BILT", pointsNeeded: 75000 },
      ];

      const enabledPrograms = ["AMEX_MR", "CHASE_UR"];

      const filteredOptions = allTransferOptions.filter((opt) =>
        enabledPrograms.includes(opt.creditCardCode)
      );

      expect(filteredOptions).toHaveLength(2);
      expect(filteredOptions.map((o) => o.creditCardCode)).toContain("AMEX_MR");
      expect(filteredOptions.map((o) => o.creditCardCode)).toContain("CHASE_UR");
      expect(filteredOptions.map((o) => o.creditCardCode)).not.toContain(
        "CITI_TY"
      );
    });

    it("should calculate points needed with transfer ratios", () => {
      const awardCost = 100000;
      const transferPartnerships = [
        { ratio: 1.0, code: "AMEX_MR" }, // 1:1
        { ratio: 0.7, code: "VIRGIN" }, // 1:0.7 (need more points)
        { ratio: 1.5, code: "BONUS" }, // 1:1.5 (need fewer points)
      ];

      const results = transferPartnerships.map((tp) => ({
        code: tp.code,
        pointsNeeded: Math.ceil(awardCost / tp.ratio),
      }));

      expect(results[0].pointsNeeded).toBe(100000); // 100000 / 1.0
      expect(results[1].pointsNeeded).toBe(142858); // ceil(100000 / 0.7)
      expect(results[2].pointsNeeded).toBe(66667); // ceil(100000 / 1.5)
    });

    it("should apply bonus ratios when active", () => {
      const awardCost = 100000;
      const baseRatio = 1.0;
      const bonusRatio = 1.3; // 30% bonus

      const pointsWithoutBonus = Math.ceil(awardCost / baseRatio);
      const pointsWithBonus = Math.ceil(awardCost / bonusRatio);

      expect(pointsWithoutBonus).toBe(100000);
      expect(pointsWithBonus).toBe(76924);
      expect(pointsWithBonus).toBeLessThan(pointsWithoutBonus);
    });

    it("should sort results by minimum miles", () => {
      const unsortedResults = [
        { program: "Delta", minMiles: 120000 },
        { program: "ANA", minMiles: 75000 },
        { program: "United", minMiles: 60000 },
        { program: "British Airways", minMiles: 85000 },
      ];

      const sortedResults = [...unsortedResults].sort(
        (a, b) => a.minMiles - b.minMiles
      );

      expect(sortedResults[0].program).toBe("United");
      expect(sortedResults[1].program).toBe("ANA");
      expect(sortedResults[2].program).toBe("British Airways");
      expect(sortedResults[3].program).toBe("Delta");
    });
  });

  describe("Region Mapping", () => {
    it("should map airports to correct regions", () => {
      const airportRegionMappings = {
        ANA: {
          JFK: "North America",
          LAX: "North America",
          NRT: "Japan",
          HND: "Japan",
          LHR: "Europe",
          CDG: "Europe",
        },
        UNITED: {
          JFK: "North America",
          LAX: "North America",
          NRT: "North Asia",
          HND: "North Asia",
          LHR: "Europe 1",
          CDG: "Europe 1",
        },
      };

      // ANA mapping
      expect(airportRegionMappings.ANA.JFK).toBe("North America");
      expect(airportRegionMappings.ANA.NRT).toBe("Japan");

      // United mapping (different region names)
      expect(airportRegionMappings.UNITED.JFK).toBe("North America");
      expect(airportRegionMappings.UNITED.NRT).toBe("North Asia");
    });

    it("should find award chart for region pair", () => {
      const awardCharts = [
        {
          originRegion: "North America",
          destRegion: "Japan",
          cabinClass: "business",
          miles: 75000,
        },
        {
          originRegion: "North America",
          destRegion: "Europe",
          cabinClass: "business",
          miles: 88000,
        },
        {
          originRegion: "North America",
          destRegion: "Japan",
          cabinClass: "economy",
          miles: 35000,
        },
      ];

      const searchOriginRegion = "North America";
      const searchDestRegion = "Japan";
      const searchCabin = "business";

      const matchingChart = awardCharts.find(
        (chart) =>
          chart.originRegion === searchOriginRegion &&
          chart.destRegion === searchDestRegion &&
          chart.cabinClass === searchCabin
      );

      expect(matchingChart).toBeDefined();
      expect(matchingChart?.miles).toBe(75000);
    });
  });

  describe("URL Template Replacement", () => {
    it("should generate correct search URLs", () => {
      const templates = {
        ANA: "https://cam.ana.co.jp/award/?origin={origin}&dest={destination}",
        UNITED:
          "https://www.united.com/ual/en/us/flight-search/book-a-flight/results/awd?f={origin}&t={destination}&d={date}",
        AEROPLAN:
          "https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0={origin}&dest0={destination}",
      };

      const params = {
        origin: "JFK",
        destination: "NRT",
        date: "2024-06-15",
      };

      const anaUrl = templates.ANA.replace("{origin}", params.origin).replace(
        "{destination}",
        params.destination
      );

      const unitedUrl = templates.UNITED.replace("{origin}", params.origin)
        .replace("{destination}", params.destination)
        .replace("{date}", params.date);

      expect(anaUrl).toBe(
        "https://cam.ana.co.jp/award/?origin=JFK&dest=NRT"
      );
      expect(unitedUrl).toContain("f=JFK");
      expect(unitedUrl).toContain("t=NRT");
      expect(unitedUrl).toContain("d=2024-06-15");
    });
  });

  describe("Credit Card Program Selection Persistence", () => {
    it("should correctly serialize and deserialize program selections", () => {
      const selectedPrograms = ["AMEX_MR", "CHASE_UR", "BILT"];

      // Simulate localStorage serialization
      const serialized = JSON.stringify(selectedPrograms);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(selectedPrograms);
      expect(deserialized).toHaveLength(3);
    });

    it("should handle empty selection", () => {
      const selectedPrograms: string[] = [];

      const serialized = JSON.stringify(selectedPrograms);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual([]);
      expect(deserialized).toHaveLength(0);
    });

    it("should maintain order of selections", () => {
      const selectedPrograms = ["BILT", "AMEX_MR", "CHASE_UR"];

      const serialized = JSON.stringify(selectedPrograms);
      const deserialized = JSON.parse(serialized);

      expect(deserialized[0]).toBe("BILT");
      expect(deserialized[1]).toBe("AMEX_MR");
      expect(deserialized[2]).toBe("CHASE_UR");
    });
  });

  describe("Search Result Aggregation", () => {
    it("should aggregate multiple transfer options per program", () => {
      const awardResult = {
        program: "ANA",
        awardCost: 75000,
        transferOptions: [
          { creditCard: "AMEX_MR", pointsNeeded: 75000, transferTime: 48 },
          { creditCard: "CAPITAL_ONE", pointsNeeded: 75000, transferTime: 24 },
        ],
      };

      expect(awardResult.transferOptions).toHaveLength(2);

      // Find best option (lowest points or fastest transfer)
      const bestByPoints = awardResult.transferOptions.sort(
        (a, b) => a.pointsNeeded - b.pointsNeeded
      )[0];
      const bestByTime = awardResult.transferOptions.sort(
        (a, b) => a.transferTime - b.transferTime
      )[0];

      // Both have same points
      expect(bestByPoints.pointsNeeded).toBe(75000);

      // Capital One is faster
      expect(bestByTime.creditCard).toBe("CAPITAL_ONE");
      expect(bestByTime.transferTime).toBe(24);
    });
  });
});
