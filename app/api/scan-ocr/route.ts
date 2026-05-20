import { NextResponse } from "next/server";
import { runOcr } from "@/lib/scan/ocr";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }
  const result = await runOcr(file);
  return NextResponse.json(result);
}