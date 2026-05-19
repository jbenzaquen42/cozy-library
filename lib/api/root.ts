import { router } from "./trpc";
import { bookRouter } from "./routers/book";
import { copyRouter } from "./routers/copy";
import { importExportRouter } from "./routers/importExport";
import { loanRouter } from "./routers/loan";
import { locationRouter } from "./routers/location";
import { metadataRouter } from "./routers/metadata";
import { searchRouter } from "./routers/search";
import { settingsRouter } from "./routers/settings";

export const appRouter = router({
  location: locationRouter,
  book: bookRouter,
  copy: copyRouter,
  loan: loanRouter,
  metadata: metadataRouter,
  search: searchRouter,
  importExport: importExportRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
