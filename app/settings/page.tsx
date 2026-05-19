import { getSettingsStatus } from "@/lib/db/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settingsPromise = getSettingsStatus();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader label="Settings" title="Application status" />
      <SettingsStatus settingsPromise={settingsPromise} />
    </div>
  );
}

async function SettingsStatus({
  settingsPromise,
}: {
  settingsPromise: ReturnType<typeof getSettingsStatus>;
}) {
  const settings = await settingsPromise;

  return (
    <div className="space-y-4">
      <Card variant="white" title="Database status">
        <p className="text-muted-text">
          {settings.database.connected ? "Connected" : "Not connected"}:{" "}
          {settings.database.message}
        </p>
      </Card>
      <Card variant="blue" title="App data directory">
        <p className="text-muted-text">{settings.paths.dataDir}</p>
      </Card>
      <Card variant="pink" title="Provider placeholders">
        <p className="text-muted-text">
          Google Books key:{" "}
          {settings.providers.googleBooksConfigured
            ? "configured"
            : "not configured"}
          . ISBNdb key:{" "}
          {settings.providers.isbnDbConfigured
            ? "configured"
            : "not configured"}
          . Hardcover token: {settings.providers.hardcoverConfigured ? "configured" : "not configured"}
          .
        </p>
      </Card>
    </div>
  );
}
