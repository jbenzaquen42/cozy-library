import { NextRequest, NextResponse } from "next/server";
import { buildBackupV1 } from "@/lib/files/exportBuilder";

export async function GET(request: NextRequest) {
  try {
    const includeMetadata = request.nextUrl.searchParams.get("includeMetadata") !== "false";
    const backup = await buildBackupV1({ includeMetadata });

    const json = JSON.stringify(backup, null, 2);
    const filename = `cozy-library-backup-v1${includeMetadata ? "" : "-no-metadata"}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 },
    );
  }
}
