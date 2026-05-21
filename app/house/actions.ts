"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { updateBookshelf } from "@/lib/db/locations";
import { AppError } from "@/lib/errors";
import { updateBookshelfInputSchema } from "@/lib/validation/location";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function int(formData: FormData, key: string) {
  return Number.parseInt(text(formData, key), 10);
}

function optionalFloat(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalColor(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || undefined;
}

function errorMessage(error: unknown) {
  return error instanceof AppError || error instanceof Error ? error.message : "Update failed";
}

export async function updateViewerBookshelfAction(formData: FormData) {
  try {
    await updateBookshelf(
      updateBookshelfInputSchema.parse({
        id: text(formData, "id"),
        roomId: text(formData, "roomId"),
        name: text(formData, "name"),
        sceneKey: text(formData, "sceneKey"),
        rowCount: int(formData, "rowCount"),
        depthCount: int(formData, "depthCount"),
        sortOrder: int(formData, "sortOrder"),
        widthUnits: int(formData, "widthUnits"),
        widthMeters: optionalFloat(formData, "widthMeters"),
        heightMeters: optionalFloat(formData, "heightMeters"),
        frameColor: optionalColor(formData, "frameColor"),
        shelfColor: optionalColor(formData, "shelfColor"),
        trimColor: optionalColor(formData, "trimColor"),
        notes: text(formData, "notes") || undefined,
      }),
    );
    revalidatePath("/");
    revalidatePath("/house/3d");
    revalidatePath("/locations");
    return { ok: true, message: "Shelf saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function updateBookSpineColorAction(copyId: string, spineColor: string) {
  try {
    if (!/^#[0-9a-fA-F]{6}$/.test(spineColor)) throw new AppError("BAD_REQUEST", "Choose a valid book color.", "spineColor");
    const copy = await prisma.copy.findUnique({ where: { id: copyId }, select: { bookId: true } });
    if (!copy) throw new AppError("NOT_FOUND", "Copy not found");
    await prisma.$transaction([
      prisma.book.update({ where: { id: copy.bookId }, data: { spineColor } }),
      prisma.copy.update({ where: { id: copyId }, data: { spineColor } }),
    ]);
    revalidatePath("/");
    revalidatePath("/house/3d");
    revalidatePath(`/books/${copy.bookId}`);
    return { ok: true, message: "Book color saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function moveCopyInHouseAction(copyId: string, targetSlotId: string | null, targetPosition?: number | null) {
  try {
    await prisma.$transaction(async (tx) => {
      const copy = await tx.copy.findUnique({ where: { id: copyId }, select: { id: true, locationSlotId: true } });
      if (!copy) throw new AppError("NOT_FOUND", "Copy not found");

      if (!targetSlotId) {
        await tx.copy.update({ where: { id: copy.id }, data: { locationSlotId: null, shelfPosition: null } });
        return;
      }

      const targetSlot = await tx.shelfSlot.findUnique({ where: { id: targetSlotId }, select: { id: true } });
      if (!targetSlot) throw new AppError("NOT_FOUND", "Shelf spot not found");

      const shelfPosition = typeof targetPosition === "number" && Number.isInteger(targetPosition) && targetPosition > 0 ? targetPosition : null;

      if (shelfPosition !== null) {
        await tx.copy.updateMany({ where: { locationSlotId: targetSlotId, shelfPosition, NOT: { id: copy.id } }, data: { locationSlotId: null, shelfPosition: null } });
      }

      await tx.copy.update({ where: { id: copy.id }, data: { locationSlotId: targetSlotId, shelfPosition } });
    });

    revalidatePath("/");
    revalidatePath("/house/3d");
    revalidatePath("/catalog");
    return { ok: true, message: targetSlotId ? "Book moved. Any displaced book is in the unplaced queue." : "Book moved to the unplaced queue." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
