"use client";

import { useEffect, useMemo, useOptimistic, useSyncExternalStore, useTransition } from "react";
import { saveTimeZone } from "@/app/settings/actions";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, timeZones } from "@/lib/timezone";

const subscribeNever = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const unknownOnServer = () => null;

/** The browser's time zone, or null while rendering on the server. */
function useBrowserZone() {
  return useSyncExternalStore(subscribeNever, browserZone, unknownOnServer);
}

/**
 * Until someone picks a time zone, saves the browser's, so later visits can
 * render times on the server.
 */
function useRememberBrowserZone(saved: string | null) {
  const detected = useBrowserZone();
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (!saved && detected) startTransition(() => saveTimeZone(detected));
  }, [saved, detected]);
  return saved ?? detected;
}

/** Remembers the browser's time zone for someone who hasn't picked one. */
export function RememberTimeZone({ saved }: { saved: string | null }) {
  useRememberBrowserZone(saved);
  return null;
}

/** The time zone setting, defaulting to the browser's. */
export function TimeZonePicker({ saved }: { saved: string | null }) {
  const current = useRememberBrowserZone(saved);
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

/** A search's time, in the saved zone or, before one is saved, the browser's. */
export function SearchTime({ at, zone }: { at: number; zone: string | null }) {
  const detected = useBrowserZone();
  const timeZone = zone ?? detected;
  if (!timeZone) return <Skeleton className="h-3 w-32" />;
  return <time dateTime={new Date(at).toISOString()}>{formatTime(at, timeZone)}</time>;
}
