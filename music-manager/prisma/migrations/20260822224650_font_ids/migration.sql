-- AlterTable
ALTER TABLE "BrandKit" ALTER COLUMN "fontFamily" SET DEFAULT 'montserrat';
-- Los kits antiguos guardaban el nombre visible ("Anton"), no un identificador.
UPDATE "BrandKit" SET "fontFamily" = lower("fontFamily")
  WHERE "fontFamily" IN ('Anton','Geist','Georgia');
UPDATE "BrandKit" SET "fontFamily" = 'montserrat' WHERE "fontFamily" = 'Impact';
