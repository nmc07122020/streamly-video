import { describe, expect, it } from "vitest";
import { getYoutubeCategoryName } from "./youtube";

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
