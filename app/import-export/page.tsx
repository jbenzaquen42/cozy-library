"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { previewImportAction, restoreImportAction } from "./actions";
import type { ImportPreview } from "@/lib/files/importParser";
import type { RestoreResult } from "@/lib/files/importRestore";

export default function ImportExportPage() {
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Import state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  function handleExport() {
    setExporting(true);
    const url = `/api/export?includeMetadata=${includeMetadata}`;
    // Use a link click so the browser handles the download natively
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Reset loading after a short delay (download starts asynchronously)
    setTimeout(() => setExporting(false), 2000);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewLoading(true);
    setPreview(null);
    setRestoreResult(null);
    setConfirmationPhrase("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      const { preview: result, error } = await previewImportAction(content);
      if (error) {
        // Create a minimal error preview for display
        setPreview({
          schemaVersion: 0,
          exportedAt: "",
          includeMetadata: false,
          levels: 0,
          rooms: 0,
          bookcases: 0,
          slots: 0,
          books: 0,
          copies: 0,
          unshelvedCopies: 0,
          warnings: [],
          errors: [error],
          valid: false,
        });
      } else {
        setPreview(result);
      }
      setPreviewLoading(false);
    };
    reader.readAsText(file);
  }

  async function handleRestore() {
    if (!fileContent || confirmationPhrase !== "REPLACE MY LIBRARY") return;

    setRestoring(true);
    const { result, error } = await restoreImportAction(fileContent, confirmationPhrase);

    if (error) {
      setRestoreResult({
        success: false,
        levelsCreated: 0,
        roomsCreated: 0,
        bookcasesCreated: 0,
        slotsCreated: 0,
        booksCreated: 0,
        copiesCreated: 0,
        errors: [error],
      });
    } else {
      setRestoreResult(result);
    }
    setRestoring(false);
  }

  function handleCancelImport() {
    setPreview(null);
    setFileContent(null);
    setConfirmationPhrase("");
    setRestoreResult(null);
    setRestoring(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader label="Tools" title="Import / Export" />

      <Card variant="cream" title="Download backup">
        <div className="space-y-4">
          <p className="text-muted-text">
            Download a complete backup of your library, including all shelves, books, placements, and colors.
          </p>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="h-4 w-4 rounded border-soft-brown text-sage focus:ring-sage"
              />
              <span className="text-sm font-medium">Include metadata</span>
            </label>
          </div>

          <p className="text-xs text-muted-text">
            {includeMetadata
              ? "Metadata includes provider responses and scan history. This makes the file larger and may include data from external services."
              : "Metadata is excluded. Book details like title, author, ISBN, and colors are still included."}
          </p>

          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Preparing download…" : "Download backup"}
          </Button>
        </div>
      </Card>

      {/* Import Card */}
      <Card variant="cream" title="Restore from backup">
        <div className="space-y-4">
          {!preview && !restoreResult && (
            <>
              <p className="text-muted-text">
                Upload a previously exported backup file to preview and restore your library.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-text file:mr-4 file:rounded-full file:border-0 file:bg-sage/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-deep-brown hover:file:bg-sage/30"
              />
              {previewLoading && <p className="text-sm text-muted-text">Reading backup file…</p>}
            </>
          )}

          {preview && !restoreResult && (
            <>
              <div className="rounded-lg bg-parchment p-4 space-y-2">
                <p className="text-sm font-semibold text-deep-brown">Backup preview</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-text">Exported:</span>
                  <span>{preview.exportedAt ? new Date(preview.exportedAt).toLocaleDateString() : "Unknown"}</span>
                  <span className="text-muted-text">Metadata:</span>
                  <span>{preview.includeMetadata ? "Included" : "Excluded"}</span>
                  <span className="text-muted-text">Levels:</span>
                  <span>{preview.levels}</span>
                  <span className="text-muted-text">Rooms:</span>
                  <span>{preview.rooms}</span>
                  <span className="text-muted-text">Bookcases:</span>
                  <span>{preview.bookcases}</span>
                  <span className="text-muted-text">Shelf spots:</span>
                  <span>{preview.slots}</span>
                  <span className="text-muted-text">Books:</span>
                  <span>{preview.books}</span>
                  <span className="text-muted-text">Copies:</span>
                  <span>{preview.copies} ({preview.unshelvedCopies} waiting for a home)</span>
                </div>
              </div>

              {preview.warnings.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm font-semibold text-amber-800">Warnings</p>
                  <ul className="mt-1 text-xs text-amber-700 list-disc list-inside">
                    {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {preview.errors.length > 0 ? (
                <div className="rounded-lg bg-soft-red/10 border border-soft-red/30 p-3">
                  <p className="text-sm font-semibold text-soft-red">Cannot restore</p>
                  <ul className="mt-1 text-xs text-soft-red list-disc list-inside">
                    {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-soft-red/10 border border-soft-red/30 p-3">
                    <p className="text-sm font-semibold text-soft-red">This will replace your entire library</p>
                    <p className="text-xs text-soft-red/80 mt-1">All current books, shelves, and placements will be permanently deleted and replaced with the backup data.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-deep-brown mb-1">
                      Type <code className="bg-parchment px-1 rounded">REPLACE MY LIBRARY</code> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmationPhrase}
                      onChange={(e) => setConfirmationPhrase(e.target.value)}
                      className="w-full rounded-lg border border-warm-border bg-white px-3 py-2 text-sm"
                      placeholder="REPLACE MY LIBRARY"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRestore}
                      disabled={confirmationPhrase !== "REPLACE MY LIBRARY" || restoring}
                      variant="danger"
                    >
                      {restoring ? "Restoring…" : "Replace library with backup"}
                    </Button>
                    <Button onClick={handleCancelImport} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {restoreResult && (
            <div className="space-y-3">
              {restoreResult.success ? (
                <div className="rounded-lg bg-sage/10 border border-sage/30 p-3">
                  <p className="text-sm font-semibold text-sage">Library restored successfully</p>
                  <div className="mt-2 text-xs text-muted-text grid grid-cols-2 gap-1">
                    <span>Levels: {restoreResult.levelsCreated}</span>
                    <span>Rooms: {restoreResult.roomsCreated}</span>
                    <span>Bookcases: {restoreResult.bookcasesCreated}</span>
                    <span>Shelf spots: {restoreResult.slotsCreated}</span>
                    <span>Books: {restoreResult.booksCreated}</span>
                    <span>Copies: {restoreResult.copiesCreated}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-soft-red/10 border border-soft-red/30 p-3">
                  <p className="text-sm font-semibold text-soft-red">Restore failed</p>
                  <ul className="mt-1 text-xs text-soft-red list-disc list-inside">
                    {restoreResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <Button onClick={handleCancelImport}>Done</Button>
            </div>
          )}
        </div>
      </Card>

      <Card variant="cream" title="Advanced tools">
        <div className="space-y-3 text-sm text-muted-text">
          <p>
            For spreadsheet editing or migration, use the CSV command-line tools:
          </p>
          <code className="block rounded bg-parchment p-2 text-xs">
            npm run inventory:export:csv -- books.csv<br />
            npm run inventory:import:csv -- books.csv
          </code>
        </div>
      </Card>
    </div>
  );
}
