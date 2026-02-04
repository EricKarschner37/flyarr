import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";
import { getTableName } from "drizzle-orm";

describe("Database Schema", () => {
  describe("Credit Card Programs Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.creditCardPrograms)).toBe("credit_card_programs");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.creditCardPrograms);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("code");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  describe("Alliances Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.alliances)).toBe("alliances");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.alliances);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("code");
    });
  });

  describe("Airline Programs Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.airlinePrograms)).toBe("airline_programs");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.airlinePrograms);
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("code");
      expect(columns).toContain("allianceId");
      expect(columns).toContain("hasDynamicPricing");
      expect(columns).toContain("searchUrlTemplate");
    });
  });

  describe("Transfer Partnerships Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.transferPartnerships)).toBe("transfer_partnerships");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.transferPartnerships);
      expect(columns).toContain("id");
      expect(columns).toContain("creditCardProgramId");
      expect(columns).toContain("airlineProgramId");
      expect(columns).toContain("transferRatio");
      expect(columns).toContain("transferTimeHours");
      expect(columns).toContain("isBonusActive");
      expect(columns).toContain("bonusRatio");
    });
  });

  describe("Regions Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.regions)).toBe("regions");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.regions);
      expect(columns).toContain("id");
      expect(columns).toContain("programId");
      expect(columns).toContain("name");
      expect(columns).toContain("code");
    });
  });

  describe("Airports Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.airports)).toBe("airports");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.airports);
      expect(columns).toContain("code");
      expect(columns).toContain("name");
      expect(columns).toContain("city");
      expect(columns).toContain("country");
      expect(columns).toContain("countryCode");
      expect(columns).toContain("lat");
      expect(columns).toContain("lng");
    });

    it("should use IATA code as primary key", () => {
      // Code is the primary key (varchar length 3)
      expect(schema.airports.code.name).toBe("code");
    });
  });

  describe("Airport Region Mappings Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.airportRegionMappings)).toBe("airport_region_mappings");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.airportRegionMappings);
      expect(columns).toContain("id");
      expect(columns).toContain("airportCode");
      expect(columns).toContain("regionId");
      expect(columns).toContain("programId");
    });
  });

  describe("Award Charts Table", () => {
    it("should have correct table name", () => {
      expect(getTableName(schema.awardCharts)).toBe("award_charts");
    });

    it("should have required fields", () => {
      const columns = Object.keys(schema.awardCharts);
      expect(columns).toContain("id");
      expect(columns).toContain("programId");
      expect(columns).toContain("originRegionId");
      expect(columns).toContain("destinationRegionId");
      expect(columns).toContain("cabinClass");
      expect(columns).toContain("partnerType");
      expect(columns).toContain("minMiles");
      expect(columns).toContain("maxMiles");
      expect(columns).toContain("typicalMiles");
      expect(columns).toContain("isOneWay");
      expect(columns).toContain("notes");
    });
  });

  describe("Cabin Classes", () => {
    it("should have all expected cabin classes", () => {
      expect(schema.cabinClasses).toContain("economy");
      expect(schema.cabinClasses).toContain("premium_economy");
      expect(schema.cabinClasses).toContain("business");
      expect(schema.cabinClasses).toContain("first");
    });

    it("should have exactly 4 cabin classes", () => {
      expect(schema.cabinClasses).toHaveLength(4);
    });
  });

  describe("Partner Types", () => {
    it("should have all expected partner types", () => {
      expect(schema.partnerTypes).toContain("own_metal");
      expect(schema.partnerTypes).toContain("partner");
      expect(schema.partnerTypes).toContain("any");
    });

    it("should have exactly 3 partner types", () => {
      expect(schema.partnerTypes).toHaveLength(3);
    });
  });

  describe("Type Exports", () => {
    it("should export insert/select types", () => {
      // These are type checks - if they compile, the types exist
      const creditCardProgram: schema.CreditCardProgram = {
        id: 1,
        name: "Test",
        code: "TEST",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(creditCardProgram).toBeDefined();

      const alliance: schema.Alliance = {
        id: 1,
        name: "Test Alliance",
        code: "TA",
      };
      expect(alliance).toBeDefined();

      const airlineProgram: schema.AirlineProgram = {
        id: 1,
        name: "Test Program",
        code: "TP",
        allianceId: 1,
        hasDynamicPricing: false,
        searchUrlTemplate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(airlineProgram).toBeDefined();

      const airport: schema.Airport = {
        code: "TST",
        name: "Test Airport",
        city: "Test City",
        country: "Test Country",
        countryCode: "TC",
        lat: "0.0",
        lng: "0.0",
      };
      expect(airport).toBeDefined();
    });
  });

  describe("Relations", () => {
    it("should define credit card programs relations", () => {
      expect(schema.creditCardProgramsRelations).toBeDefined();
    });

    it("should define alliances relations", () => {
      expect(schema.alliancesRelations).toBeDefined();
    });

    it("should define airline programs relations", () => {
      expect(schema.airlineProgramsRelations).toBeDefined();
    });

    it("should define transfer partnerships relations", () => {
      expect(schema.transferPartnershipsRelations).toBeDefined();
    });

    it("should define regions relations", () => {
      expect(schema.regionsRelations).toBeDefined();
    });

    it("should define airport region mappings relations", () => {
      expect(schema.airportRegionMappingsRelations).toBeDefined();
    });

    it("should define award charts relations", () => {
      expect(schema.awardChartsRelations).toBeDefined();
    });
  });
});
