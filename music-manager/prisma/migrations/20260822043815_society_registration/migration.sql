-- AlterTable
ALTER TABLE "BrandKit" ADD COLUMN     "societyStatus" TEXT NOT NULL DEFAULT 'sin_responder';

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "registeredAt" TIMESTAMP(3);
