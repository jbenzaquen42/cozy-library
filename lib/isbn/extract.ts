export function extractIsbnCandidates(text: string): string[] {
  const seen = new Set<string>();
  const candidates: string[] = [];
  const combined = text.replace(/[^0-9Xx]/g, "");

  // Check if the whole string after cleaning is an ISBN
  if (combined.length === 10 || combined.length === 13) {
    seen.add(combined);
    candidates.push(combined);
  }

  // Scan for digit groups that could form an ISBN
  const digitGroups = text.match(/\b[0-9Xx][0-9Xx\- ]{8,16}[0-9Xx]\b/g) ?? [];
  for (const group of digitGroups) {
    const cleaned = group.replace(/[^0-9Xx]/g, "").toUpperCase();
    if ((cleaned.length === 10 || cleaned.length === 13) && !seen.has(cleaned)) {
      seen.add(cleaned);
      candidates.push(cleaned);
    }
  }

  // Also scan ISBN-prefixed patterns like "ISBN 978-..." or "ISBN-13: ..."
  const isbnPatterns = text.match(/ISBN[:\-\s]*[0-9][0-9\-\s]{9,16}[0-9]/gi) ?? [];
  for (const pattern of isbnPatterns) {
    const cleaned = pattern.replace(/[^0-9Xx]/g, "").toUpperCase();
    if ((cleaned.length === 10 || cleaned.length === 13) && !seen.has(cleaned)) {
      seen.add(cleaned);
      candidates.push(cleaned);
    }
  }

  return candidates;
}

export function isbnCandidateSummary(candidates: string[]) {
  return candidates.length > 0 ? `Found ISBN candidate${candidates.length === 1 ? "" : "s"}: ${candidates.join(", ")}` : "No ISBN candidates found in OCR text.";
}
