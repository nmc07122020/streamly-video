import { describe, expect, it } from "vitest";

describe("YouTube credentials", () => {
  it("can call the lightweight videos endpoint with the configured API key", async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    expect(apiKey, "YOUTUBE_API_KEY must be configured").toBeTruthy();

    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("id", "dQw4w9WgXcQ");
    url.searchParams.set("key", apiKey!);

    const response = await fetch(url);
    const body = await response.json() as { kind?: string; error?: { message?: string } };

    expect(response.ok, body.error?.message ?? "YouTube API request failed").toBe(true);
    expect(body.kind).toBe("youtube#videoListResponse");
  }, 15_000);
});
