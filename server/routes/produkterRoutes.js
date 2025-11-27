const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');
const upload = require('../../util/upload');

// Hent alle produkter (med mulighed for at filtrere)
router.get('/', async (req, res) => {
  try {
    const { kategori, bruger_id, skjult } = req.query;
    
    const where = {};
    
    if (kategori) where.kategori = kategori;
    if (bruger_id) where.bruger_id = parseInt(bruger_id);
    if (skjult !== undefined) where.skjult = skjult === 'true';

    const produkter = await prisma.produkter.findMany({
      where,
      include: {
        ejer: {
          select: {
            id: true,
            navn: true,
            teaternavn: true,
            lokation: true
          }
        },
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    res.json({ produkter });
  } catch (error) {
    console.error('Fetch produkter error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af produkter' });
  }
});

// Hent et enkelt produkt
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(id) },
      include: {
        ejer: {
          select: {
            id: true,
            navn: true,
            teaternavn: true,
            lokation: true,
            email: true
          }
        },
        forestillingsperioder: {
          orderBy: {
            start_dato: 'asc'
          }
        },
        reservationer: {
          orderBy: {
            fra_dato: 'asc'
          }
        }
      }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    res.json({ produkt });
  } catch (error) {
    console.error('Fetch produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af produkt' });
  }
});

// Opret nyt produkt (kræver login og billede upload)
router.post('/', requireAuth, upload.single('billede'), async (req, res) => {
  try {
    const { navn, beskrivelse, kategori, skjult } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !beskrivelse || !kategori) {
      return res.status(400).json({ error: 'Navn, beskrivelse og kategori er påkrævet' });
    }

    // Tjek om billede er uploadet
    if (!req.file) {
      return res.status(400).json({ error: 'Billede er påkrævet' });
    }

    const billede_url = `/uploads/${req.file.filename}`;

    const nytProdukt = await prisma.produkter.create({
      data: {
        navn,
        beskrivelse,
        kategori,
        billede_url,
        skjult: skjult === true || skjult === 'true',
        bruger_id
      },
      include: {
        ejer: {
          select: {
            id: true,
            navn: true,
            teaternavn: true,
            lokation: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Produkt oprettet succesfuldt',
      produkt: nytProdukt 
    });
  } catch (error) {
    console.error('Create produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved oprettelse af produkt' });
  }
});

// Opdater produkt (kræver login og ejerskab)
router.put('/:id', requireAuth, upload.single('billede'), async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, beskrivelse, kategori, skjult } = req.body;
    const bruger_id = req.session.user.id;

    // Tjek om produkt eksisterer og om brugeren ejer det
    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(id) }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    if (produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at opdatere dette produkt' });
    }

    // Byg update data object
    const updateData = {};
    if (navn) updateData.navn = navn;
    if (beskrivelse) updateData.beskrivelse = beskrivelse;
    if (kategori) updateData.kategori = kategori;
    if (skjult !== undefined) updateData.skjult = skjult === true || skjult === 'true';
    
    // Hvis nyt billede er uploadet
    if (req.file) {
      updateData.billede_url = `/uploads/${req.file.filename}`;
    }

    const opdateretProdukt = await prisma.produkter.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        ejer: {
          select: {
            id: true,
            navn: true,
            teaternavn: true,
            lokation: true
          }
        }
      }
    });

    res.json({ 
      message: 'Produkt opdateret succesfuldt',
      produkt: opdateretProdukt 
    });
  } catch (error) {
    console.error('Update produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved opdatering af produkt' });
  }
});

// Slet produkt (kræver login og ejerskab)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bruger_id = req.session.user.id;

    // Tjek om produkt eksisterer og om brugeren ejer det
    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(id) }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    if (produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at slette dette produkt' });
    }

    await prisma.produkter.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Produkt slettet succesfuldt' });
  } catch (error) {
    console.error('Delete produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved sletning af produkt' });
  }
});

// Hent produkter for den loggede ind bruger
router.get('/mine/produkter', requireAuth, async (req, res) => {
  try {
    const bruger_id = req.session.user.id;

    const produkter = await prisma.produkter.findMany({
      where: { bruger_id },
      include: {
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    res.json({ produkter });
  } catch (error) {
    console.error('Fetch mine produkter error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af dine produkter' });
  }
});

module.exports = router;
