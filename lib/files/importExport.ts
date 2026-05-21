import { AppError } from "../errors";

export const importExportStatus = {
  status: "available" as const,
  summary: "Export your complete library as a portable JSON backup file.",
  recoveryGuidance: "Import this backup on any Cozy Library instance to recreate your shelves, books, and placements.",
} as const;

export async function previewCsvImport() {
  throw new AppError("NOT_IMPLEMENTED", "Import/export backup flows are intentionally deferred. Use database backups for now.");
}
