-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "lastReminderThreshold" INTEGER;

-- CreateTable
CREATE TABLE "SongReference" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongReference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SongReference" ADD CONSTRAINT "SongReference_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
