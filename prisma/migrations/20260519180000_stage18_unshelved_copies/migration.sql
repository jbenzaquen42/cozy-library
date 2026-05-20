ALTER TABLE "Copy" DROP CONSTRAINT IF EXISTS "Copy_locationSlotId_fkey";

ALTER TABLE "Copy" ALTER COLUMN "locationSlotId" DROP NOT NULL;

ALTER TABLE "Copy"
  ADD CONSTRAINT "Copy_locationSlotId_fkey"
  FOREIGN KEY ("locationSlotId") REFERENCES "ShelfSlot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
