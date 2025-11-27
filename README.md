# Hovedopgave 2025

Node.js Express applikation med EJS og Tailwind CSS

## Installation

1. Installer dependencies:
```bash
npm install
```

2. Byg Tailwind CSS:
```bash
npm run build:css
```

## Kørsel

### Development mode
```bash
npm run dev
```
Dette starter serveren med nodemon (auto-reload) og kører på http://localhost:3000

### Production mode
```bash
npm start
```

## Tailwind CSS

### Byg CSS én gang:
```bash
npm run build:css
```

### Watch mode (automatisk rebuild ved ændringer):
```bash
npm run watch:css
```

## Mappestruktur

- `server.js` - Hovedfilen der starter Express serveren
- `public/` - Statisk mappe (CSS, billeder, osv.)
- `public/compentens/view/` - EJS views
- `public/compentens/header/` - Header komponent
- `public/compentens/footer/` - Footer komponent
- `server/routes/` - Express routes
- `server/middleware/` - Custom middleware
- `database/` - Database filer
- `service/` - Business logic
- `util/` - Utility funktioner
