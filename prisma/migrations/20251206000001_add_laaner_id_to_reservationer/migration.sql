-- AlterTable - Tilføj laaner_id kolonne til Reservationer
ALTER TABLE "Reservationer" ADD COLUMN "laaner_id" INTEGER;

-- Opdater eksisterende reservationer til at have laaner_id baseret på teaternavn match
-- (Dette er en best-effort opdatering - manuelt tjek kan være nødvendigt)
UPDATE "Reservationer" r
SET "laaner_id" = (
  SELECT b.id FROM "Brugere" b 
  WHERE b.teaternavn = r.teaternavn 
  LIMIT 1
)
WHERE "laaner_id" IS NULL;

-- Sæt default værdi for eventuelle reservationer uden match (brug admin bruger id 1)
UPDATE "Reservationer" 
SET "laaner_id" = 1 
WHERE "laaner_id" IS NULL;

-- Gør kolonnen NOT NULL efter opdatering
ALTER TABLE "Reservationer" ALTER COLUMN "laaner_id" SET NOT NULL;

-- Tilføj foreign key constraint
ALTER TABLE "Reservationer" ADD CONSTRAINT "Reservationer_laaner_id_fkey" FOREIGN KEY ("laaner_id") REFERENCES "Brugere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
