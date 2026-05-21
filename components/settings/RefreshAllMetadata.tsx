"use client";

import { useState, useTransition } from "react";
import { refreshAllMetadataAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";

export function RefreshAllMetadataCard() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    scanned: number;
    refreshed: number;
    failed: number;
    failures: { title: string; author: string; isbn: string | null; error: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    if (!window.confirm("Refresh metadata for all books? This may take a minute and will contact external providers.")) {
      return;
    }
    setResult(null);
    setError(null);
    startTransition(async () => {
      const response = await refreshAllMetadataAction();
      if (response.ok) {
        setResult({
          scanned: response.scanned ?? 0,
          refreshed: response.refreshed ?? 0,
          failed: response.failed ?? 0,
          failures: response.failures ?? [],
        });
      } else {
        setError(response.message ?? "Unknown error");
      }
    });
  }

  return (
    <div className="rounded-3xl border border-warm-border bg-cream/50 p-5 shadow-lg shadow-amber-shadow/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-deep-brown">Refresh all metadata</h3>
          <p className="mt-1 text-sm text-muted-text">
            Look up metadata for every book from configured providers. This can take a minute.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={isPending}
          onClick={handleRefresh}
        >
          {isPending ? "Refreshing…" : "Refresh all metadata"}
        </Button>
      </div>

      {isPending && (
        <div className="mt-4 rounded-2xl border border-sage/20 bg-sage/10 p-4 text-sm text-deep-brown">
          <p className="font-semibold">Refreshing metadata…</p>
          <p className="mt-1 text-muted-text">This may take a minute. Books are processed one at a time to avoid rate limits.</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-sage/30 bg-sage/10 p-4 text-sm text-deep-brown">
          <p className="font-semibold">
            Refreshed {result.refreshed} of {result.scanned} books
            {result.failed > 0 ? ` (${result.failed} failed)` : ""}
          </p>
          {result.failures.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-text hover:text-deep-brown">
                Show {result.failures.length} failures
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-muted-text">
                {result.failures.map((f, i) => (
                  <li key={i}>
                    <span className="font-semibold text-deep-brown">{f.title}</span> — {f.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-soft-red/30 bg-soft-red/10 p-4 text-sm text-deep-brown">
          <p className="font-semibold">Refresh failed</p>
          <p className="mt-1 text-muted-text">{error}</p>
        </div>
      )}
    </div>
  );
}
