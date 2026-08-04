-- CreateEnum
CREATE TYPE "VrstaGuma" AS ENUM ('LJETNE', 'ZIMSKE');

-- CreateTable
CREATE TABLE "TireChange" (
    "id" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vrsta" "VrstaGuma" NOT NULL,
    "kmStanje" INTEGER,
    "napomena" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "TireChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TireChange_vehicleId_idx" ON "TireChange"("vehicleId");

-- AddForeignKey
ALTER TABLE "TireChange" ADD CONSTRAINT "TireChange_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireChange" ADD CONSTRAINT "TireChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
