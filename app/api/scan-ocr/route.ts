import { NextResponse } from "next/server";
import { ocrUpload } from "../../scan/actions";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await ocrUpload(formData);
  return NextResponse.json(result);
}
