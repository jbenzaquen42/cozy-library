import { searchInputSchema } from "../../validation/search";
import { searchCatalog } from "../../search/catalog";
import { publicProcedure, router } from "../trpc";

export const searchRouter = router({
  catalog: publicProcedure.input(searchInputSchema).query(async ({ input }) => searchCatalog(input)),
});
