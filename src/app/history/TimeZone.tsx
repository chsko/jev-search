"use client";

import { useEffect, useMemo, useOptimistic, useSyncExternalStore, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, timeZones } from "@/lib/timezone";
import { saveTimeZone } from "./actions";

const subscribeNever = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const unknownOnServer = () => null;

/** The browser's time zone, or null while rendering on the server. */
function useBrowserZone() {
  return useSyncExternalStore(subscribeNever, browserZone, unknownOnServer);
}

/**
 * Picks the time zone for the history's timestamps. Until someone picks one,
 * it uses (and saves) the browser's, so later visits render it on the server.
 */
export function TimeZonePicker({ saved }: { saved: string | null }) {
  const detected = useBrowserZone();
  const [zone, setZone] = useOptimistic(saved ?? detected);
  const [, startTransition] = useTransition();
  const zones = useMemo(() => {
    const all = timeZones();
    return zone && !all.includes(zone) ? [zone, ...all] : all;
  }, [zone]);

  useEffect(() => {
    if (!saved && detected) startTransition(() => saveTimeZone(detected));
  }, [saved, detected]);

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="time-zone" className="text-muted-foreground">
        Time zone
      </Label>
      <NativeSelect
        id="time-zone"
        size="sm"
        // Sized for typical names rather than the longest one in the list.
        className="w-44"
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
    </div>
  );
}

/** A search's time, in the saved zone or, before one is saved, the browser's. */
export function SearchTime({ at, zone }: { at: number; zone: string | null }) {
  const detected = useBrowserZone();
  const timeZone = zone ?? detected;
  if (!timeZone) return <Skeleton className="h-3 w-32" />;
  return <time dateTime={new Date(at).toISOString()}>{formatTime(at, timeZone)}</time>;
}
