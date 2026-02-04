import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base active");
  });

  it("should filter out falsy values", () => {
    const result = cn("base", false, null, undefined, "end");
    expect(result).toBe("base end");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toBe("foo bar baz");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      base: true,
      active: true,
      disabled: false,
    });
    expect(result).toBe("base active");
  });

  it("should merge Tailwind classes properly", () => {
    // tailwind-merge should handle conflicting classes
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("should handle complex Tailwind class merging", () => {
    const result = cn("px-4 py-2", "px-2");
    expect(result).toBe("py-2 px-2");
  });

  it("should handle hover states", () => {
    const result = cn("hover:bg-blue-500", "hover:bg-red-500");
    expect(result).toBe("hover:bg-red-500");
  });

  it("should preserve non-conflicting classes", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should work with empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
