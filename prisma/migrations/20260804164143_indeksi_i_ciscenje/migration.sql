-- DropIndex
DROP INDEX "DailyLog_vehicleId_idx";

-- DropIndex
DROP INDEX "FuelEntry_vehicleId_idx";

-- DropIndex
DROP INDEX "TireChange_vehicleId_idx";

-- DropIndex
DROP INDEX "Vehicle_companyId_idx";

-- CreateIndex
CREATE INDEX "DailyLog_vehicleId_datum_idx" ON "DailyLog"("vehicleId", "datum");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_kmStanje_idx" ON "FuelEntry"("vehicleId", "kmStanje");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE INDEX "TireChange_vehicleId_datum_idx" ON "TireChange"("vehicleId", "datum");

-- CreateIndex
CREATE INDEX "Vehicle_companyId_aktivno_idx" ON "Vehicle"("companyId", "aktivno");
