-- DropForeignKey
ALTER TABLE "ForestillingsperiodeProdukter" DROP CONSTRAINT IF EXISTS "ForestillingsperiodeProdukter_forestillingsperiode_id_fkey";

-- DropForeignKey
ALTER TABLE "ForestillingsperiodeProdukter" DROP CONSTRAINT IF EXISTS "ForestillingsperiodeProdukter_produkt_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "ForestillingsperiodeProdukter";
