const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');

// Hent alle forestillingsperioder for den loggede ind bruger
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bruger_id = req.session.user.id;

    // Hent alle produkter for brugeren og deres forestillingsperioder
    const produkter = await prisma.produkter.findMany({
      where: { bruger_id },
      select: { id: true }
    });

    const produktIds = produkter.map(p => p.id);

    const forestillingsperioder = await prisma.forestillingsperioder.findMany({
      where: {
        produkt_id: { in: produktIds }
      },
      include: {
        produkt: {
          select: {
            id: true,
            navn: true,
            billede_url: true
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
      where: { produkt_id: parseInt(produktId) },
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

// Opret ny forestillingsperiode
router.post('/', requireAuth, async (req, res) => {
  try {
    const { navn, produkt_id, start_dato, slut_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !produkt_id || !start_dato || !slut_dato) {
      return res.status(400).json({ error: 'Alle felter er påkrævet' });
    }

    // Tjek om produktet tilhører brugeren
    const produkt = await prisma.produkter.findUnique({
      where: { id: produkt_id }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    if (produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at tilføje perioder til dette produkt' });
    }

    // Tjek at slut_dato er efter start_dato
    if (new Date(slut_dato) < new Date(start_dato)) {
      return res.status(400).json({ error: 'Slutdato skal være efter startdato' });
    }

    const nyForestillingsperiode = await prisma.forestillingsperioder.create({
      data: {
        navn,
        start_dato: new Date(start_dato),
        slut_dato: new Date(slut_dato),
        produkt_id
      },
      include: {
        produkt: {
          select: {
            id: true,
            navn: true
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

// Slet forestillingsperiode
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bruger_id = req.session.user.id;

    // Hent forestillingsperioden med produkt info
    const forestillingsperiode = await prisma.forestillingsperioder.findUnique({
      where: { id: parseInt(id) },
      include: {
        produkt: true
      }
    });

    if (!forestillingsperiode) {
      return res.status(404).json({ error: 'Forestillingsperiode ikke fundet' });
    }

    // Tjek om brugeren ejer produktet
    if (forestillingsperiode.produkt.bruger_id !== bruger_id) {
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
