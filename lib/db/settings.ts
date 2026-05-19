import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import { existsSync } from "node:fs";

function hardcoverConfigured() {
  if (process.env.HARDCOVER_API_TOKEN) return true;
  return Boolean(process.env.HARDCOVER_API_TOKEN_FILE && existsSync(process.env.HARDCOVER_API_TOKEN_FILE));
}

export async function getDatabaseStatus(db: PrismaClient = defaultPrisma) {
  try {
    await db.$queryRaw`SELECT 1`;
    return { connected: true, message: "Database connected" };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

export async function getSettingsStatus(db: PrismaClient = defaultPrisma) {
  const database = await getDatabaseStatus(db);

  return {
    app: {
      name: "Cozy Home Library",
      version: process.env.npm_package_version ?? "0.1.0",
      baseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
    },
    database,
    paths: {
      dataDir: process.env.APP_DATA_DIR ?? "/data",
      blenderModelPath: process.env.BLENDER_MODEL_PATH ?? "/models/home-library.glb",
    },
    features: {
      ocrEnabled: process.env.ENABLE_OCR !== "false",
      threeDEnabled: process.env.ENABLE_3D !== "false",
    },
    providers: {
      googleBooksConfigured: Boolean(process.env.GOOGLE_BOOKS_API_KEY),
      isbnDbConfigured: Boolean(process.env.ISBNDB_API_KEY),
      hardcoverConfigured: hardcoverConfigured(),
      contactEmailConfigured: Boolean(process.env.APP_CONTACT_EMAIL),
    },
  };
}
