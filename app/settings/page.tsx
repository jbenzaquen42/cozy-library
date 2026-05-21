import { getSettingsStatus } from "@/lib/db/settings";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { CozySettingsCard } from "@/components/settings/CozySettingsCard";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settingsPromise = getSettingsStatus();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader label="Settings" title="Settings" />
      <div className="space-y-6">
        {/* Shelf display */}
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-deep-brown">
            Shelf display
          </h2>
          <CozySettingsCard />
        </section>

        {/* Import / Export */}
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-deep-brown">
            Import / Export
          </h2>
          <Card variant="cream">
            <p className="text-muted-text">
              Your library data stays on your device. Export and import backups
              from the{" "}
              <Link
                href="/import-export"
                className="font-semibold text-deep-brown underline decoration-warm-border underline-offset-2 hover:text-warm-accent"
              >
                Import / Export
              </Link>{" "}
              page.
            </p>
            <p className="mt-2 text-sm text-muted-text">
              Metadata lookups default to the first configured provider. You can
              change the priority order on the import page.
            </p>
          </Card>
        </section>

        {/* Data & Privacy */}
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-deep-brown">
            Data &amp; Privacy
          </h2>
          <Card variant="white">
            <ul className="space-y-3 text-muted-text">
              <li className="flex gap-3">
                <span className="mt-0.5 text-lg">🏠</span>
                <span>
                  Cozy Library runs entirely in your home. Book data, covers,
                  and shelf placements are stored locally on your device or
                  server.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-lg">🔍</span>
                <span>
                  Metadata lookups (book details, covers) contact external
                  services only when you explicitly search or refresh.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-lg">🔒</span>
                <span>
                  No data is sent to third-party analytics or tracking services.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        {/* System information (collapsible) */}
        <section>
          <details className="group rounded-3xl border border-warm-border bg-cream/50 shadow-lg shadow-amber-shadow/5">
            <summary className="cursor-pointer list-none p-5 font-heading text-lg font-semibold text-deep-brown transition-colors hover:bg-cream-dark/50 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between">
                System information
                <span className="text-muted-text transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="border-t border-warm-border px-5 pb-5 pt-3">
              <SystemStatus settingsPromise={settingsPromise} />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}

async function SystemStatus({
  settingsPromise,
}: {
  settingsPromise: ReturnType<typeof getSettingsStatus>;
}) {
  const settings = await settingsPromise.catch((error: unknown) => ({ error }));

  if ("error" in settings) {
    return <ErrorMessage error={settings.error instanceof Error ? settings.error : new Error("Unable to load system information.")} />;
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <span className="font-semibold text-deep-brown">Database:</span>{" "}
        <span className="text-muted-text">
          {settings.database.connected ? "Connected" : "Not connected"} —{" "}
          {settings.database.message}
        </span>
      </div>
      <div>
        <span className="font-semibold text-deep-brown">Data directory:</span>{" "}
        <span className="text-muted-text">{settings.paths.dataDir}</span>
      </div>
      <div>
        <span className="font-semibold text-deep-brown">Providers:</span>{" "}
        <span className="text-muted-text">
          Google Books{" "}
          {settings.providers.googleBooksConfigured
            ? "configured"
            : "not configured"}
          , ISBNdb{" "}
          {settings.providers.isbnDbConfigured
            ? "configured"
            : "not configured"}
          , Hardcover{" "}
          {settings.providers.hardcoverConfigured
            ? "configured"
            : "not configured"}
        </span>
      </div>
      <div className="text-muted-text">
        Demo books are managed by startup mode or the{" "}
        <code className="rounded bg-cream-dark px-1 py-0.5 text-xs">
          npm run demo:*
        </code>{" "}
        commands. This page does not change demo data directly.
      </div>
    </div>
  );
}
