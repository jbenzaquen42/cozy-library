"use server";

import { runOcr } from "@/lib/scan/ocr";

export type { OcrResult } from "@/lib/scan/ocr";

export async function ocrUpload(formData: FormData): Promise<import("@/lib/scan/ocr").OcrResult | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: "No image file provided." };
  }
  return runOcr(file);
}