"use client";

import { useCallback, useEffect, useRef } from "react";

type CozySoundKind = "book" | "shelf" | "move" | "close";

const SOUND_FILES: Record<CozySoundKind, string> = {
  book: "/sounds/book-rustle.wav",
  shelf: "/sounds/shelf-slide.wav",
  move: "/sounds/book-settle.wav",
  close: "/sounds/book-close.wav",
};

export function useCozySounds({ soundOn, ambientOn, volume }: { soundOn: boolean; ambientOn: boolean; volume: number }) {
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  const playFallbackTone = useCallback((kind: CozySoundKind) => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = kind === "move" ? 260 : kind === "close" ? 220 : kind === "shelf" ? 190 : 420;
    oscillator.type = kind === "book" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.58), context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035 * volume, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    window.setTimeout(() => void context.close(), 320);
  }, [volume]);

  const playCozySound = useCallback((kind: CozySoundKind) => {
    if (!soundOn || typeof window === "undefined") return;
    const audio = new Audio(SOUND_FILES[kind]);
    audio.volume = Math.min(1, Math.max(0.05, volume));
    audio.play().catch(() => playFallbackTone(kind));
  }, [playFallbackTone, soundOn, volume]);

  useEffect(() => {
    if (!soundOn || !ambientOn || typeof window === "undefined") {
      ambientRef.current?.pause();
      ambientRef.current = null;
      return;
    }

    const ambient = new Audio("/sounds/hearth-hum.wav");
    ambient.loop = true;
    ambient.volume = Math.min(0.32, Math.max(0.02, volume * 0.28));
    ambientRef.current = ambient;
    ambient.play().catch(() => {
      ambientRef.current = null;
    });

    return () => {
      ambient.pause();
      ambientRef.current = null;
    };
  }, [ambientOn, soundOn, volume]);

  useEffect(() => {
    if (ambientRef.current) ambientRef.current.volume = Math.min(0.32, Math.max(0.02, volume * 0.28));
  }, [volume]);

  return playCozySound;
}
