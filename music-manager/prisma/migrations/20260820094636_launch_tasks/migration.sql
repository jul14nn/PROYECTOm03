-- CreateTable
CREATE TABLE "LaunchTask" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "phase" TEXT NOT NULL,
    "channel" TEXT,
    "dayOffset" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaunchTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LaunchTask_songId_idx" ON "LaunchTask"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchTask_songId_stepKey_key" ON "LaunchTask"("songId", "stepKey");

-- AddForeignKey
ALTER TABLE "LaunchTask" ADD CONSTRAINT "LaunchTask_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
