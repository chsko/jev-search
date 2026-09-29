import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the moment someone opens History. Neutral, since the page may be the
 * list of searches or, without Pro, a note about Pro.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading your search history…"
      className="flex flex-col items-center gap-3 rounded-xl border p-6"
    >
      <Skeleton className="size-8 rounded-lg" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-64 max-w-full" />
    </div>
  );
}
