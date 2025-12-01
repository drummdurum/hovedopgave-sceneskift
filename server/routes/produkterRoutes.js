const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');
const upload = require('../../util/upload');

// Hent alle kategorier
router.get('/kategorier', async (req, res) => {
  try {
    const kategorier = await prisma.kategorier.findMany({
      orderBy: { navn: 'asc' }
    });
    res.json({ kategorier });
  } catch (error) {
    console.error('Fetch kategorier error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af kategorier' });
  }
});

// Vis mine produkter side (SKAL være før /:id)
router.get('/mine', requireAuth, (req, res) => {
  res.render('mine-produkter', { 
    title: 'Mine produkter',
    user: req.session.user
  });
});

// Hent produkter for den loggede ind bruger API (SKAL være før /:id)
router.get('/mine/produkter', requireAuth, async (req, res) => {
  try {
    const bruger_id = req.session.user.id;

    const produkter = await prisma.produkter.findMany({
      where: { bruger_id },
      include: {
        kategorier: {
          include: {
            kategori: true
          }
        },
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Transformer kategorier til et simpelt array
    const transformedProdukter = produkter.map(p => ({
      ...p,
      kategorier: p.kategorier.map(pk => pk.kategori.navn)
    }));

    res.json({ produkter: transformedProdukter });
  } catch (error) {
    console.error('Fetch mine produkter error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af dine produkter' });
  }
});

// Vis opret produkt side (SKAL være før /:id)
router.get('/opret', requireAuth, (req, res) => {
  if (!req.session.user.godkendt) {
    return res.redirect('/profile');
  }
  res.render('opret-produkt', { 
    title: 'Opret produkt',
    user: req.session.user
  });
});

// Hent alle produkter (med mulighed for at filtrere)
router.get('/', async (req, res) => {
  try {
    const { kategori, bruger_id, skjult } = req.query;
    
    const where = {};
    
    // Filtrer på kategori via many-to-many relation
    if (kategori) {
      where.kategorier = {
        some: {
          kategori: {
            navn: kategori
          }
        }
      };
    }
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
        kategorier: {
          include: {
            kategori: true
          }
        },
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Transformer kategorier til et simpelt array
    const transformedProdukter = produkter.map(p => ({
      ...p,
      kategorier: p.kategorier.map(pk => pk.kategori.navn)
    }));

    res.json({ produkter: transformedProdukter });
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
        kategorier: {
          include: {
            kategori: true
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

    // Transformer kategorier til et simpelt array
    const transformedProdukt = {
      ...produkt,
      kategorier: produkt.kategorier.map(pk => pk.kategori.navn)
    };

    res.json({ produkt: transformedProdukt });
  } catch (error) {
    console.error('Fetch produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af produkt' });
  }
});

// Opret nyt produkt (kræver login og billede upload)
router.post('/', requireAuth, (req, res, next) => {
  upload.single('billede')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Fejl ved upload af billede' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { navn, beskrivelse, kategorier, skjult, renoveres } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !beskrivelse || !kategorier) {
      return res.status(400).json({ error: 'Navn, beskrivelse og mindst én kategori er påkrævet' });
    }

    // Tjek om billede er uploadet
    if (!req.file) {
      return res.status(400).json({ error: 'Billede er påkrævet' });
    }

    // Parse kategorier (kan være string eller array)
    let kategoriNavne = [];
    if (typeof kategorier === 'string') {
      kategoriNavne = JSON.parse(kategorier);
    } else {
      kategoriNavne = kategorier;
    }

    if (!Array.isArray(kategoriNavne) || kategoriNavne.length === 0) {
      return res.status(400).json({ error: 'Mindst én kategori er påkrævet' });
    }

    // Find kategori IDs
    const kategoriRecords = await prisma.kategorier.findMany({
      where: {
        navn: { in: kategoriNavne }
      }
    });

    if (kategoriRecords.length === 0) {
      return res.status(400).json({ error: 'Ingen gyldige kategorier fundet' });
    }

    // Byg korrekt billede URL med teater-undermappen
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const relativePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, '/');
    const billede_url = `/uploads/${relativePath}`;

    const nytProdukt = await prisma.produkter.create({
      data: {
        navn,
        beskrivelse,
        billede_url,
        skjult: skjult === true || skjult === 'true',
        renoveres: renoveres === true || renoveres === 'true',
        bruger_id,
        kategorier: {
          create: kategoriRecords.map(k => ({
            kategori_id: k.id
          }))
        }
      },
      include: {
        ejer: {
          select: {
            id: true,
            navn: true,
            teaternavn: true,
            lokation: true
          }
        },
        kategorier: {
          include: {
            kategori: true
          }
        }
      }
    });

    // Transformer kategorier til et simpelt array
    const transformedProdukt = {
      ...nytProdukt,
      kategorier: nytProdukt.kategorier.map(pk => pk.kategori.navn)
    };

    res.status(201).json({ 
      message: 'Produkt oprettet succesfuldt',
      produkt: transformedProdukt 
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
    const { navn, beskrivelse, kategorier, skjult, renoveres } = req.body;
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
    if (skjult !== undefined) updateData.skjult = skjult === true || skjult === 'true';
    if (renoveres !== undefined) updateData.renoveres = renoveres === true || renoveres === 'true';
    
    // Hvis nyt billede er uploadet
    if (req.file) {
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      const relativePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, '/');
      updateData.billede_url = `/uploads/${relativePath}`;
    }

    // Håndter kategorier hvis de er sendt med
    if (kategorier) {
      let kategoriNavne = [];
      if (typeof kategorier === 'string') {
        kategoriNavne = JSON.parse(kategorier);
      } else {
        kategoriNavne = kategorier;
      }

      if (Array.isArray(kategoriNavne) && kategoriNavne.length > 0) {
        // Find kategori IDs
        const kategoriRecords = await prisma.kategorier.findMany({
          where: {
            navn: { in: kategoriNavne }
          }
        });

        // Slet eksisterende kategori-relationer og opret nye
        await prisma.produktKategorier.deleteMany({
          where: { produkt_id: parseInt(id) }
        });

        updateData.kategorier = {
          create: kategoriRecords.map(k => ({
            kategori_id: k.id
          }))
        };
      }
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
        },
        kategorier: {
          include: {
            kategori: true
          }
        }
      }
    });

    // Transformer kategorier til et simpelt array
    const transformedProdukt = {
      ...opdateretProdukt,
      kategorier: opdateretProdukt.kategorier.map(pk => pk.kategori.navn)
    };

    res.json({ 
      message: 'Produkt opdateret succesfuldt',
      produkt: transformedProdukt 
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

module.exports = router;
