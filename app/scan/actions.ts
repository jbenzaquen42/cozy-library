"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import Tesseract from "tesseract.js";
import { getDataDir } from "@/lib/metadata/covers";
import { extractIsbnCandidates } from "@/lib/isbn/extract";

export type OcrResult = {
  text: string;
  candidates: string[];
  imagePath: string;
};

export async function ocrUpload(formData: FormData): Promise<OcrResult | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof Blob)) {
    return { error: "No image file provided." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "Image file too large. Use an image under 20 MB." };
  }

  const uploadsDir = path.join(getDataDir(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const extension = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const worker = await Tesseract.createWorker("eng");
  try {
    const { data } = await worker.recognize(bytes);
    const text = data.text.trim();
    const candidates = extractIsbnCandidates(text);
    return { text, candidates, imagePath: `/uploads/${fileName}` };
  } finally {
    await worker.terminate();
  }
}
