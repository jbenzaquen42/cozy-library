"use client";

import { ErrorMessage } from "@/components/ui/error-message";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <ErrorMessage error={error} onRetry={reset} />
    </div>
  );
}
