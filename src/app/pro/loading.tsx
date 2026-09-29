import { Skeleton } from "@/components/ui/skeleton";
import { Plans } from "./Plans";

/**
 * Shown the moment someone clicks Pro: the plans are the same for everyone, so
 * only the account-dependent button waits for the server.
 */
export default function Loading() {
  return (
    <Plans
      footer={
        <div role="status" aria-label="Loading your plan…" className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-full rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      }
    />
  );
}
