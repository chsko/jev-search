"use client";

import { useEffect, useMemo, useOptimistic, useSyncExternalStore, useTransition } from "react";
import { saveTimeFormat, saveTimeZone } from "@/app/settings/actions";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, type TimeFormat, timeZones } from "@/lib/timezone";

const subscribeNever = () => () => {};
const unknownOnServer = () => null;
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
/** The clock the browser's language uses: 24-hour in most of Europe, 12-hour in the US. */
const browserFormat = (): TimeFormat => {
  const { hourCycle } = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions();
  return hourCycle === "h23" || hourCycle === "h24" ? "24h" : "12h";
};

/** A browser setting, or null while rendering on the server. */
function useBrowser<T>(read: () => T) {
  return useSyncExternalStore(subscribeNever, read, unknownOnServer);
}

/**
 * Until someone picks a setting, uses (and saves) the browser's, so later
 * visits can render times on the server.
 */
function useRemembered<T extends string>(saved: T | null, read: () => T, save: (value: T) => Promise<void>) {
  const detected = useBrowser(read);
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (!saved && detected) startTransition(() => save(detected));
  }, [saved, detected, save]);
  return saved ?? detected;
}

export type Saved = { timeZone: string | null; timeFormat: TimeFormat | null };

/** Remembers the browser's time zone and clock for someone who hasn't picked them. */
export function RememberTimePreferences({ saved }: { saved: Saved }) {
  useRemembered(saved.timeZone, browserZone, saveTimeZone);
  useRemembered(saved.timeFormat, browserFormat, saveTimeFormat);
  return null;
}

/** The time zone setting, defaulting to the browser's. */
export function TimeZonePicker({ saved }: { saved: string | null }) {
  const current = useRemembered(saved, browserZone, saveTimeZone);
  const [zone, setZone] = useOptimistic(current);
  const [, startTransition] = useTransition();
  const zones = useMemo(() => {
    const all = timeZones();
    return zone && !all.includes(zone) ? [zone, ...all] : all;
  }, [zone]);

  return (
    <Field>
      <FieldLabel htmlFor="time-zone">Time zone</FieldLabel>
      <NativeSelect
        id="time-zone"
        className="w-full max-w-xs"
        value={zone ?? ""}
        disabled={!zone}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            setZone(next);
            await saveTimeZone(next);
          });
        }}
      >
        {!zone && <NativeSelectOption value="">Detecting…</NativeSelectOption>}
        {zones.map((z) => (
          <NativeSelectOption key={z} value={z}>
            {z.replaceAll("_", " ")}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldDescription>Your search history shows times in this time zone.</FieldDescription>
    </Field>
  );
}

const SAMPLE = Date.UTC(2026, 0, 1, 15, 30);

/** The clock setting, defaulting to the browser's. */
export function TimeFormatPicker({ saved }: { saved: TimeFormat | null }) {
  const current = useRemembered(saved, browserFormat, saveTimeFormat);
  const [format, setFormat] = useOptimistic(current);
  const [, startTransition] = useTransition();
  const sample = (f: TimeFormat) => formatTime(SAMPLE, "UTC", f).split(", ").at(-1);

  return (
    <Field>
      <FieldLabel htmlFor="time-format">Time format</FieldLabel>
      <NativeSelect
        id="time-format"
        className="w-full max-w-xs"
        value={format ?? ""}
        disabled={!format}
        onChange={(event) => {
          const next = event.target.value as TimeFormat;
          startTransition(async () => {
            setFormat(next);
            await saveTimeFormat(next);
          });
        }}
      >
        {!format && <NativeSelectOption value="">Detecting…</NativeSelectOption>}
        <NativeSelectOption value="12h">12-hour ({sample("12h")})</NativeSelectOption>
        <NativeSelectOption value="24h">24-hour ({sample("24h")})</NativeSelectOption>
      </NativeSelect>
    </Field>
  );
}

/** A search's time, in the saved settings or, before they're saved, the browser's. */
export function SearchTime({ at, saved }: { at: number; saved: Saved }) {
  const zone = useBrowser(browserZone);
  const format = useBrowser(browserFormat);
  const timeZone = saved.timeZone ?? zone;
  const timeFormat = saved.timeFormat ?? format;
  if (!timeZone || !timeFormat) return <Skeleton className="h-3 w-32" />;
  return <time dateTime={new Date(at).toISOString()}>{formatTime(at, timeZone, timeFormat)}</time>;
}
