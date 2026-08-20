-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#9333ea',
    "secondaryColor" TEXT NOT NULL DEFAULT '#e0299e',
    "fontFamily" TEXT NOT NULL DEFAULT 'Anton',
    "subtitleStyle" TEXT NOT NULL DEFAULT 'barra',
    "subtitlePosPct" INTEGER NOT NULL DEFAULT 78,
    "subtitleScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultVideoStyle" TEXT NOT NULL DEFAULT 'neon',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_userId_key" ON "BrandKit"("userId");

-- AddForeignKey
ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
