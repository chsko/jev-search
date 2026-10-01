/** Whether `zone` is an IANA time zone this runtime knows, such as "Europe/Oslo". */
export function isTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || !zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Every time zone to offer, with UTC first. */
export function timeZones(): string[] {
  return ["UTC", ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== "UTC")];
}

/** A 12-hour clock (3:05 PM) or a 24-hour one (15:05). */
export type TimeFormat = "12h" | "24h";

export function isTimeFormat(format: unknown): format is TimeFormat {
  return format === "12h" || format === "24h";
}

export function formatTime(at: number, timeZone: string, format: TimeFormat = "12h") {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    hourCycle: format === "24h" ? "h23" : "h12",
  }).format(at);
}
