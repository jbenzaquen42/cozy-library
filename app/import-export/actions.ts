"use server";

import { revalidatePath } from "next/cache";
import { parseAndValidateBackup, type ImportPreview } from "@/lib/files/importParser";
import { restoreBackupV1, type RestoreResult } from "@/lib/files/importRestore";

export async function previewImportAction(fileContent: string): Promise<{
  preview: ImportPreview | null;
  error: string | null;
}> {
  try {
    const { preview } = parseAndValidateBackup(fileContent);
    return { preview, error: null };
  } catch (error) {
    return { preview: null, error: error instanceof Error ? error.message : "Preview failed" };
  }
}

export async function restoreImportAction(fileContent: string, confirmationPhrase: string): Promise<{
  result: RestoreResult | null;
  error: string | null;
}> {
  try {
    // Require explicit confirmation
    if (confirmationPhrase !== "REPLACE MY LIBRARY") {
      return { result: null, error: "Type REPLACE MY LIBRARY to confirm. This will delete all existing data." };
    }

    const { backup, preview } = parseAndValidateBackup(fileContent);
    if (!backup || !preview.valid) {
      return { result: null, error: "Backup file is invalid. Fix the errors and try again." };
    }

    const result = await restoreBackupV1(backup);

    revalidatePath("/");
    revalidatePath("/house/3d");
    revalidatePath("/catalog");
    revalidatePath("/locations");
    revalidatePath("/settings");
    revalidatePath("/unshelved");
    revalidatePath("/loans");
    revalidatePath("/import-export");

    return { result, error: null };
  } catch (error) {
    return { result: null, error: error instanceof Error ? error.message : "Restore failed" };
  }
}
