import { describe, expect, it } from "vitest";
import { getYoutubeChannelIds } from "./youtube";

describe("YouTube feed channel selection", () => {
  it("includes the connected channel even when subscriptions are empty", () => {
    expect(getYoutubeChannelIds("UC-own-channel", [])).toEqual(["UC-own-channel"]);
  });

  it("deduplicates the connected channel and subscribed channels", () => {
    expect(getYoutubeChannelIds("UC-own-channel", ["UC-one", "UC-own-channel", "UC-one"])).toEqual([
      "UC-own-channel",
      "UC-one",
    ]);
  });
});
