"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./button";

export function ErrorMessage({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-soft-red/30 bg-cream p-8 text-center shadow-lg shadow-amber-shadow/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-red/20">
        <AlertCircle className="h-8 w-8 text-soft-red" />
      </div>
      <h3 className="mt-4 font-heading text-xl font-semibold text-deep-brown">
        Something went wrong
      </h3>
      <p className="mt-2 max-w-xs text-muted-text">{error.message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" className="mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}
