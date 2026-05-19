import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export default function ImportExportPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader label="Tools" title="Import / Export" />
      <Card variant="cream" title="Coming soon">
        <p className="text-muted-text">
          CSV import and export will be available in a later stage.
        </p>
      </Card>
    </div>
  );
}
