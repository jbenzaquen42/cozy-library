-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'LOANED');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "displayAuthor" TEXT NOT NULL,
    "isbn10" TEXT,
    "isbn13" TEXT,
    "publisher" TEXT,
    "publishedDate" TEXT,
    "pageCount" INTEGER,
    "language" TEXT,
    "description" TEXT,
    "categories" JSONB NOT NULL DEFAULT '[]',
    "seriesName" TEXT,
    "seriesNumber" TEXT,
    "coverImagePath" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "metadataSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookAuthor" (
    "bookId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "BookAuthor_pkey" PRIMARY KEY ("bookId","authorId")
);

-- CreateTable
CREATE TABLE "Copy" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "copyLabel" TEXT NOT NULL,
    "locationSlotId" TEXT NOT NULL,
    "condition" TEXT,
    "notes" TEXT,
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sceneKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HouseLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sceneKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookshelf" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sceneKey" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "depthCount" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "widthUnits" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bookshelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfSlot" (
    "id" TEXT NOT NULL,
    "bookshelfId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "depthIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShelfSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn10_key" ON "Book"("isbn10");
CREATE UNIQUE INDEX "Book_isbn13_key" ON "Book"("isbn13");
CREATE INDEX "Book_title_idx" ON "Book"("title");
CREATE INDEX "Book_displayAuthor_idx" ON "Book"("displayAuthor");
CREATE INDEX "Author_sortName_idx" ON "Author"("sortName");
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");
CREATE INDEX "BookAuthor_authorId_idx" ON "BookAuthor"("authorId");
CREATE INDEX "Copy_bookId_idx" ON "Copy"("bookId");
CREATE INDEX "Copy_locationSlotId_idx" ON "Copy"("locationSlotId");
CREATE INDEX "Copy_status_idx" ON "Copy"("status");
CREATE UNIQUE INDEX "Copy_bookId_copyLabel_key" ON "Copy"("bookId", "copyLabel");
CREATE UNIQUE INDEX "HouseLevel_sceneKey_key" ON "HouseLevel"("sceneKey");
CREATE INDEX "HouseLevel_sceneKey_idx" ON "HouseLevel"("sceneKey");
CREATE UNIQUE INDEX "Room_sceneKey_key" ON "Room"("sceneKey");
CREATE INDEX "Room_levelId_idx" ON "Room"("levelId");
CREATE INDEX "Room_sceneKey_idx" ON "Room"("sceneKey");
CREATE UNIQUE INDEX "Bookshelf_sceneKey_key" ON "Bookshelf"("sceneKey");
CREATE INDEX "Bookshelf_roomId_idx" ON "Bookshelf"("roomId");
CREATE INDEX "Bookshelf_sceneKey_idx" ON "Bookshelf"("sceneKey");
CREATE INDEX "ShelfSlot_bookshelfId_idx" ON "ShelfSlot"("bookshelfId");
CREATE UNIQUE INDEX "ShelfSlot_bookshelfId_rowIndex_depthIndex_key" ON "ShelfSlot"("bookshelfId", "rowIndex", "depthIndex");

-- AddForeignKey
ALTER TABLE "BookAuthor" ADD CONSTRAINT "BookAuthor_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookAuthor" ADD CONSTRAINT "BookAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Copy" ADD CONSTRAINT "Copy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Copy" ADD CONSTRAINT "Copy_locationSlotId_fkey" FOREIGN KEY ("locationSlotId") REFERENCES "ShelfSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "HouseLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookshelf" ADD CONSTRAINT "Bookshelf_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShelfSlot" ADD CONSTRAINT "ShelfSlot_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "Bookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
