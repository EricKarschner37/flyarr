import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsTable } from "@/components/results-table";
import { type AwardResult } from "@/lib/search/find-awards";

const mockResults: AwardResult[] = [
  {
    airlineProgram: {
      id: 1,
      name: "ANA Mileage Club",
      code: "ANA",
      hasDynamicPricing: false,
      searchUrl: "https://www.ana.co.jp",
      alliance: "Star Alliance",
    },
    awardCost: {
      minMiles: 75000,
      maxMiles: 75000,
      typicalMiles: 75000,
      isOneWay: false,
      notes: "Round-trip price",
    },
    transferOptions: [
      {
        creditCardProgram: {
          id: 1,
          name: "Amex MR",
          code: "AMEX_MR",
        },
        transferRatio: 1.0,
        transferTimeHours: 48,
        pointsNeeded: 75000,
        isBonusActive: false,
        bonusRatio: null,
      },
    ],
    originRegion: "North America",
    destinationRegion: "Japan",
  },
  {
    airlineProgram: {
      id: 2,
      name: "United MileagePlus",
      code: "UNITED",
      hasDynamicPricing: true,
      searchUrl: "https://www.united.com",
      alliance: "Star Alliance",
    },
    awardCost: {
      minMiles: 60000,
      maxMiles: 120000,
      typicalMiles: 80000,
      isOneWay: true,
      notes: null,
    },
    transferOptions: [
      {
        creditCardProgram: {
          id: 2,
          name: "Chase UR",
          code: "CHASE_UR",
        },
        transferRatio: 1.0,
        transferTimeHours: 0,
        pointsNeeded: 80000,
        isBonusActive: false,
        bonusRatio: null,
      },
    ],
    originRegion: "North America",
    destinationRegion: "Japan",
  },
];

describe("ResultsTable Component", () => {
  it("should render the results table with program names", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR", "CHASE_UR"]} />);

    // Both desktop table and mobile cards render the same content
    expect(screen.getAllByText("ANA Mileage Club").length).toBeGreaterThan(0);
    expect(screen.getAllByText("United MileagePlus").length).toBeGreaterThan(0);
  });

  it("should display fixed mileage costs correctly", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // ANA has fixed 75,000 miles
    expect(screen.getAllByText("75,000").length).toBeGreaterThan(0);
  });

  it("should display dynamic pricing range", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["CHASE_UR"]} />);

    // United has range 60,000 - 120,000
    expect(screen.getAllByText(/60,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/120,000/).length).toBeGreaterThan(0);
  });

  it("should show Dynamic badge for dynamic pricing programs", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["CHASE_UR"]} />);

    // Should show "Dynamic" badge for United
    expect(screen.getAllByText("Dynamic").length).toBeGreaterThan(0);
  });

  it("should show alliance badges", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // Both programs are Star Alliance
    expect(screen.getAllByText("Star Alliance").length).toBeGreaterThan(0);
  });

  it("should display transfer options with credit card codes", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR", "CHASE_UR"]} />);

    // Should show credit card codes
    expect(screen.getAllByText("AMEX MR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CHASE UR").length).toBeGreaterThan(0);
  });

  it("should display points needed for transfer", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // Should show points needed
    expect(screen.getAllByText("75,000 pts").length).toBeGreaterThan(0);
  });

  it("should format instant transfer time correctly", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["CHASE_UR"]} />);

    // Chase to United is instant (0 hours)
    expect(screen.getAllByText("Instant").length).toBeGreaterThan(0);
  });

  it("should format day-based transfer time correctly", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // Amex to ANA is 48 hours = 2d
    expect(screen.getAllByText("2d").length).toBeGreaterThan(0);
  });

  it("should show one-way or round-trip labels", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR", "CHASE_UR"]} />);

    // ANA is round-trip, United is one-way
    expect(screen.getAllByText("round-trip").length).toBeGreaterThan(0);
    expect(screen.getAllByText("one-way").length).toBeGreaterThan(0);
  });

  it("should show region route information", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // Should show origin → destination regions
    expect(
      screen.getAllByText(/North America.*→.*Japan/).length
    ).toBeGreaterThan(0);
  });

  it("should render search links for programs with URLs", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    const searchLinks = screen.getAllByRole("link", { name: /search/i });
    expect(searchLinks.length).toBeGreaterThan(0);
    expect(searchLinks[0]).toHaveAttribute("href", "https://www.ana.co.jp");
  });

  it("should handle empty results", () => {
    render(<ResultsTable results={[]} enabledPrograms={["AMEX_MR"]} />);

    // Should render without errors (empty table)
    expect(screen.queryByText("ANA Mileage Club")).not.toBeInTheDocument();
  });

  it("should show message when no transfer partners available", () => {
    const resultsWithNoTransfers: AwardResult[] = [
      {
        ...mockResults[0],
        transferOptions: [],
      },
    ];

    render(
      <ResultsTable
        results={resultsWithNoTransfers}
        enabledPrograms={["AMEX_MR"]}
      />
    );

    expect(
      screen.getAllByText("No transfer partners from your cards").length
    ).toBeGreaterThan(0);
  });
});

describe("ResultsTable Mobile View", () => {
  it("should render card view for mobile (md:hidden class)", () => {
    render(<ResultsTable results={mockResults} enabledPrograms={["AMEX_MR"]} />);

    // The component has both desktop table (hidden md:block) and mobile cards (md:hidden)
    // We can verify both exist in the DOM
    const tables = document.querySelectorAll("table");
    expect(tables.length).toBe(1); // One table for desktop

    // Mobile cards should exist
    const cards = document.querySelectorAll('[class*="md:hidden"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
