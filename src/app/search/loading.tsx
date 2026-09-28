import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/Transitions";

export default function Loading() {
  // Rises in with the page on a typed navigation, and sinks away when the
  // answer arrives (an untyped Suspense reveal).
  return (
    <PageTransition exitOnReveal="reveal-out">
      <Card role="status" aria-label="Finding the answer…">
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-2/3" />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
