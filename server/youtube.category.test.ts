import { describe, expect, it } from "vitest";
import { getYoutubeCategoryName, parseYoutubeDuration } from "./youtube";

describe("YouTube category mapping", () => {
  it("maps YouTube category IDs to shared Streamly topics", () => {
    expect(getYoutubeCategoryName("10")).toBe("Music");
    expect(getYoutubeCategoryName("20")).toBe("Gaming");
    expect(getYoutubeCategoryName("28")).toBe("Tech");
  });

  it("falls back to All for an unknown category", () => {
    expect(getYoutubeCategoryName("unknown")).toBe("All");
  });
});

describe("YouTube duration parsing", () => {
  it("converts ISO 8601 durations to seconds", () => {
    expect(parseYoutubeDuration("PT1H2M3S")).toBe(3723);
    expect(parseYoutubeDuration("PT4M12S")).toBe(252);
    expect(parseYoutubeDuration("PT45S")).toBe(45);
  });
});
