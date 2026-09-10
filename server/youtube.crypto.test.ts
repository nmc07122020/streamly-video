import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./youtube";

describe("YouTube token protection", () => {
  it("round-trips an OAuth token through encryption", () => {
    const token = "ya29.test-access-token";
    const encrypted = encrypt(token);

    expect(encrypted).not.toContain(token);
    expect(decrypt(encrypted)).toBe(token);
  });
});
