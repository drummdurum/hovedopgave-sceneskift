# Database ER Diagram

```mermaid
erDiagram
    Brugere {
        int id PK
        string brugernavn UK
        string password
        string navn
        string teaternavn
        string lokation
        string email UK
        boolean features
        boolean godkendt
        string rolle
    }

    Produkter {
        int id PK
        string navn
        string beskrivelse
        string billede_url
        boolean skjult
        boolean renoveres
        boolean paa_sceneskift
        int bruger_id FK
    }

    ProduktBilleder {
        int id PK
        int produkt_id FK
        string billede_url
        int position
        datetime created_at
    }

    Kategorier {
        int id PK
        string navn UK
    }

    ProduktKategorier {
        int produkt_id PK_FK
        int kategori_id PK_FK
    }

    Forestillingsperioder {
        int id PK
        string navn
        datetime start_dato
        datetime slut_dato
        int created_by FK
    }

    Reservationer {
        int id PK
        int produkt_id FK
        int laaner_id FK
        string bruger
        string teaternavn
        datetime fra_dato
        datetime til_dato
    }

    PasswordReset {
        int id PK
        string email
        string token UK
        datetime expires_at
        boolean used
        datetime created_at
    }

    %% Relationer
    Brugere ||--o{ Produkter : "ejer"
    Brugere ||--o{ Forestillingsperioder : "opretter"
    Brugere ||--o{ Reservationer : "låner"
    Produkter ||--o{ ProduktBilleder : "har"
    Produkter ||--o{ ProduktKategorier : "har"
    Kategorier ||--o{ ProduktKategorier : "tilhører"
    Produkter ||--o{ Reservationer : "har"
```

## Forklaring

### Entiteter
- **Brugere**: Teatre/brugere der kan oprette og dele rekvisitter
- **Produkter**: Rekvisitter der kan deles mellem teatre
- **ProduktBilleder**: Billeder tilknyttet et produkt (understøtter flere billeder per produkt)
- **Kategorier**: Kategorisering af produkter (f.eks. møbler, kostumer, etc.)
- **Forestillingsperioder**: Perioder hvor rekvisitter er i brug til en forestilling
- **Reservationer**: Reservationer af produkter fra andre teatre
- **PasswordReset**: Tokens til nulstilling af adgangskode

### Relationer
- En **Bruger** kan eje mange **Produkter** (1:N)
- En **Bruger** kan oprette mange **Forestillingsperioder** (1:N)
- En **Bruger** kan have mange **Reservationer** som låner (1:N)
- Et **Produkt** kan have mange **Billeder** (1:N)
- Et **Produkt** kan have mange **Kategorier** via junction-tabel (N:M)
- Et **Produkt** kan have mange **Reservationer** (1:N)

### Bemærkninger
- `paa_sceneskift`: Angiver om produktet er på brugerens lager (false) eller Sceneskifts hovedlager (true)
- `billede_url` i Produkter beholdes for bagudkompatibilitet
- `laaner_id` i Reservationer refererer til den bruger der har lavet reservationen
- `position` i ProduktBilleder bruges til at sortere billeder (0 = primært billede)
