"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "./actions";

/** Cancels at the end of the paid period, after a confirmation. */
export function CancelButton({ endsOn }: { endsOn: string | null }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Cancel subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Quairy Pro?</AlertDialogTitle>
          <AlertDialogDescription>
            {endsOn ? `You keep Pro until ${endsOn}. ` : ""}After that, searches are limited again
            and new searches aren’t added to your history. You can resume any time before then.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Pro</AlertDialogCancel>
          <form action={cancelSubscription}>
            <AlertDialogAction type="submit" variant="destructive">
              Cancel subscription
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
