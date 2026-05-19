import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { GeneratedHouseScene } from "@/components/house/GeneratedHouseScene";
import { getHouseBrowserData } from "@/lib/db/houseBrowser";

export const dynamic = "force-dynamic";

export default async function House3DPage() {
  const levels = await getHouseBrowserData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader label="Browse" title="3D House" />
      <Card variant="blue" title="Generated house browser">
        <p className="text-muted-text">
          Browse a generated low-poly house, click shelves by their database scene keys, and review the selected shelf slots. A future Blender file can replace this generated scene without changing shelf identifiers.
        </p>
      </Card>
      <GeneratedHouseScene levels={levels} />
    </div>
  );
}
