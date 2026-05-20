import { AppError } from "../errors";

export const importExportStatus = {
  status: "deferred",
  summary: "Import/export backup flows are intentionally deferred and are not exposed through primary navigation.",
  recoveryGuidance: "Use PostgreSQL volume backups or pg_dump before making large catalog changes.",
} as const;

export async function previewCsvImport() {
  throw new AppError("NOT_IMPLEMENTED", "Import/export backup flows are intentionally deferred. Use database backups for now.");
}
