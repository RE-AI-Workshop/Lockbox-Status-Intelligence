import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";
import { metroLabel } from "@/lib/metros";

describe("formatCurrency", () => {
  // AC: whole-dollar amounts render with a $ and grouping commas
  it("formats whole dollars", () => {
    expect(formatCurrency(410000)).toBe("$410,000");
  });
});

describe("metroLabel", () => {
  it("returns the city name for a metro code", () => {
    expect(metroLabel("PHX")).toBe("Phoenix");
  });
});
