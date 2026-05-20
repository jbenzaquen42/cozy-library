import { describe, expect, it } from "vitest";
import { bookInputSchema } from "../../lib/validation/book";

describe("book validation", () => {
  describe("ISBN normalization", () => {
    it("strips hyphens and spaces from ISBN-10", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        isbn10: "0-547-92822-X",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn10).toBe("054792822X");
      }
    });

    it("strips hyphens and spaces from ISBN-13", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        isbn13: "978-0-547-92822-7",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn13).toBe("9780547928227");
      }
    });

    it("returns undefined for empty ISBN strings", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        isbn10: "",
        isbn13: "  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn10).toBeUndefined();
        expect(result.data.isbn13).toBeUndefined();
      }
    });

    it("returns undefined when ISBN is not provided", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isbn10).toBeUndefined();
        expect(result.data.isbn13).toBeUndefined();
      }
    });
  });

  describe("pageCount validation", () => {
    it("accepts a valid positive integer", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        pageCount: 350,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageCount).toBe(350);
      }
    });

    it("rejects a negative page count with a clear message", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        pageCount: -5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pageCountIssue = result.error.issues.find((issue) => issue.path.includes("pageCount"));
        expect(pageCountIssue).toBeDefined();
        expect(pageCountIssue!.message).toContain("positive");
      }
    });

    it("rejects a non-integer page count", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        pageCount: 3.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pageCountIssue = result.error.issues.find((issue) => issue.path.includes("pageCount"));
        expect(pageCountIssue).toBeDefined();
      }
    });

    it("converts empty string to undefined", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        pageCount: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageCount).toBeUndefined();
      }
    });

    it("coerces string numbers to integers", () => {
      const result = bookInputSchema.safeParse({
        title: "Test",
        displayAuthor: "Author",
        pageCount: "200",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageCount).toBe(200);
      }
    });
  });
});