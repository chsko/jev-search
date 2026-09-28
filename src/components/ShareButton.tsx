"use client";

import { useEffect, useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shares the current page with the system share sheet, or copies its link. */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={share}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <Share2Icon data-icon="inline-start" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </Button>
  );
}
