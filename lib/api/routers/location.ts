import {
  bookshelfInputSchema,
  idInputSchema,
  levelInputSchema,
  listLocationsInputSchema,
  reorderInputSchema,
  roomInputSchema,
  updateBookshelfInputSchema,
  updateLevelInputSchema,
  updateRoomInputSchema,
} from "../../validation/location";
import {
  createBookshelf,
  createLevel,
  createRoom,
  deleteBookshelf,
  deleteLevel,
  deleteRoom,
  getLocationSummary,
  listLocations,
  reorderBookshelf,
  reorderLevel,
  reorderRoom,
  updateBookshelf,
  updateLevel,
  updateRoom,
} from "../../db/locations";
import { publicProcedure, router, toTRPCError } from "../trpc";

export const locationRouter = router({
  list: publicProcedure.input(listLocationsInputSchema).query(async ({ input }) => {
    try {
      return await listLocations(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  summary: publicProcedure.query(async () => {
    try {
      return await getLocationSummary();
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  createLevel: publicProcedure.input(levelInputSchema).mutation(async ({ input }) => {
    try {
      return await createLevel(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  updateLevel: publicProcedure.input(updateLevelInputSchema).mutation(async ({ input }) => {
    try {
      return await updateLevel(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  deleteLevel: publicProcedure.input(idInputSchema).mutation(async ({ input }) => {
    try {
      return await deleteLevel(input.id);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  reorderLevel: publicProcedure.input(reorderInputSchema).mutation(async ({ input }) => {
    try {
      return await reorderLevel(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  createRoom: publicProcedure.input(roomInputSchema).mutation(async ({ input }) => {
    try {
      return await createRoom(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  updateRoom: publicProcedure.input(updateRoomInputSchema).mutation(async ({ input }) => {
    try {
      return await updateRoom(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  deleteRoom: publicProcedure.input(idInputSchema).mutation(async ({ input }) => {
    try {
      return await deleteRoom(input.id);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  reorderRoom: publicProcedure.input(reorderInputSchema).mutation(async ({ input }) => {
    try {
      return await reorderRoom(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  createBookshelf: publicProcedure.input(bookshelfInputSchema).mutation(async ({ input }) => {
    try {
      return await createBookshelf(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  updateBookshelf: publicProcedure.input(updateBookshelfInputSchema).mutation(async ({ input }) => {
    try {
      return await updateBookshelf(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  deleteBookshelf: publicProcedure.input(idInputSchema).mutation(async ({ input }) => {
    try {
      return await deleteBookshelf(input.id);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
  reorderBookshelf: publicProcedure.input(reorderInputSchema).mutation(async ({ input }) => {
    try {
      return await reorderBookshelf(input);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
