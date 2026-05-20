import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LivingRoomBookshelfBrowser } from "@/components/house/LivingRoomBookshelfBrowser";
import { getHouseBrowserData } from "@/lib/db/houseBrowser";

export const dynamic = "force-dynamic";

export default async function House3DPage() {
  const levels = await getHouseBrowserData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader label="Browse" title="Living room shelf view" />
      <Card variant="blue" title="Straight-on bookshelf browser">
        <p className="text-muted-text">
          The coffee table has been removed from the main room composition. Use the arrows or the right-side overlay to bring each real bookshelf into the active position.
        </p>
      </Card>
      <LivingRoomBookshelfBrowser levels={levels} />
    </div>
  );
}
