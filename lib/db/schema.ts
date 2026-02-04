import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Credit Card Programs (Amex MR, Chase UR, etc.)
export const creditCardPrograms = pgTable("credit_card_programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(), // AMEX_MR, CHASE_UR, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Alliances (Star Alliance, OneWorld, SkyTeam)
export const alliances = pgTable("alliances", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  code: varchar("code", { length: 10 }).notNull().unique(), // STAR, OW, ST
});

// Pricing Models enum-like
export const pricingModels = ["region", "distance"] as const;
export type PricingModel = (typeof pricingModels)[number];

// Airline Programs (Aeroplan, United MileagePlus, etc.)
export const airlinePrograms = pgTable("airline_programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(), // ANA, UNITED, AEROPLAN, etc.
  allianceId: integer("alliance_id").references(() => alliances.id),
  hasDynamicPricing: boolean("has_dynamic_pricing").default(false).notNull(),
  pricingModel: varchar("pricing_model", { length: 20 }).default("region").notNull(), // region or distance
  searchUrlTemplate: text("search_url_template"), // URL template for award search
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transfer Partnerships (credit card -> airline program)
export const transferPartnerships = pgTable(
  "transfer_partnerships",
  {
    id: serial("id").primaryKey(),
    creditCardProgramId: integer("credit_card_program_id")
      .notNull()
      .references(() => creditCardPrograms.id, { onDelete: "cascade" }),
    airlineProgramId: integer("airline_program_id")
      .notNull()
      .references(() => airlinePrograms.id, { onDelete: "cascade" }),
    transferRatio: decimal("transfer_ratio", { precision: 4, scale: 2 })
      .notNull()
      .default("1.0"), // 1.0 = 1:1, 0.7 = 1:0.7, 1.5 = 1:1.5
    transferTimeHours: integer("transfer_time_hours").notNull().default(0), // 0 = instant
    isBonusActive: boolean("is_bonus_active").default(false).notNull(),
    bonusRatio: decimal("bonus_ratio", { precision: 4, scale: 2 }), // e.g., 1.3 for 30% bonus
    bonusExpiresAt: timestamp("bonus_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_cc_airline_partnership").on(
      table.creditCardProgramId,
      table.airlineProgramId
    ),
  ]
);

// Regions (programs define zones differently)
export const regions = pgTable(
  "regions",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => airlinePrograms.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(), // "North America", "Japan", etc.
    code: varchar("code", { length: 50 }), // Optional shortcode
  },
  (table) => [
    uniqueIndex("unique_program_region").on(table.programId, table.name),
  ]
);

// Airports
export const airports = pgTable("airports", {
  code: varchar("code", { length: 3 }).primaryKey(), // IATA code
  name: varchar("name", { length: 200 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  metro: varchar("metro", { length: 3 }), // Metro area code (e.g., NYC for JFK, EWR, LGA)
});

// Airport to Region Mapping (per program)
export const airportRegionMappings = pgTable(
  "airport_region_mappings",
  {
    id: serial("id").primaryKey(),
    airportCode: varchar("airport_code", { length: 3 })
      .notNull()
      .references(() => airports.code, { onDelete: "cascade" }),
    regionId: integer("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    programId: integer("program_id")
      .notNull()
      .references(() => airlinePrograms.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("unique_airport_program_mapping").on(
      table.airportCode,
      table.programId
    ),
    index("idx_airport_region_program").on(table.programId, table.regionId),
  ]
);

// Airline Routes - tracks which airport pairs an airline operates (for filtering search results)
export const airlineRoutes = pgTable(
  "airline_routes",
  {
    id: serial("id").primaryKey(),
    airlineProgramId: integer("airline_program_id")
      .notNull()
      .references(() => airlinePrograms.id, { onDelete: "cascade" }),
    originAirportCode: varchar("origin_airport_code", { length: 3 })
      .notNull()
      .references(() => airports.code, { onDelete: "cascade" }),
    destinationAirportCode: varchar("destination_airport_code", { length: 3 })
      .notNull()
      .references(() => airports.code, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("unique_airline_route").on(
      table.airlineProgramId,
      table.originAirportCode,
      table.destinationAirportCode
    ),
    index("idx_airline_routes_origin").on(
      table.airlineProgramId,
      table.originAirportCode
    ),
    index("idx_airline_routes_destination").on(
      table.airlineProgramId,
      table.destinationAirportCode
    ),
  ]
);

// Cabin Classes enum-like
export const cabinClasses = ["economy", "premium_economy", "business", "first"] as const;
export type CabinClass = (typeof cabinClasses)[number];

// Partner Types enum-like
export const partnerTypes = ["own_metal", "partner", "any"] as const;
export type PartnerType = (typeof partnerTypes)[number];

// Award Charts
export const awardCharts = pgTable(
  "award_charts",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => airlinePrograms.id, { onDelete: "cascade" }),
    originRegionId: integer("origin_region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    destinationRegionId: integer("destination_region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    cabinClass: varchar("cabin_class", { length: 20 }).notNull(), // economy, premium_economy, business, first
    partnerType: varchar("partner_type", { length: 20 }).notNull().default("any"), // own_metal, partner, any
    minMiles: integer("min_miles").notNull(),
    maxMiles: integer("max_miles").notNull(),
    typicalMiles: integer("typical_miles"), // for dynamic pricing, what's commonly seen
    isOneWay: boolean("is_one_way").default(true).notNull(), // true = one-way price, false = round-trip only
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_award_chart_program").on(table.programId),
    index("idx_award_chart_route").on(
      table.originRegionId,
      table.destinationRegionId
    ),
    index("idx_award_chart_cabin").on(table.cabinClass),
  ]
);

// Relations
export const creditCardProgramsRelations = relations(
  creditCardPrograms,
  ({ many }) => ({
    transferPartnerships: many(transferPartnerships),
  })
);

export const alliancesRelations = relations(alliances, ({ many }) => ({
  airlinePrograms: many(airlinePrograms),
}));

export const airlineProgramsRelations = relations(
  airlinePrograms,
  ({ one, many }) => ({
    alliance: one(alliances, {
      fields: [airlinePrograms.allianceId],
      references: [alliances.id],
    }),
    transferPartnerships: many(transferPartnerships),
    regions: many(regions),
    awardCharts: many(awardCharts),
    routes: many(airlineRoutes),
  })
);

export const transferPartnershipsRelations = relations(
  transferPartnerships,
  ({ one }) => ({
    creditCardProgram: one(creditCardPrograms, {
      fields: [transferPartnerships.creditCardProgramId],
      references: [creditCardPrograms.id],
    }),
    airlineProgram: one(airlinePrograms, {
      fields: [transferPartnerships.airlineProgramId],
      references: [airlinePrograms.id],
    }),
  })
);

export const regionsRelations = relations(regions, ({ one, many }) => ({
  program: one(airlinePrograms, {
    fields: [regions.programId],
    references: [airlinePrograms.id],
  }),
  airportMappings: many(airportRegionMappings),
  originAwardCharts: many(awardCharts, { relationName: "originRegion" }),
  destinationAwardCharts: many(awardCharts, { relationName: "destinationRegion" }),
}));

export const airportRegionMappingsRelations = relations(
  airportRegionMappings,
  ({ one }) => ({
    airport: one(airports, {
      fields: [airportRegionMappings.airportCode],
      references: [airports.code],
    }),
    region: one(regions, {
      fields: [airportRegionMappings.regionId],
      references: [regions.id],
    }),
    program: one(airlinePrograms, {
      fields: [airportRegionMappings.programId],
      references: [airlinePrograms.id],
    }),
  })
);

export const awardChartsRelations = relations(awardCharts, ({ one }) => ({
  program: one(airlinePrograms, {
    fields: [awardCharts.programId],
    references: [airlinePrograms.id],
  }),
  originRegion: one(regions, {
    fields: [awardCharts.originRegionId],
    references: [regions.id],
    relationName: "originRegion",
  }),
  destinationRegion: one(regions, {
    fields: [awardCharts.destinationRegionId],
    references: [regions.id],
    relationName: "destinationRegion",
  }),
}));

export const airlineRoutesRelations = relations(airlineRoutes, ({ one }) => ({
  airlineProgram: one(airlinePrograms, {
    fields: [airlineRoutes.airlineProgramId],
    references: [airlinePrograms.id],
  }),
  originAirport: one(airports, {
    fields: [airlineRoutes.originAirportCode],
    references: [airports.code],
    relationName: "originAirport",
  }),
  destinationAirport: one(airports, {
    fields: [airlineRoutes.destinationAirportCode],
    references: [airports.code],
    relationName: "destinationAirport",
  }),
}));

// Types for insert/select
export type CreditCardProgram = typeof creditCardPrograms.$inferSelect;
export type NewCreditCardProgram = typeof creditCardPrograms.$inferInsert;

export type Alliance = typeof alliances.$inferSelect;
export type NewAlliance = typeof alliances.$inferInsert;

export type AirlineProgram = typeof airlinePrograms.$inferSelect;
export type NewAirlineProgram = typeof airlinePrograms.$inferInsert;

export type TransferPartnership = typeof transferPartnerships.$inferSelect;
export type NewTransferPartnership = typeof transferPartnerships.$inferInsert;

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;

export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;

export type AirportRegionMapping = typeof airportRegionMappings.$inferSelect;
export type NewAirportRegionMapping = typeof airportRegionMappings.$inferInsert;

export type AwardChart = typeof awardCharts.$inferSelect;
export type NewAwardChart = typeof awardCharts.$inferInsert;

export type AirlineRoute = typeof airlineRoutes.$inferSelect;
export type NewAirlineRoute = typeof airlineRoutes.$inferInsert;
