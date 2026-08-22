-- CreateEnum
CREATE TYPE "SplitKind" AS ENUM ('OBRA', 'MASTER');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "address" TEXT,
ADD COLUMN     "ipi" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "society" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "Royalty" ADD COLUMN     "kind" "SplitKind" NOT NULL DEFAULT 'OBRA';

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "agreementDate" TIMESTAMP(3),
ADD COLUMN     "agreementPlace" TEXT,
ADD COLUMN     "isrc" TEXT;
