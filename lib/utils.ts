export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

/** Deterministic date formatting that avoids server-client locale mismatch. */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
