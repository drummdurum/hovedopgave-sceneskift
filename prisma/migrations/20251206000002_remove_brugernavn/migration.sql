-- AlterTable - Fjern brugernavn kolonne fra Brugere
ALTER TABLE "Brugere" DROP COLUMN IF EXISTS "brugernavn";
