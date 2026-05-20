"use server";

import { lookupMetadata } from "@/lib/db/metadata";

export async function lookupMetadataAction(isbn: string) {
  return lookupMetadata({ isbn });
}