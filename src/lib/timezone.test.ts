import { describe, expect, it } from "vitest";
import { formatTime, isTimeZone, timeZones } from "./timezone";

describe("time zones", () => {
  it("accepts IANA zones and rejects anything else", () => {
    expect(isTimeZone("Europe/Oslo")).toBe(true);
    expect(isTimeZone("UTC")).toBe(true);
    expect(isTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isTimeZone("")).toBe(false);
    expect(isTimeZone(42)).toBe(false);
  });

  it("offers UTC first, once, and Oslo", () => {
    const zones = timeZones();
    expect(zones[0]).toBe("UTC");
    expect(zones.filter((z) => z === "UTC")).toHaveLength(1);
    expect(zones).toContain("Europe/Oslo");
  });

  it("formats in the chosen zone", () => {
    const at = Date.UTC(2026, 9, 1, 9, 33);
    expect(formatTime(at, "UTC")).toBe("Oct 1, 2026, 9:33 AM");
    expect(formatTime(at, "Europe/Oslo")).toBe("Oct 1, 2026, 11:33 AM");
  });
});
