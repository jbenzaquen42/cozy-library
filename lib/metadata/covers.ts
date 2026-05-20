import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function getDataDir() {
  return process.env.APP_DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
}

export async function cacheCoverImage(bookId: string, coverUrl?: string) {
  if (!coverUrl) return null;
  const response = await fetch(coverUrl);
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const bytes = Buffer.from(await response.arrayBuffer());
  const coversDir = path.join(getDataDir(), "covers");
  await mkdir(coversDir, { recursive: true });
  const fileName = `${bookId}.${extension}`;
  await writeFile(path.join(coversDir, fileName), bytes);
  return { publicPath: `/covers/${fileName}`, filePath: path.join(coversDir, fileName), mimeType: contentType, sourceUrl: coverUrl };
}
