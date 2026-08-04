-- CreateTable
CREATE TABLE "LemonSqueezyUplata" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LemonSqueezyUplata_pkey" PRIMARY KEY ("id")
);
