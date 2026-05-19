import { describe, expect, it } from "vitest";
import { extractIsbnCandidates } from "../../lib/isbn/extract";

describe("OCR ISBN extraction", () => {
  it("extracts ISBN-13 from OCR text", () => {
    expect(extractIsbnCandidates("ISBN 978-0-123-45678-9 is the book")).toContain("9780123456789");
  });

  it("extracts ISBN-10 from OCR text", () => {
    expect(extractIsbnCandidates("The code 0-123-45678-9 appears")).toContain("0123456789");
  });

  it("extracts multiple candidates without duplicates", () => {
    const result = extractIsbnCandidates("ISBN 978-0-123-45678-9 and also 0-123-45678-9 and again 978-0-123-45678-9");
    expect(result).toHaveLength(2);
    expect(result).toContain("9780123456789");
    expect(result).toContain("0123456789");
  });

  it("returns empty array when no ISBN pattern is found", () => {
    expect(extractIsbnCandidates("Just some random book title by Some Author.")).toHaveLength(0);
  });

  it("handles OCR noise around candidate numbers", () => {
    expect(extractIsbnCandidates("~~!! 9780143127741...? lorem ipsum")).toContain("9780143127741");
  });
});
