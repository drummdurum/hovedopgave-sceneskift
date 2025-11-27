-- AlterTable: Tilføj godkendt og rolle kolonner til Brugere
ALTER TABLE "Brugere" ADD COLUMN IF NOT EXISTS "godkendt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Brugere" ADD COLUMN IF NOT EXISTS "rolle" TEXT NOT NULL DEFAULT 'bruger';
