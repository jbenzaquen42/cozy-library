import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { importExportStatus } from "@/lib/files/importExport";

export default function ImportExportPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader label="Tools" title="Import / Export" />
      <Card variant="cream" title="Deferred backup workflow">
        <div className="space-y-3 text-muted-text">
          <p>{importExportStatus.summary}</p>
          <p>{importExportStatus.recoveryGuidance}</p>
          <p>
            The catalog remains safe to manage manually, but CSV/JSON import previews and restore tools are not ready yet.
          </p>
        </div>
      </Card>
    </div>
  );
}
