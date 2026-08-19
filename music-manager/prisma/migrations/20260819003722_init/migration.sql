-- CreateEnum
CREATE TYPE "SongStage" AS ENUM ('IDEA', 'PREPRODUCCION', 'ESCRITURA', 'GRABACION', 'MEZCLA', 'MASTER', 'PORTADA', 'DISTRIBUCION', 'LANZADA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'HECHO');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "stage" "SongStage" NOT NULL DEFAULT 'IDEA',
    "needsCover" BOOLEAN NOT NULL DEFAULT true,
    "coverUrl" TEXT,
    "bpm" INTEGER,
    "key" TEXT,
    "notes" TEXT,
    "releaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongFeaturing" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "contactId" TEXT,
    "artistName" TEXT NOT NULL,
    "role" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongFeaturing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongProducer" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongProducer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoIdea" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceUrl" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreProductionTask" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
    "dueDate" TIMESTAMP(3),
    "assignee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreProductionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionStep" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingBudgetItem" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingIdea" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "channel" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Royalty" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "contactId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Royalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoyaltyPayment" (
    "id" TEXT NOT NULL,
    "royaltyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "RoyaltyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "songId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "contactId" TEXT,
    "email" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDIENTE',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInvite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SongFeaturing" ADD CONSTRAINT "SongFeaturing_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongFeaturing" ADD CONSTRAINT "SongFeaturing_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongProducer" ADD CONSTRAINT "SongProducer_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongProducer" ADD CONSTRAINT "SongProducer_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoIdea" ADD CONSTRAINT "VideoIdea_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreProductionTask" ADD CONSTRAINT "PreProductionTask_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionStep" ADD CONSTRAINT "DistributionStep_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingBudgetItem" ADD CONSTRAINT "MarketingBudgetItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingIdea" ADD CONSTRAINT "MarketingIdea_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Royalty" ADD CONSTRAINT "Royalty_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Royalty" ADD CONSTRAINT "Royalty_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltyPayment" ADD CONSTRAINT "RoyaltyPayment_royaltyId_fkey" FOREIGN KEY ("royaltyId") REFERENCES "Royalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
