"use client";

import { useMemo, useState, useTransition } from "react";
import { lookupMetadataAction } from "@/app/scan/metadata-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarcodeScanner } from "./BarcodeScanner";
import { isLikelyIsbn, normalizeIsbn } from "@/lib/isbn/normalize";
import type { MetadataLookupResult } from "@/lib/metadata/types";

export function ScanFlow() {
  const [isbn, setIsbn] = useState("");
  const [results, setResults] = useState<MetadataLookupResult[]>([]);
  const [status, setStatus] = useState("Ready to scan or type an ISBN.");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const normalized = useMemo(() => normalizeIsbn(isbn), [isbn]);

  function lookup(nextIsbn = normalized) {
    if (!isLikelyIsbn(nextIsbn)) {
      setStatus("Enter or scan a 10- or 13-digit ISBN first.");
      return;
    }
    setLoading(true);
    setStatus(`Looking up ISBN ${nextIsbn}…`);
    startTransition(async () => {
      try {
        const found = await lookupMetadataAction(nextIsbn);
        setResults(found);
        setStatus(found.length > 0 ? `Found ${found.length} metadata source${found.length === 1 ? "" : "s"}.` : "No metadata found. You can still add the book manually.");
      } catch (error) {
        setResults([]);
        setStatus(error instanceof Error ? error.message : "Metadata lookup failed. You can still add the book manually.");
      } finally {
        setLoading(false);
      }
    });
  }

  function handleIsbn(nextIsbn: string) {
    setIsbn(nextIsbn);
    void lookup(nextIsbn);
  }

  const best = results[0];
  const addHref = best
    ? `/books/new?isbn13=${encodeURIComponent(best.isbn13 ?? normalized)}&isbn10=${encodeURIComponent(best.isbn10 ?? "")}&title=${encodeURIComponent(best.title ?? "")}&displayAuthor=${encodeURIComponent(best.authors?.join(", ") ?? "")}&publisher=${encodeURIComponent(best.publisher ?? "")}&publishedDate=${encodeURIComponent(best.publishedDate ?? "")}&pageCount=${encodeURIComponent(best.pageCount?.toString() ?? "")}&language=${encodeURIComponent(best.language ?? "")}&description=${encodeURIComponent(best.description ?? "")}&subtitle=${encodeURIComponent(best.subtitle ?? "")}`
    : `/books/new?isbn13=${encodeURIComponent(normalized)}`;

  return (
    <div className="space-y-6">
      <Card variant="cream" title="Barcode scanner">
        <BarcodeScanner onIsbn={handleIsbn} />
      </Card>

      <Card variant="white" title="Manual fallback">
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="isbn-scan-input">ISBN</label>
          <input id="isbn-scan-input" name="isbn" value={isbn} onChange={(event) => setIsbn(event.target.value)} placeholder="Type ISBN" className="w-full rounded-2xl border border-warm-border bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage" />
          <Button type="button" onClick={() => void lookup()} disabled={loading || pending}>{loading || pending ? "Looking…" : "Lookup"}</Button>
        </div>
        <p className="mt-3 text-sm text-muted-text">{status}</p>
      </Card>

      <Card variant="blue" title="Metadata review">
        {results.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-text">Scan or type an ISBN to preview provider results. Manual add is always available.</p>
            {isLikelyIsbn(normalized) ? <Button href={addHref}>Add manually with ISBN</Button> : <Button href="/books/new" variant="outline">Add manually</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.provider} className="rounded-2xl border border-warm-border bg-cream/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">{result.provider}</p>
                <h3 className="font-heading text-xl font-semibold text-deep-brown">{result.title ?? "Untitled"}</h3>
                <p className="text-sm text-muted-text">{result.authors?.join(", ") ?? "Unknown author"}</p>
                {result.publisher ? <p className="text-sm text-soft-brown">{result.publisher}</p> : null}
              </div>
            ))}
            <Button href={addHref}>Use best result in manual form</Button>
          </div>
        )}
      </Card>
    </div>
  );
}