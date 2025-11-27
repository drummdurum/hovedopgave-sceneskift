-- CreateTable
CREATE TABLE "Brugere" (
    "id" SERIAL NOT NULL,
    "brugernavn" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "teaternavn" TEXT NOT NULL,
    "lokation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "features" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Brugere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produkter" (
    "id" SERIAL NOT NULL,
    "navn" TEXT NOT NULL,
    "beskrivelse" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "billede_url" TEXT NOT NULL,
    "skjult" BOOLEAN NOT NULL DEFAULT false,
    "bruger_id" INTEGER NOT NULL,

    CONSTRAINT "Produkter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forestillingsperioder" (
    "id" SERIAL NOT NULL,
    "navn" TEXT NOT NULL,
    "start_dato" TIMESTAMP(3) NOT NULL,
    "slut_dato" TIMESTAMP(3) NOT NULL,
    "produkt_id" INTEGER NOT NULL,

    CONSTRAINT "Forestillingsperioder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservationer" (
    "id" SERIAL NOT NULL,
    "produkt_id" INTEGER NOT NULL,
    "bruger" TEXT NOT NULL,
    "teaternavn" TEXT NOT NULL,
    "fra_dato" TIMESTAMP(3) NOT NULL,
    "til_dato" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservationer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brugere_brugernavn_key" ON "Brugere"("brugernavn");

-- CreateIndex
CREATE UNIQUE INDEX "Brugere_email_key" ON "Brugere"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- AddForeignKey
ALTER TABLE "Produkter" ADD CONSTRAINT "Produkter_bruger_id_fkey" FOREIGN KEY ("bruger_id") REFERENCES "Brugere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forestillingsperioder" ADD CONSTRAINT "Forestillingsperioder_produkt_id_fkey" FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservationer" ADD CONSTRAINT "Reservationer_produkt_id_fkey" FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
