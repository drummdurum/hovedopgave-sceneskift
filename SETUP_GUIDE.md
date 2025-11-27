# Setup Guide - Hovedopgave Sceneskift

## 📋 Hvad er sat op

Dette projekt indeholder nu:
- ✅ PostgreSQL database med Prisma ORM
- ✅ Session management med PostgreSQL store
- ✅ Authentication (register, login, logout)
- ✅ File upload til billeder (/uploads)
- ✅ CRUD operations for alle models:
  - Brugere (via auth endpoints)
  - Produkter
  - Forestillingsperioder
  - Reservationer

## 🗄️ Database Models

### Brugere
- id, brugernavn, password (hashed), navn, teaternavn, lokation, email, features

### Produkter
- id, navn, beskrivelse, kategori, billede_url, skjult, bruger_id (ejer)
- Relations: forestillingsperioder, reservationer

### Forestillingsperioder
- id, navn, start_dato, slut_dato, produkt_id

### Reservationer
- id, bruger, teaternavn, fra_dato, til_dato, produkt_id

## 🚀 Lokal Development Setup

### 1. Database Connection
Du bruger Railway's internal URL i `.env` filen:
```
DATABASE_URL="postgresql://postgres:IRClPsbdqIYWLLbPqJZddfgUxbgNhDjb@postgres.railway.internal:5432/railway"
```

⚠️ **Vigtigt**: Denne URL virker kun når applikationen kører på Railway. For lokal udvikling skal du:
- Enten bruge Railway's public database URL (find den i Railway dashboard)
- Eller sætte en lokal PostgreSQL database op

### 2. Hvis du vil bruge en lokal database:
```bash
# Installer PostgreSQL lokalt og opret en database
# Opdater DATABASE_URL i .env til noget som:
DATABASE_URL="postgresql://bruger:password@localhost:5432/sceneskift"
```

### 3. Kør migrations
```bash
npm run prisma:migrate
```
Dette vil:
- Oprette alle tabeller i databasen
- Generere Prisma Client

### 4. Start serveren
```bash
npm run dev
```

## 🌐 Railway Deployment

### 1. Railway Setup
Når du deployer til Railway, tilføj disse environment variables:
```
DATABASE_URL=postgresql://postgres:IRClPsbdqIYWLLbPqJZddfgUxbgNhDjb@postgres.railway.internal:5432/railway
SESSION_SECRET=generer-en-random-streng-her
NODE_ENV=production
```

### 2. Railway Build Command
I Railway settings, sæt:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Første deployment
Efter første deployment, kør migration via Railway CLI eller dashboard:
```bash
railway run npx prisma migrate deploy
```

## 📁 Folder Structure
```
c:\Users\Sebastian Drumm\VS\Hovedopgave_2025
├── database/
│   └── prisma.js              # Prisma client singleton
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   ├── compentens/
│   │   ├── footer/
│   │   ├── header/
│   │   └── view/              # EJS templates
│   ├── css/
│   └── js/
├── server/
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   └── routes/
│       ├── mainRoutes.js      # Hovedsider
│       ├── authRoutes.js      # /auth/* - login, register, logout
│       ├── produkterRoutes.js # /produkter/* - CRUD for produkter
│       └── dataRoutes.js      # /api/* - forestillingsperioder & reservationer
├── uploads/                   # Uploaded billeder
├── util/
│   └── upload.js              # Multer configuration
├── .env                       # Environment variables
├── server.js                  # Main server file
└── API_DOCS.md                # API documentation
```

## 🔐 Authentication Flow

1. **Register**: `POST /auth/register` - Opretter ny bruger med hashed password
2. **Login**: `POST /auth/login` - Logger ind og gemmer bruger i session
3. **Protected Routes**: Middleware `requireAuth` tjekker om bruger er logget ind
4. **Logout**: `POST /auth/logout` - Destruerer session

## 📸 Billede Upload

Billeder uploades via multipart/form-data:
```javascript
// HTML form
<form action="/produkter" method="POST" enctype="multipart/form-data">
  <input type="file" name="billede" required>
  <input type="text" name="navn" required>
  <input type="text" name="beskrivelse" required>
  <input type="text" name="kategori" required>
  <button type="submit">Opret</button>
</form>
```

Billeder gemmes i `/uploads/` og er tilgængelige via `/uploads/filnavn`.

## 🔧 Nyttige Commands

```bash
# Development
npm run dev              # Start server med nodemon
npm run watch:css        # Watch Tailwind changes

# Database
npm run prisma:migrate   # Kør migrations (lokal)
npm run prisma:generate  # Generer Prisma Client
npm run prisma:studio    # Åbn Prisma Studio GUI
npm run prisma:deploy    # Deploy migrations (produktion)

# Build
npm run build           # Build CSS og generer Prisma Client
npm run build:css       # Build kun CSS
```

## 📝 API Endpoints Oversigt

### Auth
- `POST /auth/register` - Opret bruger
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Hent nuværende bruger

### Produkter
- `GET /produkter` - Hent alle produkter
- `GET /produkter/:id` - Hent et produkt
- `POST /produkter` - Opret produkt (kræver login + billede)
- `PUT /produkter/:id` - Opdater produkt (kræver ejerskab)
- `DELETE /produkter/:id` - Slet produkt (kræver ejerskab)
- `GET /produkter/mine/produkter` - Hent mine produkter

### Forestillingsperioder
- `GET /api/produkt/:produkt_id/forestillingsperioder` - Hent alle for produkt
- `GET /api/forestillingsperioder/:id` - Hent enkelt
- `POST /api/produkt/:produkt_id/forestillingsperioder` - Opret (kræver ejerskab)
- `PUT /api/forestillingsperioder/:id` - Opdater (kræver ejerskab)
- `DELETE /api/forestillingsperioder/:id` - Slet (kræver ejerskab)

### Reservationer
- `GET /api/produkt/:produkt_id/reservationer` - Hent alle for produkt
- `GET /api/reservationer/:id` - Hent enkelt
- `POST /api/produkt/:produkt_id/reservationer` - Opret (kræver login)
- `PUT /api/reservationer/:id` - Opdater (kræver ejerskab af produkt)
- `DELETE /api/reservationer/:id` - Slet (kræver ejerskab af produkt)

Se `API_DOCS.md` for detaljerede eksempler.

## 🐛 Troubleshooting

### Database connection fejl
- Tjek at DATABASE_URL er korrekt i `.env`
- For lokal udvikling: brug Railway's public URL eller lokal database
- For Railway: brug internal URL

### Session fejl
- Tjek at SESSION_SECRET er sat i `.env`
- Tjek at Session table er oprettet (kører automatisk første gang)

### Upload fejl
- Tjek at `/uploads` mappen eksisterer
- Tjek filstørrelse (max 5MB)
- Tjek filtype (kun billeder)

## 📚 Næste Steps

1. **Test API endpoints** - Brug Postman eller Thunder Client
2. **Opret frontend views** - Integrer med dine EJS templates
3. **Deploy til Railway** - Push til git og deploy
4. **Test på Railway** - Verificer database connection og uploads

Held og lykke med projektet! 🚀
