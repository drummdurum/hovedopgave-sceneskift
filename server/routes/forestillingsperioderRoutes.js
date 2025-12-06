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

    const forestillingsperioder = await prisma.forestillingsperioder.findMany({
      where: {
        created_by: bruger_id
      },
      include: {
        oprettet_af: {
          select: {
            id: true,
            navn: true
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

// Opret ny forestillingsperiode
router.post('/', requireAuth, async (req, res) => {
  try {
    const { navn, start_dato, slut_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !start_dato || !slut_dato) {
      return res.status(400).json({ error: 'Navn, start dato og slut dato er påkrævet' });
    }

    // Tjek at slut_dato er efter start_dato
    if (new Date(slut_dato) < new Date(start_dato)) {
      return res.status(400).json({ error: 'Slutdato skal være efter startdato' });
    }

    // Opret forestillingsperiode
    const nyForestillingsperiode = await prisma.forestillingsperioder.create({
      data: {
        navn,
        start_dato: new Date(start_dato),
        slut_dato: new Date(slut_dato),
        created_by: bruger_id
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
    const { navn, start_dato, slut_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Hent eksisterende forestillingsperiode
    const eksisterende = await prisma.forestillingsperioder.findUnique({
      where: { id: parseInt(id) }
    });

    if (!eksisterende) {
      return res.status(404).json({ error: 'Forestillingsperiode ikke fundet' });
    }

    // Tjek om brugeren har oprettet perioden
    if (eksisterende.created_by !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at redigere denne periode' });
    }

    // Opdater forestillingsperiode
    const opdateret = await prisma.forestillingsperioder.update({
      where: { id: parseInt(id) },
      data: {
        ...(navn && { navn }),
        ...(start_dato && { start_dato: new Date(start_dato) }),
        ...(slut_dato && { slut_dato: new Date(slut_dato) })
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

    // Hent forestillingsperioden
    const forestillingsperiode = await prisma.forestillingsperioder.findUnique({
      where: { id: parseInt(id) }
    });

    if (!forestillingsperiode) {
      return res.status(404).json({ error: 'Forestillingsperiode ikke fundet' });
    }

    // Tjek om brugeren har oprettet perioden
    if (forestillingsperiode.created_by !== bruger_id) {
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
