-- AlterTable: Tilføj placering felt til Produkter
ALTER TABLE "Produkter" ADD COLUMN "paa_sceneskift" BOOLEAN NOT NULL DEFAULT false;
