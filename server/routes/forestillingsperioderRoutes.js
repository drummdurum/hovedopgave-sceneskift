const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');

// Hent alle forestillingsperioder (for dropdown etc.)
router.get('/', requireAuth, async (req, res) => {
  try {
    const forestillingsperioder = await prisma.forestillingsperioder.findMany({
      orderBy: {
        start_dato: 'desc'
      }
    });

    res.json({ forestillingsperioder });
  } catch (error) {
    console.error('Fetch all forestillingsperioder error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af forestillingsperioder' });
  }
});

// Hent alle forestillingsperioder for den loggede ind bruger
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bruger_id = req.session.user.id;

    // Hent alle produkter for brugeren
    const mineProdukter = await prisma.produkter.findMany({
      where: { bruger_id },
      select: { id: true }
    });

    const produktIds = mineProdukter.map(p => p.id);

    // Hent forestillingsperioder hvor mindst ét af brugerens produkter er tilknyttet
    const forestillingsperioder = await prisma.forestillingsperioder.findMany({
      where: {
        produkter: {
          some: {
            produkt_id: { in: produktIds }
          }
        }
      },
      include: {
        produkter: {
          include: {
            produkt: {
              select: {
                id: true,
                navn: true,
                billede_url: true
              }
            }
          }
        }
      },
      orderBy: {
        start_dato: 'desc'
      }
    });

    res.json({ forestillingsperioder });
  } catch (error) {
    console.error('Fetch forestillingsperioder error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af forestillingsperioder' });
  }
});

// Hent forestillingsperioder for et specifikt produkt
router.get('/produkt/:produktId', async (req, res) => {
  try {
    const { produktId } = req.params;

    const forestillingsperioder = await prisma.forestillingsperioder.findMany({
      where: {
        produkter: {
          some: {
            produkt_id: parseInt(produktId)
          }
        }
      },
      orderBy: {
        start_dato: 'asc'
      }
    });

    res.json({ forestillingsperioder });
  } catch (error) {
    console.error('Fetch forestillingsperioder for produkt error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af forestillingsperioder' });
  }
});

// Opret ny forestillingsperiode med flere produkter
router.post('/', requireAuth, async (req, res) => {
  try {
    const { navn, produkt_ids, start_dato, slut_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !produkt_ids || produkt_ids.length === 0 || !start_dato || !slut_dato) {
      return res.status(400).json({ error: 'Alle felter er påkrævet (navn, mindst ét produkt, start dato, slut dato)' });
    }

    // Tjek om alle produkter tilhører brugeren
    const produkter = await prisma.produkter.findMany({
      where: { 
        id: { in: produkt_ids },
        bruger_id: bruger_id
      }
    });

    if (produkter.length !== produkt_ids.length) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at tilføje perioder til alle de valgte produkter' });
    }

    // Tjek at slut_dato er efter start_dato
    if (new Date(slut_dato) < new Date(start_dato)) {
      return res.status(400).json({ error: 'Slutdato skal være efter startdato' });
    }

    // Opret forestillingsperiode med tilknyttede produkter
    const nyForestillingsperiode = await prisma.forestillingsperioder.create({
      data: {
        navn,
        start_dato: new Date(start_dato),
        slut_dato: new Date(slut_dato),
        produkter: {
          create: produkt_ids.map(id => ({
            produkt_id: id
          }))
        }
      },
      include: {
        produkter: {
          include: {
            produkt: {
              select: {
                id: true,
                navn: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Forestillingsperiode oprettet',
      forestillingsperiode: nyForestillingsperiode
    });
  } catch (error) {
    console.error('Create forestillingsperiode error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved oprettelse af forestillingsperiode' });
  }
});

// Opdater forestillingsperiode
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { navn, produkt_ids, start_dato, slut_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Hent eksisterende forestillingsperiode
    const eksisterende = await prisma.forestillingsperioder.findUnique({
      where: { id: parseInt(id) },
      include: {
        produkter: {
          include: {
            produkt: true
          }
        }
      }
    });

    if (!eksisterende) {
      return res.status(404).json({ error: 'Forestillingsperiode ikke fundet' });
    }

    // Tjek om brugeren ejer mindst ét af produkterne
    const ejerProdukt = eksisterende.produkter.some(p => p.produkt.bruger_id === bruger_id);
    if (!ejerProdukt) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at redigere denne periode' });
    }

    // Hvis nye produkter er angivet, valider dem
    if (produkt_ids && produkt_ids.length > 0) {
      const produkter = await prisma.produkter.findMany({
        where: { 
          id: { in: produkt_ids },
          bruger_id: bruger_id
        }
      });

      if (produkter.length !== produkt_ids.length) {
        return res.status(403).json({ error: 'Du har ikke tilladelse til at tilføje alle de valgte produkter' });
      }
    }

    // Opdater forestillingsperiode
    const opdateret = await prisma.forestillingsperioder.update({
      where: { id: parseInt(id) },
      data: {
        ...(navn && { navn }),
        ...(start_dato && { start_dato: new Date(start_dato) }),
        ...(slut_dato && { slut_dato: new Date(slut_dato) }),
        ...(produkt_ids && {
          produkter: {
            deleteMany: {},
            create: produkt_ids.map(pid => ({
              produkt_id: pid
            }))
          }
        })
      },
      include: {
        produkter: {
          include: {
            produkt: {
              select: {
                id: true,
                navn: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Forestillingsperiode opdateret',
      forestillingsperiode: opdateret
    });
  } catch (error) {
    console.error('Update forestillingsperiode error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved opdatering af forestillingsperiode' });
  }
});

// Slet forestillingsperiode
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bruger_id = req.session.user.id;

    // Hent forestillingsperioden med produkt info
    const forestillingsperiode = await prisma.forestillingsperioder.findUnique({
      where: { id: parseInt(id) },
      include: {
        produkter: {
          include: {
            produkt: true
          }
        }
      }
    });

    if (!forestillingsperiode) {
      return res.status(404).json({ error: 'Forestillingsperiode ikke fundet' });
    }

    // Tjek om brugeren ejer mindst ét af produkterne
    const ejerProdukt = forestillingsperiode.produkter.some(p => p.produkt.bruger_id === bruger_id);
    if (!ejerProdukt) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at slette denne periode' });
    }

    await prisma.forestillingsperioder.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Forestillingsperiode slettet' });
  } catch (error) {
    console.error('Delete forestillingsperiode error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved sletning af forestillingsperiode' });
  }
});

module.exports = router;
