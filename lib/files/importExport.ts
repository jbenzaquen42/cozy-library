import { AppError } from "../errors";

export async function previewCsvImport() {
  throw new AppError("NOT_IMPLEMENTED", "CSV import/export is introduced in a later stage");
}
