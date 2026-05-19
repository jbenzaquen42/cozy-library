import { getSettingsStatus } from "../../db/settings";
import { publicProcedure, router, toTRPCError } from "../trpc";

export const settingsRouter = router({
  status: publicProcedure.query(async () => {
    try {
      return await getSettingsStatus();
    } catch (error) {
      throw toTRPCError(error);
    }
  }),
});
