"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cancelSubscription } from "./actions";

/**
 * Cancels at the end of the paid period, after a confirmation. The dialog
 * stays open, with a spinner, until the cancellation and the refreshed page
 * are through.
 */
export function CancelButton({ endsOn }: { endsOn: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
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
          <AlertDialogCancel disabled={pending}>Keep Pro</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            aria-busy={pending}
            onClick={() =>
              startTransition(async () => {
                await cancelSubscription();
                setOpen(false);
              })
            }
          >
            {pending && <Spinner data-icon="inline-start" aria-hidden="true" role="presentation" />}
            {pending ? "Cancelling…" : "Cancel subscription"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
