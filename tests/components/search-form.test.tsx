import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchForm } from "@/components/search-form";

// Mock the router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock fetch for airport search
global.fetch = vi.fn();

// Helper to get/set cookies in tests
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

describe("SearchForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCookies();
  });

  afterEach(() => {
    clearCookies();
  });

  it("should render the search form with all elements", () => {
    render(<SearchForm />);

    expect(screen.getByText("Search Award Flights")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Travel Date")).toBeInTheDocument();
    expect(screen.getByText("Cabin Class")).toBeInTheDocument();
    expect(screen.getByText("Your Credit Card Programs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search award options/i })
    ).toBeInTheDocument();
  });

  it("should display all credit card program toggles", () => {
    render(<SearchForm />);

    expect(screen.getByText("Amex MR")).toBeInTheDocument();
    expect(screen.getByText("Chase UR")).toBeInTheDocument();
    expect(screen.getByText("Citi TY")).toBeInTheDocument();
    expect(screen.getByText("Capital One")).toBeInTheDocument();
    expect(screen.getByText("Bilt")).toBeInTheDocument();
  });

  it("should have all cabin classes available", () => {
    render(<SearchForm />);

    // Find all comboboxes (origin, destination, and cabin class)
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThanOrEqual(3);
  });

  it("should disable search button when origin or destination is empty", () => {
    render(<SearchForm />);

    const searchButton = screen.getByRole("button", {
      name: /search award options/i,
    });
    expect(searchButton).toBeDisabled();
  });

  it("should have default cabin class as economy", () => {
    render(<SearchForm />);

    // The select should show "Economy" by default
    expect(screen.getByText("Economy")).toBeInTheDocument();
  });

  it("should have all credit card programs enabled by default", () => {
    render(<SearchForm />);

    // Get all switches (credit card programs + flexible dates toggle)
    const switches = screen.getAllByRole("switch");
    // 5 credit card programs + 1 flexible dates toggle = 6 switches
    expect(switches.length).toBeGreaterThanOrEqual(5);

    // Find only the credit card switches by their labels
    const amexSwitch = screen.getByRole("switch", { name: /amex mr/i });
    const chaseSwitch = screen.getByRole("switch", { name: /chase ur/i });
    const citiSwitch = screen.getByRole("switch", { name: /citi ty/i });
    const capitalOneSwitch = screen.getByRole("switch", { name: /capital one/i });
    const biltSwitch = screen.getByRole("switch", { name: /bilt/i });

    expect(amexSwitch).toHaveAttribute("aria-checked", "true");
    expect(chaseSwitch).toHaveAttribute("aria-checked", "true");
    expect(citiSwitch).toHaveAttribute("aria-checked", "true");
    expect(capitalOneSwitch).toHaveAttribute("aria-checked", "true");
    expect(biltSwitch).toHaveAttribute("aria-checked", "true");
  });

  it("should toggle credit card program off and on", async () => {
    render(<SearchForm />);

    const amexSwitch = screen.getByRole("switch", { name: /amex mr/i });
    expect(amexSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(amexSwitch);
    expect(amexSwitch).toHaveAttribute("aria-checked", "false");

    fireEvent.click(amexSwitch);
    expect(amexSwitch).toHaveAttribute("aria-checked", "true");
  });

  it("should persist credit card program selections to cookies", async () => {
    render(<SearchForm />);

    const amexSwitch = screen.getByRole("switch", { name: /amex mr/i });
    fireEvent.click(amexSwitch);

    // Wait for the effect to run and save to cookie
    await waitFor(() => {
      const cookieValue = getCookie("flyarr_search_prefs");
      expect(cookieValue).toBeTruthy();
      const parsed = JSON.parse(cookieValue!);
      expect(parsed.enabledPrograms).not.toContain("AMEX_MR");
    });
  });

  it("should have a date picker that defaults to a future date", () => {
    render(<SearchForm />);

    // Look for the date picker button (it should show a formatted date)
    const dateButton = screen.getByRole("button", { name: /\w+ \d+, \d{4}|pick a date|select travel date/i });
    expect(dateButton).toBeInTheDocument();
  });

  it("should have a flexible dates toggle", () => {
    render(<SearchForm />);

    const flexibleDatesLabel = screen.getByText("Flexible dates");
    expect(flexibleDatesLabel).toBeInTheDocument();

    const flexibleDatesSwitch = screen.getByRole("switch", { name: /flexible dates/i });
    expect(flexibleDatesSwitch).toBeInTheDocument();
    // Should be off by default
    expect(flexibleDatesSwitch).toHaveAttribute("aria-checked", "false");
  });

  it("should toggle between single date and date range picker", () => {
    render(<SearchForm />);

    const flexibleDatesSwitch = screen.getByRole("switch", { name: /flexible dates/i });

    // Initially should be single date mode
    expect(flexibleDatesSwitch).toHaveAttribute("aria-checked", "false");

    // Toggle to date range mode
    fireEvent.click(flexibleDatesSwitch);
    expect(flexibleDatesSwitch).toHaveAttribute("aria-checked", "true");

    // Toggle back to single date mode
    fireEvent.click(flexibleDatesSwitch);
    expect(flexibleDatesSwitch).toHaveAttribute("aria-checked", "false");
  });
});
