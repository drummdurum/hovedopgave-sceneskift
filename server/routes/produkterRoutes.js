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
        billeder: {
          orderBy: { position: 'asc' }
        },
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Transformer kategorier til et simpelt array og tilføj billeder
    const transformedProdukter = produkter.map(p => ({
      ...p,
      kategorier: p.kategorier.map(pk => pk.kategori.navn),
      billeder: p.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
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
        billeder: {
          orderBy: { position: 'asc' }
        },
        forestillingsperioder: true,
        reservationer: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Transformer kategorier til et simpelt array og tilføj billeder
    const transformedProdukter = produkter.map(p => ({
      ...p,
      kategorier: p.kategorier.map(pk => pk.kategori.navn),
      billeder: p.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
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
        billeder: {
          orderBy: { position: 'asc' }
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

    // Transformer kategorier til et simpelt array og tilføj billeder
    const transformedProdukt = {
      ...produkt,
      kategorier: produkt.kategorier.map(pk => pk.kategori.navn),
      billeder: produkt.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
    };

    res.json({ produkt: transformedProdukt });
  } catch (error) {
    console.error('Fetch produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af produkt' });
  }
});

// Opret nyt produkt (kræver login og billede uploads - op til 10 billeder)
router.post('/', requireAuth, (req, res, next) => {
  upload.array('billeder', 10)(req, res, (err) => {
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

    // Tjek om mindst ét billede er uploadet
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Mindst ét billede er påkrævet' });
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

    // Byg billede URLs med teater-undermappen
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const billedeData = req.files.map((file, index) => {
      const relativePath = path.relative(uploadsDir, file.path).replace(/\\/g, '/');
      return {
        billede_url: `/uploads/${relativePath}`,
        position: index
      };
    });

    const nytProdukt = await prisma.produkter.create({
      data: {
        navn,
        beskrivelse,
        billede_url: billedeData[0]?.billede_url || null, // Primært billede for bagudkompatibilitet
        skjult: skjult === true || skjult === 'true',
        renoveres: renoveres === true || renoveres === 'true',
        bruger_id,
        kategorier: {
          create: kategoriRecords.map(k => ({
            kategori_id: k.id
          }))
        },
        billeder: {
          create: billedeData
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
        },
        billeder: {
          orderBy: { position: 'asc' }
        }
      }
    });

    // Transformer kategorier til et simpelt array og tilføj billeder
    const transformedProdukt = {
      ...nytProdukt,
      kategorier: nytProdukt.kategorier.map(pk => pk.kategori.navn),
      billeder: nytProdukt.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
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

// Opdater produkt (kræver login og ejerskab) - understøtter tilføjelse af nye billeder
router.put('/:id', requireAuth, upload.array('billeder', 10), async (req, res) => {
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
    
    // Hvis nye billeder er uploadet, tilføj dem
    if (req.files && req.files.length > 0) {
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      
      // Find højeste position for eksisterende billeder
      const eksisterendeBilleder = await prisma.produktBilleder.findMany({
        where: { produkt_id: parseInt(id) },
        orderBy: { position: 'desc' },
        take: 1
      });
      const startPosition = eksisterendeBilleder.length > 0 ? eksisterendeBilleder[0].position + 1 : 0;
      
      // Tilføj nye billeder
      const nyeBilleder = req.files.map((file, index) => {
        const relativePath = path.relative(uploadsDir, file.path).replace(/\\/g, '/');
        return {
          produkt_id: parseInt(id),
          billede_url: `/uploads/${relativePath}`,
          position: startPosition + index
        };
      });
      
      await prisma.produktBilleder.createMany({ data: nyeBilleder });
      
      // Opdater primært billede hvis der ikke er ét
      if (!produkt.billede_url && nyeBilleder.length > 0) {
        updateData.billede_url = nyeBilleder[0].billede_url;
      }
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
        },
        billeder: {
          orderBy: { position: 'asc' }
        }
      }
    });

    // Transformer kategorier til et simpelt array og tilføj billeder
    const transformedProdukt = {
      ...opdateretProdukt,
      kategorier: opdateretProdukt.kategorier.map(pk => pk.kategori.navn),
      billeder: opdateretProdukt.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
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

// Slet et enkelt billede fra et produkt (kræver login og ejerskab)
router.delete('/:produktId/billeder/:billedeId', requireAuth, async (req, res) => {
  try {
    const { produktId, billedeId } = req.params;
    const bruger_id = req.session.user.id;

    // Tjek om produkt eksisterer og om brugeren ejer det
    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(produktId) },
      include: { billeder: true }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    if (produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at slette dette billede' });
    }

    // Tjek at produktet har mere end ét billede
    if (produkt.billeder.length <= 1) {
      return res.status(400).json({ error: 'Et produkt skal have mindst ét billede' });
    }

    // Slet billedet
    await prisma.produktBilleder.delete({
      where: { id: parseInt(billedeId) }
    });

    // Hvis det slettede billede var det primære, opdater primært billede
    const slettetBillede = produkt.billeder.find(b => b.id === parseInt(billedeId));
    if (slettetBillede && produkt.billede_url === slettetBillede.billede_url) {
      const nytPrimaertBillede = produkt.billeder.find(b => b.id !== parseInt(billedeId));
      if (nytPrimaertBillede) {
        await prisma.produkter.update({
          where: { id: parseInt(produktId) },
          data: { billede_url: nytPrimaertBillede.billede_url }
        });
      }
    }

    res.json({ message: 'Billede slettet succesfuldt' });
  } catch (error) {
    console.error('Delete billede error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved sletning af billede' });
  }
});

// Sæt et billede som primært (kræver login og ejerskab)
router.put('/:produktId/billeder/:billedeId/primaer', requireAuth, async (req, res) => {
  try {
    const { produktId, billedeId } = req.params;
    const bruger_id = req.session.user.id;

    // Tjek om produkt eksisterer og om brugeren ejer det
    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(produktId) }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    if (produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at ændre dette billede' });
    }

    // Find billedet
    const billede = await prisma.produktBilleder.findUnique({
      where: { id: parseInt(billedeId) }
    });

    if (!billede || billede.produkt_id !== parseInt(produktId)) {
      return res.status(404).json({ error: 'Billede ikke fundet' });
    }

    // Opdater alle positioner
    await prisma.produktBilleder.updateMany({
      where: { produkt_id: parseInt(produktId), position: { lt: billede.position } },
      data: { position: { increment: 1 } }
    });

    await prisma.produktBilleder.update({
      where: { id: parseInt(billedeId) },
      data: { position: 0 }
    });

    // Opdater primært billede på produktet
    await prisma.produkter.update({
      where: { id: parseInt(produktId) },
      data: { billede_url: billede.billede_url }
    });

    res.json({ message: 'Primært billede opdateret' });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved ændring af primært billede' });
  }
});

module.exports = router;
