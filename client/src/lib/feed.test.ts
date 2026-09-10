import { describe, expect, it } from "vitest";
import { shouldUsePersonalFeed } from "./feed";

describe("feed mode", () => {
  it("keeps recommendations when YouTube is connected but has no videos", () => {
    expect(shouldUsePersonalFeed(true, 0)).toBe(false);
  });

  it("uses personal uploads once at least one video is available", () => {
    expect(shouldUsePersonalFeed(true, 1)).toBe(true);
  });

  it("uses recommendations while disconnected", () => {
    expect(shouldUsePersonalFeed(false, 10)).toBe(false);
  });
});
