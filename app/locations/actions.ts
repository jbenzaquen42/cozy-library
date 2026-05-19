"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBookshelf,
  createLevel,
  createRoom,
  deleteBookshelf,
  deleteLevel,
  deleteRoom,
  reorderBookshelf,
  reorderLevel,
  reorderRoom,
  updateBookshelf,
  updateLevel,
  updateRoom,
} from "@/lib/db/locations";
import { AppError } from "@/lib/errors";
import {
  bookshelfInputSchema,
  levelInputSchema,
  roomInputSchema,
  updateBookshelfInputSchema,
  updateLevelInputSchema,
  updateRoomInputSchema,
  type ReorderInput,
} from "@/lib/validation/location";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function int(formData: FormData, key: string) {
  return Number.parseInt(text(formData, key), 10);
}

function finish(error?: unknown): never {
  if (error) {
    const message = error instanceof AppError || error instanceof Error ? error.message : "Location update failed";
    redirect(`/locations?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/locations");
  redirect("/locations?saved=1");
}

export async function createLevelAction(formData: FormData) {
  try {
    await createLevel(levelInputSchema.parse({ name: text(formData, "name"), sceneKey: text(formData, "sceneKey"), sortOrder: int(formData, "sortOrder") }));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function updateLevelAction(formData: FormData) {
  try {
    await updateLevel(updateLevelInputSchema.parse({ id: text(formData, "id"), name: text(formData, "name"), sceneKey: text(formData, "sceneKey"), sortOrder: int(formData, "sortOrder") }));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function deleteLevelAction(formData: FormData) {
  try {
    await deleteLevel(text(formData, "id"));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function createRoomAction(formData: FormData) {
  try {
    await createRoom(roomInputSchema.parse({ levelId: text(formData, "levelId"), name: text(formData, "name"), sceneKey: text(formData, "sceneKey"), sortOrder: int(formData, "sortOrder") }));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function updateRoomAction(formData: FormData) {
  try {
    await updateRoom(updateRoomInputSchema.parse({ id: text(formData, "id"), levelId: text(formData, "levelId"), name: text(formData, "name"), sceneKey: text(formData, "sceneKey"), sortOrder: int(formData, "sortOrder") }));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function deleteRoomAction(formData: FormData) {
  try {
    await deleteRoom(text(formData, "id"));
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function createBookshelfAction(formData: FormData) {
  try {
    await createBookshelf(
      bookshelfInputSchema.parse({
        roomId: text(formData, "roomId"),
        name: text(formData, "name"),
        sceneKey: text(formData, "sceneKey"),
        rowCount: int(formData, "rowCount"),
        depthCount: int(formData, "depthCount"),
        sortOrder: int(formData, "sortOrder"),
        widthUnits: int(formData, "widthUnits"),
        notes: text(formData, "notes") || undefined,
      }),
    );
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function updateBookshelfAction(formData: FormData) {
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
        notes: text(formData, "notes") || undefined,
      }),
    );
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function deleteBookshelfAction(formData: FormData) {
  try {
    await deleteBookshelf(text(formData, "id"));
  } catch (error) {
    finish(error);
  }
  finish();
}

async function reorder(action: (input: ReorderInput) => Promise<unknown>, formData: FormData) {
  try {
    await action({ id: text(formData, "id"), direction: text(formData, "direction") as ReorderInput["direction"] });
  } catch (error) {
    finish(error);
  }
  finish();
}

export async function reorderLevelAction(formData: FormData) {
  await reorder(reorderLevel, formData);
}

export async function reorderRoomAction(formData: FormData) {
  await reorder(reorderRoom, formData);
}

export async function reorderBookshelfAction(formData: FormData) {
  await reorder(reorderBookshelf, formData);
}
