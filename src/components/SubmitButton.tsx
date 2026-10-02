"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * A form's submit button that shows a spinner and locks while the form's
 * server action runs, including the refreshed page it returns.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending && <Spinner data-icon="inline-start" aria-hidden="true" role="presentation" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
