-- AlterTable: Make billede_url optional
ALTER TABLE "Produkter" ALTER COLUMN "billede_url" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProduktBilleder" (
    "id" SERIAL NOT NULL,
    "produkt_id" INTEGER NOT NULL,
    "billede_url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProduktBilleder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProduktBilleder" ADD CONSTRAINT "ProduktBilleder_produkt_id_fkey" FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing images to new table
INSERT INTO "ProduktBilleder" ("produkt_id", "billede_url", "position")
SELECT "id", "billede_url", 0
FROM "Produkter"
WHERE "billede_url" IS NOT NULL AND "billede_url" != '';
