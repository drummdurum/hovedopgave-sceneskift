-- DropForeignKey (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ForestillingsperiodeProdukter') THEN
        ALTER TABLE "ForestillingsperiodeProdukter" DROP CONSTRAINT IF EXISTS "ForestillingsperiodeProdukter_forestillingsperiode_id_fkey";
        ALTER TABLE "ForestillingsperiodeProdukter" DROP CONSTRAINT IF EXISTS "ForestillingsperiodeProdukter_produkt_id_fkey";
        DROP TABLE "ForestillingsperiodeProdukter";
    END IF;
END $$;
