import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDataDir } from "@/lib/metadata/covers";

type Params = Promise<{ file: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { file } = await params;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return new NextResponse("Invalid cover path", { status: 400 });
  }

  try {
    const coverPath = path.join(getDataDir(), "covers", file);
    const bytes = await readFile(coverPath);
    const contentType = file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new NextResponse(bytes, { headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new NextResponse("Cover not found", { status: 404 });
  }
}
