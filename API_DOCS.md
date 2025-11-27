# API Documentation

## Oversigt
API'et tilbyder endpoints til brugeradministration, produktstyring, forestillingsperioder og reservationer.

## Authentication

### Register ny bruger
```http
POST /auth/register
Content-Type: application/json

{
  "brugernavn": "testbruger",
  "password": "sikkertkodeord",
  "navn": "Test Testesen",
  "teaternavn": "Det Kongelige Teater",
  "lokation": "København",
  "email": "test@example.com",
  "features": false
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "brugernavn": "testbruger",
  "password": "sikkertkodeord"
}
```

### Logout
```http
POST /auth/logout
```

### Hent nuværende bruger
```http
GET /auth/me
```

## Produkter

### Hent alle produkter
```http
GET /produkter
GET /produkter?kategori=Scenografi
GET /produkter?bruger_id=1
GET /produkter?skjult=false
```

### Hent et enkelt produkt
```http
GET /produkter/:id
```

### Opret nyt produkt (kræver login)
```http
POST /produkter
Content-Type: multipart/form-data

navn: "Flot scenografi"
beskrivelse: "En smuk baggrund til shakespeare"
kategori: "Scenografi"
skjult: false
billede: [fil]
```

### Opdater produkt (kræver login og ejerskab)
```http
PUT /produkter/:id
Content-Type: multipart/form-data

navn: "Opdateret navn"
beskrivelse: "Ny beskrivelse"
kategori: "Scenografi"
skjult: true
billede: [fil] (valgfrit)
```

### Slet produkt (kræver login og ejerskab)
```http
DELETE /produkter/:id
```

### Hent mine produkter (kræver login)
```http
GET /produkter/mine/produkter
```

## Forestillingsperioder

### Hent forestillingsperioder for et produkt
```http
GET /api/produkt/:produkt_id/forestillingsperioder
```

### Hent en enkelt forestillingsperiode
```http
GET /api/forestillingsperioder/:id
```

### Opret forestillingsperiode (kræver login og ejerskab)
```http
POST /api/produkt/:produkt_id/forestillingsperioder
Content-Type: application/json

{
  "navn": "Vinter sæson 2025",
  "start_dato": "2025-01-01T00:00:00Z",
  "slut_dato": "2025-03-31T23:59:59Z"
}
```

### Opdater forestillingsperiode (kræver login og ejerskab)
```http
PUT /api/forestillingsperioder/:id
Content-Type: application/json

{
  "navn": "Opdateret navn",
  "start_dato": "2025-01-01T00:00:00Z",
  "slut_dato": "2025-03-31T23:59:59Z"
}
```

### Slet forestillingsperiode (kræver login og ejerskab)
```http
DELETE /api/forestillingsperioder/:id
```

## Reservationer

### Hent reservationer for et produkt
```http
GET /api/produkt/:produkt_id/reservationer
```

### Hent en enkelt reservation
```http
GET /api/reservationer/:id
```

### Opret reservation (kræver login)
```http
POST /api/produkt/:produkt_id/reservationer
Content-Type: application/json

{
  "fra_dato": "2025-02-01T00:00:00Z",
  "til_dato": "2025-02-14T23:59:59Z"
}
```

### Opdater reservation (kun ejer af produkt)
```http
PUT /api/reservationer/:id
Content-Type: application/json

{
  "bruger": "Opdateret navn",
  "teaternavn": "Opdateret teater",
  "fra_dato": "2025-02-01T00:00:00Z",
  "til_dato": "2025-02-14T23:59:59Z"
}
```

### Slet reservation (kun ejer af produkt)
```http
DELETE /api/reservationer/:id
```

## Upload af billeder

Billeder uploades via multipart/form-data og gemmes i `/uploads` mappen.
- Tilladte formater: jpeg, jpg, png, gif, webp
- Max størrelse: 5MB
- Billeder er tilgængelige via `/uploads/filnavn`

## Environment Variables

Opret en `.env` fil i roden af projektet:

```
DATABASE_URL="postgresql://postgres:password@host:5432/database"
SESSION_SECRET="your-secret-key"
PORT=3000
```

## Database Migration

Når du er på Railway eller har adgang til databasen, kør:
```bash
npx prisma migrate dev --name init
```

For at generere Prisma Client:
```bash
npx prisma generate
```
