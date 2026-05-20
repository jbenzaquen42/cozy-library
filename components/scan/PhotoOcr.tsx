"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OcrResult } from "@/lib/scan/ocr";

type OcrState = "idle" | "uploading" | "ready" | "error";

export function PhotoOcr() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<OcrState>("idle");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showText, setShowText] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  async function processFile(file: File) {
    setState("uploading");
    setErrorMessage("");
    setResult(null);
    setSelectedCandidate(null);

    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch("/api/scan-ocr", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json() as OcrResult | { error: string };
      if ("error" in payload) {
        setState("error");
        setErrorMessage(payload.error);
      } else {
        setResult(payload);
        setState("ready");
        if (payload.candidates.length > 0) {
          setSelectedCandidate(payload.candidates[0]!);
        }
      }
    } catch {
      setState("error");
      setErrorMessage("OCR processing failed. Check that the server and database are running.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  }

  function reset() {
    setState("idle");
    setResult(null);
    setErrorMessage("");
    setShowText(false);
    setSelectedCandidate(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const addHref = selectedCandidate
    ? `/books/new?isbn13=${encodeURIComponent(selectedCandidate)}`
    : "/books/new";

  return (
    <Card variant="white" title="Cover/spine OCR">
      <p className="mb-4 text-sm text-muted-text">
        Upload or take a photo of the book cover or spine. OCR extracts ISBN candidates from the image text.
      </p>

      {state === "idle" && (
        <div className="flex flex-wrap gap-3">
          <label>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Upload / take photo
            </Button>
          </label>
        </div>
      )}

      {state === "uploading" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-text">Running OCR on uploaded image…</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
            <div className="h-full animate-pulse rounded-full bg-baby-blue" style={{ width: "100%" }} />
          </div>
        </div>
      )}

      {state === "ready" && result && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset} variant="outline" size="sm">Scan another</Button>
          </div>

          <div>
            <button type="button" onClick={() => setShowText(!showText)} className="text-sm font-semibold text-deep-brown underline">
              {showText ? "Hide OCR text" : "Show OCR text"}
            </button>
            {showText && (
              <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-warm-border bg-cream p-3 text-xs text-soft-brown">
                {result.text || "(no text recognized)"}
              </pre>
            )}
          </div>

          {result.candidates.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-deep-brown">ISBN candidates</p>
              {result.candidates.map((candidate) => (
                <label key={candidate} className="flex items-center gap-3 rounded-2xl border border-warm-border bg-cream/70 p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="isbnCandidate"
                    checked={selectedCandidate === candidate}
                    onChange={() => setSelectedCandidate(candidate)}
                    className="accent-sage"
                  />
                  <span className="font-mono text-sm">{candidate}</span>
                </label>
              ))}
              <Button href={addHref}>Continue with selected ISBN</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-text">
                No ISBN candidates were found in the image text.
              </p>
              <Button href="/books/new" variant="outline">Add book manually</Button>
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="space-y-3">
          <p className="rounded-2xl border border-soft-red/30 bg-soft-red/10 p-3 text-sm font-semibold text-deep-brown">{errorMessage}</p>
          <div className="flex gap-2">
            <Button type="button" onClick={reset} variant="outline">Try again</Button>
            <Button href="/books/new" variant="secondary">Add book manually</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
