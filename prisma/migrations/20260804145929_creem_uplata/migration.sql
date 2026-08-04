/*
  Warnings:

  - You are about to drop the `LemonSqueezyUplata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "LemonSqueezyUplata";

-- CreateTable
CREATE TABLE "CreemUplata" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreemUplata_pkey" PRIMARY KEY ("id")
);
