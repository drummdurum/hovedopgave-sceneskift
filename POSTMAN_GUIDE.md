# Postman Test Guide til Sceneskift API

## Import Collection
1. Åbn Postman
2. Klik på "Import" knappen
3. Vælg `Postman_Collection.json` filen
4. Klik "Import"

## Test Rækkefølge (Vigtigt!)

### 1️⃣ Register & Login (FØRST)
Start med at oprette en bruger og logge ind:

**a) Register Bruger**
```
POST /auth/register
```
JSON Body:
```json
{
  "brugernavn": "testbruger1",
  "password": "sikkertkodeord123",
  "navn": "Test Testesen",
  "teaternavn": "Det Kongelige Teater",
  "lokation": "København",
  "email": "test@example.com",
  "features": false
}
```

**b) Login**
```
POST /auth/login
```
JSON Body:
```json
{
  "brugernavn": "testbruger1",
  "password": "sikkertkodeord123"
}
```

⚠️ **VIGTIGT**: Efter login gemmes session i cookies. Postman sender automatisk cookies med efterfølgende requests.

**c) Verificer Login**
```
GET /auth/me
```
Dette skal returnere din bruger information.

---

### 2️⃣ Test Produkter

**a) Hent alle produkter** (virker uden login)
```
GET /produkter
```

**b) Opret produkt** (kræver login)
```
POST /produkter
Content-Type: multipart/form-data
```
Form data:
- `navn`: "Smuk scenografi til Hamlet"
- `beskrivelse`: "En fantastisk baggrund med gotisk stil"
- `kategori`: "Scenografi"
- `skjult`: "false"
- `billede`: [Upload et billede]

📸 **Upload billede i Postman:**
1. Vælg "Body" tab
2. Vælg "form-data"
3. Ved `billede` feltet, vælg "File" fra dropdown
4. Klik "Select Files" og vælg et billede

**c) Hent et specifikt produkt**
```
GET /produkter/1
```
(Brug ID fra produkt du lige oprettede)

**d) Hent mine produkter**
```
GET /produkter/mine/produkter
```

**e) Opdater produkt** (kun hvis du ejer det)
```
PUT /produkter/1
Content-Type: multipart/form-data
```
Form data:
- `navn`: "Opdateret navn"
- `beskrivelse`: "Opdateret beskrivelse"
- `kategori`: "Scenografi"

---

### 3️⃣ Test Forestillingsperioder

**a) Opret forestillingsperiode** (kræver at du ejer produkt med ID 1)
```
POST /api/produkt/1/forestillingsperioder
Content-Type: application/json
```
JSON Body:
```json
{
  "navn": "Vinter sæson 2025",
  "start_dato": "2025-01-01T00:00:00Z",
  "slut_dato": "2025-03-31T23:59:59Z"
}
```

**b) Hent alle forestillingsperioder for produkt**
```
GET /api/produkt/1/forestillingsperioder
```

**c) Hent specifik forestillingsperiode**
```
GET /api/forestillingsperioder/1
```

**d) Opdater forestillingsperiode**
```
PUT /api/forestillingsperioder/1
Content-Type: application/json
```
JSON Body:
```json
{
  "navn": "Opdateret vinter sæson",
  "start_dato": "2025-01-15T00:00:00Z",
  "slut_dato": "2025-04-15T23:59:59Z"
}
```

---

### 4️⃣ Test Reservationer

**a) Opret reservation** (kræver login)
```
POST /api/produkt/1/reservationer
Content-Type: application/json
```
JSON Body:
```json
{
  "fra_dato": "2025-02-01T00:00:00Z",
  "til_dato": "2025-02-14T23:59:59Z"
}
```

**b) Hent alle reservationer for produkt**
```
GET /api/produkt/1/reservationer
```

**c) Hent specifik reservation**
```
GET /api/reservationer/1
```

**d) Opdater reservation** (kun ejer af produkt)
```
PUT /api/reservationer/1
Content-Type: application/json
```
JSON Body:
```json
{
  "fra_dato": "2025-02-05T00:00:00Z",
  "til_dato": "2025-02-20T23:59:59Z"
}
```

---

### 5️⃣ Test Filtrering

**Filter produkter efter kategori**
```
GET /produkter?kategori=Scenografi
```

**Filter skjulte produkter**
```
GET /produkter?skjult=false
```

**Filter efter bruger**
```
GET /produkter?bruger_id=1
```

---

## Fejlhåndtering

### 401 Unauthorized
- Du er ikke logget ind
- Kør "Login" request igen

### 403 Forbidden
- Du prøver at redigere/slette noget du ikke ejer
- Kun ejeren af et produkt kan opdatere/slette det

### 404 Not Found
- Ressourcen eksisterer ikke
- Tjek at ID'et er korrekt

### 400 Bad Request
- Manglende påkrævede felter
- Tjek at alle felter er udfyldt

---

## Tips til Postman

### Gem Session automatisk
Postman håndterer cookies automatisk, så session bevares mellem requests.

### Brug Variables
1. Opret et Environment i Postman
2. Tilføj variable:
   - `base_url`: `https://hovedopgave-sceneskift-production.up.railway.app`
   - `produkt_id`: (gem ID efter oprettelse)
3. Brug i requests: `{{base_url}}/produkter/{{produkt_id}}`

### Test Scripts
Tilføj til "Tests" tab efter "Login":
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("user_id", jsonData.user.id);
}
```

### Se Response
- "Pretty" tab for formateret JSON
- "Raw" tab for rå response
- "Headers" tab for se cookies

---

## Komplet Test Flow

1. **Register** → Opret bruger
2. **Login** → Log ind (session oprettet)
3. **Opret Produkt** → Upload billede + info
4. **Hent Produkter** → Se dit nye produkt
5. **Opret Forestillingsperiode** → Tilføj periode til dit produkt
6. **Opret Reservation** → Reserver dit produkt
7. **Hent Mine Produkter** → Se oversigt
8. **Opdater Produkt** → Rediger dit produkt
9. **Logout** → Log ud

God fornøjelse! 🚀
