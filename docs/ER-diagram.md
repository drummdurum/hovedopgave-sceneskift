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
        int bruger_id FK
    }

    Kategorier {
        int id PK
        string navn UK
    }

    ProduktKategorier {
        int produkt_id PK,FK
        int kategori_id PK,FK
    }

    Forestillingsperioder {
        int id PK
        string navn
        datetime start_dato
        datetime slut_dato
    }

    ForestillingsperiodeProdukter {
        int forestillingsperiode_id PK,FK
        int produkt_id PK,FK
    }

    Reservationer {
        int id PK
        int produkt_id FK
        string bruger
        string teaternavn
        datetime fra_dato
        datetime til_dato
    }

    %% Relationer
    Brugere ||--o{ Produkter : "ejer"
    Produkter ||--o{ ProduktKategorier : "har"
    Kategorier ||--o{ ProduktKategorier : "tilhører"
    Produkter ||--o{ ForestillingsperiodeProdukter : "indgår i"
    Forestillingsperioder ||--o{ ForestillingsperiodeProdukter : "indeholder"
    Produkter ||--o{ Reservationer : "har"
```

## Forklaring

### Entiteter
- **Brugere**: Teatre/brugere der kan oprette og dele rekvisitter
- **Produkter**: Rekvisitter der kan deles mellem teatre
- **Kategorier**: Kategorisering af produkter (f.eks. møbler, kostumer, etc.)
- **Forestillingsperioder**: Perioder hvor rekvisitter er i brug til en forestilling
- **Reservationer**: Reservationer af produkter fra andre teatre

### Relationer
- En **Bruger** kan eje mange **Produkter** (1:N)
- Et **Produkt** kan have mange **Kategorier** via junction-tabel (N:M)
- En **Forestillingsperiode** kan have mange **Produkter** via junction-tabel (N:M)
- Et **Produkt** kan have mange **Reservationer** (1:N)
