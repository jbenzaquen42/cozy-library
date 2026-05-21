"use client";

import { useState } from "react";

export const COZY_SETTINGS_KEY = "cozy-library.viewer-settings";

export type CozyViewerSettingsValue = {
  soundOn: boolean;
  ambientOn: boolean;
  volume: number;
};

export const DEFAULT_COZY_SETTINGS: CozyViewerSettingsValue = {
  soundOn: false,
  ambientOn: false,
  volume: 0.45,
};

export function useCozyViewerSettings() {
  const [settings, setSettingsState] = useState<CozyViewerSettingsValue>(() => {
    if (typeof window === "undefined") return DEFAULT_COZY_SETTINGS;
    const rawSettings = window.localStorage.getItem(COZY_SETTINGS_KEY);
    if (!rawSettings) return DEFAULT_COZY_SETTINGS;

    try {
      const parsed = JSON.parse(rawSettings) as Partial<CozyViewerSettingsValue>;
      return {
        soundOn: Boolean(parsed.soundOn),
        ambientOn: Boolean(parsed.ambientOn),
        volume: clampVolume(parsed.volume),
      };
    } catch {
      window.localStorage.removeItem(COZY_SETTINGS_KEY);
      return DEFAULT_COZY_SETTINGS;
    }
  });

  function setSettings(next: CozyViewerSettingsValue) {
    const normalized = { ...next, volume: clampVolume(next.volume) };
    setSettingsState(normalized);
    if (typeof window !== "undefined") window.localStorage.setItem(COZY_SETTINGS_KEY, JSON.stringify(normalized));
  }

  function resetSettings() {
    setSettingsState(DEFAULT_COZY_SETTINGS);
    if (typeof window !== "undefined") window.localStorage.removeItem(COZY_SETTINGS_KEY);
  }

  return { settings, setSettings, resetSettings };
}

export function CozyViewerSettingsControls({
  settings,
  onChange,
  onReset,
  compact = false,
}: {
  settings: CozyViewerSettingsValue;
  onChange: (settings: CozyViewerSettingsValue) => void;
  onReset?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-3xl border border-warm-border bg-white/75 p-4 text-sm shadow-inner ${compact ? "mt-4" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-text">Cozy settings</p>
          <h3 className="font-heading text-2xl leading-none text-deep-brown">Cottage ambience</h3>
          <p className="mt-1 text-xs font-semibold text-muted-text">Saved on this device for quiet shelf browsing.</p>
        </div>
        <span className="rounded-full bg-light-pink/35 px-3 py-1 text-xs font-black text-deep-brown">local preference</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-warm-border bg-cream px-3 py-2 font-bold text-deep-brown">
          Soft shelf sounds
          <input type="checkbox" checked={settings.soundOn} onChange={(event) => onChange({ ...settings, soundOn: event.target.checked })} className="h-5 w-5 accent-sage" />
        </label>
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-warm-border bg-cream px-3 py-2 font-bold text-deep-brown">
          Fireplace room tone
          <input type="checkbox" checked={settings.ambientOn} onChange={(event) => onChange({ ...settings, ambientOn: event.target.checked })} className="h-5 w-5 accent-sage" />
        </label>
        <label className="grid gap-2 rounded-2xl border border-warm-border bg-cream px-3 py-2 font-bold text-deep-brown sm:col-span-2">
          Volume <span className="text-xs font-semibold text-muted-text">{Math.round(settings.volume * 100)}%</span>
          <input type="range" min="0.05" max="1" step="0.05" value={settings.volume} onChange={(event) => onChange({ ...settings, volume: Number.parseFloat(event.target.value) })} className="accent-sage" />
        </label>
      </div>
      {onReset ? (
        <button type="button" onClick={onReset} className="mt-3 min-h-11 rounded-full border border-warm-border bg-white px-4 py-2 text-xs font-black text-deep-brown shadow-sm transition hover:-translate-y-0.5 hover:bg-cream focus:outline-none focus:ring-4 focus:ring-sage/25">
          Reset shelf preferences
        </button>
      ) : null}
    </div>
  );
}

function clampVolume(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0.05, value)) : DEFAULT_COZY_SETTINGS.volume;
}
