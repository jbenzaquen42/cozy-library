"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { isbnFromBarcode } from "@/lib/isbn/normalize";

type ScanState = "idle" | "requesting" | "scanning" | "found" | "blocked" | "error";

export function BarcodeScanner({ onIsbn }: { onIsbn: (isbn: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("Camera starts only after you tap Start scanner.");

  useEffect(() => () => stopScanner(), []);

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }

  async function startScanner() {
    if (!videoRef.current) return;
    setState("requesting");
    setMessage("Requesting camera permission…");

    try {
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result) return;
        const isbn = isbnFromBarcode(result.getText());
        if (!isbn) {
          setMessage(`Scanned ${result.getText()}, but it does not look like an ISBN barcode.`);
          return;
        }
        setState("found");
        setMessage(`Found ISBN ${isbn}`);
        stopScanner();
        onIsbn(isbn);
      });
      setState("scanning");
      setMessage("Point your camera at the book barcode. Manual entry remains available below.");
    } catch (error) {
      stopScanner();
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setState("blocked");
        setMessage("Camera permission was blocked. Use manual ISBN entry below, or allow camera access in your browser settings.");
      } else if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        setState("blocked");
        setMessage("Camera access requires HTTPS, localhost, or a trusted secure context. Use manual ISBN entry below.");
      } else {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Scanner failed to start. Use manual ISBN entry below.");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-warm-border bg-deep-brown/10">
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      </div>
      <p className="text-sm text-muted-text">{message}</p>
      <div className="flex flex-wrap gap-2">
        {state === "scanning" || state === "requesting" ? (
          <Button type="button" variant="outline" onClick={() => { stopScanner(); setState("idle"); setMessage("Scanner stopped. Manual entry remains available below."); }}>
            Stop scanner
          </Button>
        ) : (
          <Button type="button" onClick={startScanner}>Start scanner</Button>
        )}
        {(state === "blocked" || state === "error") ? <span className="rounded-full bg-light-pink px-4 py-2 text-sm font-semibold text-deep-brown">Manual fallback ready</span> : null}
      </div>
    </div>
  );
}
