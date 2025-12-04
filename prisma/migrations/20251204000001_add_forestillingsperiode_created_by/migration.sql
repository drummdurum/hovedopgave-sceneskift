-- AlterTable: Add created_by to Forestillingsperioder
ALTER TABLE "Forestillingsperioder" ADD COLUMN "created_by" INTEGER;

-- AddForeignKey
ALTER TABLE "Forestillingsperioder" ADD CONSTRAINT "Forestillingsperioder_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Brugere"("id") ON DELETE SET NULL ON UPDATE CASCADE;
