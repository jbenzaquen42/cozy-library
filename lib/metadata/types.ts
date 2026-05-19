export type MetadataProvider = "openlibrary" | "googlebooks" | "isbndb" | "hardcover";

export type MetadataLookupInput = {
  isbn?: string;
  title?: string;
  author?: string;
};

export type MetadataLookupResult = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  language?: string;
  description?: string;
  categories?: string[];
  seriesName?: string;
  seriesNumber?: string;
  isbn10?: string;
  isbn13?: string;
  coverUrl?: string;
  provider: MetadataProvider;
  raw: unknown;
};
