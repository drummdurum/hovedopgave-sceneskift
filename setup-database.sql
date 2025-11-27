-- Kør denne SQL direkte i Railway's database query editor

-- 1. Opret Brugere tabel
CREATE TABLE IF NOT EXISTS "Brugere" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "Brugere_brugernavn_key" ON "Brugere"("brugernavn");
CREATE UNIQUE INDEX IF NOT EXISTS "Brugere_email_key" ON "Brugere"("email");

-- 2. Opret Produkter tabel
CREATE TABLE IF NOT EXISTS "Produkter" (
    "id" SERIAL NOT NULL,
    "navn" TEXT NOT NULL,
    "beskrivelse" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "billede_url" TEXT NOT NULL,
    "skjult" BOOLEAN NOT NULL DEFAULT false,
    "bruger_id" INTEGER NOT NULL,
    CONSTRAINT "Produkter_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Produkter" ADD CONSTRAINT "Produkter_bruger_id_fkey" 
FOREIGN KEY ("bruger_id") REFERENCES "Brugere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Opret Forestillingsperioder tabel
CREATE TABLE IF NOT EXISTS "Forestillingsperioder" (
    "id" SERIAL NOT NULL,
    "navn" TEXT NOT NULL,
    "start_dato" TIMESTAMP(3) NOT NULL,
    "slut_dato" TIMESTAMP(3) NOT NULL,
    "produkt_id" INTEGER NOT NULL,
    CONSTRAINT "Forestillingsperioder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Forestillingsperioder" ADD CONSTRAINT "Forestillingsperioder_produkt_id_fkey" 
FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Opret Reservationer tabel
CREATE TABLE IF NOT EXISTS "Reservationer" (
    "id" SERIAL NOT NULL,
    "produkt_id" INTEGER NOT NULL,
    "bruger" TEXT NOT NULL,
    "teaternavn" TEXT NOT NULL,
    "fra_dato" TIMESTAMP(3) NOT NULL,
    "til_dato" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reservationer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Reservationer" ADD CONSTRAINT "Reservationer_produkt_id_fkey" 
FOREIGN KEY ("produkt_id") REFERENCES "Produkter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Opret Session tabel (til express-session)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sid_key" ON "Session"("sid");

-- 6. Opret Prisma migrations tabel (så Prisma ved at migration er kørt)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- 7. Marker migration som kørt
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "applied_steps_count", "started_at", "finished_at")
VALUES (
    '20251127000000_init',
    'f3b5c8d9e1a2b7c4d6e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    '20251127000000_init',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

SELECT 'Database setup complete! ✅' as status;
