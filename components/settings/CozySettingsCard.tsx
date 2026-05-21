"use client";

import { CozyViewerSettingsControls, useCozyViewerSettings } from "@/components/house/cozyViewerSettings";

export function CozySettingsCard() {
  const { settings, setSettings, resetSettings } = useCozyViewerSettings();

  return (
    <section className="rounded-3xl border border-warm-border bg-cream p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-muted-text">Reading nook preferences</p>
        <h2 className="mt-1 font-heading text-3xl leading-none text-deep-brown">Shelf sounds and ambience</h2>
        <p className="mt-2 text-sm text-muted-text">
          These are saved in this browser only. They do not change your books, shelves, provider keys, or database settings.
        </p>
      </div>
      <CozyViewerSettingsControls settings={settings} onChange={setSettings} onReset={resetSettings} />
    </section>
  );
}
