import { describe, expect, it } from "vitest";
import { matchesVideoSearch, shouldUsePersonalFeed } from "./feed";

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

describe("video search", () => {
  const video = { title: "Nấu mì ramen từ đầu", creator: "Bếp Chậm", category: "Food" };

  it("matches title and creator text case-insensitively", () => {
    expect(matchesVideoSearch(video, "RAMEN")).toBe(true);
    expect(matchesVideoSearch(video, "bếp chậm")).toBe(true);
  });

  it("matches category text and returns false for unrelated terms", () => {
    expect(matchesVideoSearch(video, "Food")).toBe(true);
    expect(matchesVideoSearch(video, "du lịch")).toBe(false);
  });
});
