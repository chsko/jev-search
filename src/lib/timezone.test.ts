import { describe, expect, it } from "vitest";
import { formatTime, isTimeFormat, isTimeZone, timeZones } from "./timezone";

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

  it("formats on a 12- or 24-hour clock", () => {
    const at = Date.UTC(2026, 9, 1, 13, 5);
    expect(formatTime(at, "Europe/Oslo", "12h")).toBe("Oct 1, 2026, 3:05 PM");
    expect(formatTime(at, "Europe/Oslo", "24h")).toBe("Oct 1, 2026, 15:05");
    expect(isTimeFormat("24h")).toBe(true);
    expect(isTimeFormat("25h")).toBe(false);
  });
});
