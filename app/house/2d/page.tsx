import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { House2DBrowser } from "@/components/house/House2DBrowser";
import { getHouseBrowserData } from "@/lib/db/houseBrowser";

export const dynamic = "force-dynamic";

export default async function House2DPage() {
  const levels = await getHouseBrowserData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader label="Browse" title="2D Floor Plan" />
      <Card variant="cream" title="Visual shelf browser">
        <p className="text-muted-text">
          Use the 2D map as the reliable fallback for browsing shelves by scene key. Selection, including front/back depth, is reflected in the URL.
        </p>
      </Card>
      <House2DBrowser levels={levels} />
    </div>
  );
}
