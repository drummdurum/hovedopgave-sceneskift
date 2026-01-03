/*
  Warnings:

  - You are about to drop the column `produkt_id` on the `Forestillingsperioder` table. All the data in the column will be lost.
  - You are about to drop the column `kategori` on the `Produkter` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Forestillingsperioder" DROP CONSTRAINT "Forestillingsperioder_produkt_id_fkey";

-- AlterTable
ALTER TABLE "Brugere" ADD COLUMN     "godkendt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rolle" TEXT NOT NULL DEFAULT 'bruger';

-- AlterTable
ALTER TABLE "Forestillingsperioder" DROP COLUMN "produkt_id";

-- AlterTable
ALTER TABLE "Produkter" DROP COLUMN "kategori",
ADD COLUMN     "renoveres" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Reservationer" ADD COLUMN     "er_hentet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "er_tilbageleveret" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "Kategorier" (
    "id" SERIAL NOT NULL,
    "navn" TEXT NOT NULL,

    CONSTRAINT "Kategorier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduktKategorier" (
    "produkt_id" INTEGER NOT NULL,
    "kategori_id" INTEGER NOT NULL,

    CONSTRAINT "ProduktKategorier_pkey" PRIMARY KEY ("produkt_id","kategori_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kategorier_navn_key" ON "Kategorier"("navn");

-- AddForeignKey
ALTER TABLE "ProduktKategorier" ADD CONSTRAINT "ProduktKategorier_produkt_id_fkey" FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduktKategorier" ADD CONSTRAINT "ProduktKategorier_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "Kategorier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
