import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card role="status" aria-label="Jev is thinking…">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-2/3" />
      </CardContent>
    </Card>
  );
}
