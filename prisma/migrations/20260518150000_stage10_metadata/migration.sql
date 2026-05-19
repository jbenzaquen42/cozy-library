-- CreateEnum
CREATE TYPE "UploadedImageKind" AS ENUM ('COVER_PHOTO', 'SPINE_PHOTO', 'CACHED_COVER');

-- CreateTable
CREATE TABLE "MetadataCache" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "lookupKey" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MetadataCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "kind" "UploadedImageKind" NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "bookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetadataCache_provider_lookupKey_key" ON "MetadataCache"("provider", "lookupKey");
CREATE INDEX "MetadataCache_provider_idx" ON "MetadataCache"("provider");
CREATE INDEX "MetadataCache_lookupKey_idx" ON "MetadataCache"("lookupKey");
CREATE INDEX "UploadedImage_bookId_idx" ON "UploadedImage"("bookId");
CREATE INDEX "UploadedImage_kind_idx" ON "UploadedImage"("kind");

-- AddForeignKey
ALTER TABLE "UploadedImage" ADD CONSTRAINT "UploadedImage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
