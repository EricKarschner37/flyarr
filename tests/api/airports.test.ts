import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the search module
vi.mock("@/lib/search/find-awards", () => ({
  searchAirports: vi.fn(),
}));

// Import after mocking
import { GET } from "@/app/api/airports/route";
import { searchAirports } from "@/lib/search/find-awards";

describe("GET /api/airports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return airports matching the query", async () => {
    const mockAirports = [
      {
        code: "JFK",
        name: "John F. Kennedy",
        city: "New York",
        country: "USA",
        countryCode: "US",
        lat: "40.6413111",
        lng: "-73.7781391",
      },
    ];
    vi.mocked(searchAirports).mockResolvedValue(mockAirports);

    const request = new NextRequest("http://localhost/api/airports?q=JFK");
    const response = await GET(request);
    const data = await response.json();

    expect(searchAirports).toHaveBeenCalledWith("JFK");
    expect(data).toEqual(mockAirports);
    expect(response.status).toBe(200);
  });

  it("should handle empty query", async () => {
    vi.mocked(searchAirports).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/airports");
    const response = await GET(request);
    const data = await response.json();

    expect(searchAirports).toHaveBeenCalledWith("");
    expect(data).toEqual([]);
  });

  it("should handle search errors gracefully", async () => {
    vi.mocked(searchAirports).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost/api/airports?q=test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Search failed" });
  });

  it("should pass through the query parameter correctly", async () => {
    vi.mocked(searchAirports).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/airports?q=new%20york"
    );
    await GET(request);

    expect(searchAirports).toHaveBeenCalledWith("new york");
  });

  it("should return JSON content type", async () => {
    vi.mocked(searchAirports).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/airports?q=test");
    const response = await GET(request);

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
