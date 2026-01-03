const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');
const { 
  checkReservationOverlap,
  createReservation 
} = require('../../service/reservationService');

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

    // Hent reservationer for hver periode
    const perioderMedReservationer = await Promise.all(
      forestillingsperioder.map(async (periode) => {
        const reservationer = await prisma.reservationer.findMany({
          where: {
            laaner_id: bruger_id,
            fra_dato: periode.start_dato,
            til_dato: periode.slut_dato
          },
          include: {
            produkt: {
              select: {
                id: true,
                navn: true,
                billede_url: true
              }
            }
          }
        });

        return {
          ...periode,
          produkter: reservationer.map(r => ({
            produkt_id: r.produkt_id,
            produkt: r.produkt
          }))
        };
      })
    );

    res.json({ forestillingsperioder: perioderMedReservationer });
  } catch (error) {
    console.error('Fetch forestillingsperioder error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af forestillingsperioder' });
  }
});

// Opret ny forestillingsperiode
router.post('/', requireAuth, async (req, res) => {
  try {
    const { navn, start_dato, slut_dato, produkt_ids } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !start_dato || !slut_dato) {
      return res.status(400).json({ error: 'Navn, start dato og slut dato er påkrævet' });
    }

    // Tjek at slut_dato er efter start_dato
    if (new Date(slut_dato) < new Date(start_dato)) {
      return res.status(400).json({ error: 'Slutdato skal være efter startdato' });
    }

    // Hent bruger info
    const bruger = await prisma.brugere.findUnique({
      where: { id: bruger_id },
      select: { navn: true, teaternavn: true }
    });

    // Opret forestillingsperiode
    const nyForestillingsperiode = await prisma.forestillingsperioder.create({
      data: {
        navn,
        start_dato: new Date(start_dato),
        slut_dato: new Date(slut_dato),
        created_by: bruger_id
      }
    });

    // Hvis der er valgt produkter, opret reservationer
    const reservationer = [];
    const konflikter = [];
    if (produkt_ids && Array.isArray(produkt_ids) && produkt_ids.length > 0) {
      for (const produktId of produkt_ids) {
        // Tjek for overlappende reservationer
        const { hasOverlap, overlappingReservations } = await checkReservationOverlap(
          produktId, 
          start_dato, 
          slut_dato
        );

        if (hasOverlap) {
          // Hent produktnavn
          const produkt = await prisma.produkter.findUnique({
            where: { id: produktId },
            select: { navn: true }
          });
          konflikter.push({
            produktNavn: produkt?.navn || 'Ukendt produkt',
            reservationer: overlappingReservations
          });
        } else {
          // Opret reservation
          const reservation = await createReservation({
            produktId,
            laanerId: bruger_id,
            bruger: bruger.navn,
            teaternavn: bruger.teaternavn,
            startDato: start_dato,
            slutDato: slut_dato
          });
          reservationer.push(reservation);
        }
      }
    }

    res.status(201).json({
      message: 'Forestillingsperiode oprettet',
      forestillingsperiode: nyForestillingsperiode,
      reservationer: reservationer.length,
      konflikter: konflikter.length > 0 ? konflikter : undefined
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
    const { navn, start_dato, slut_dato, produkt_ids } = req.body;
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

    // Hent bruger info
    const bruger = await prisma.brugere.findUnique({
      where: { id: bruger_id },
      select: { navn: true, teaternavn: true }
    });

    // Brug de nye datoer hvis angivet, ellers behold eksisterende
    const fraDato = start_dato || eksisterende.start_dato;
    const tilDato = slut_dato || eksisterende.slut_dato;

    // Opdater forestillingsperiode
    const opdateret = await prisma.forestillingsperioder.update({
      where: { id: parseInt(id) },
      data: {
        ...(navn && { navn }),
        ...(start_dato && { start_dato: new Date(start_dato) }),
        ...(slut_dato && { slut_dato: new Date(slut_dato) })
      }
    });

    // Håndter produkter - hent eksisterende reservationer for denne bruger i perioden
    const eksisterendeReservationer = await prisma.reservationer.findMany({
      where: {
        laaner_id: bruger_id,
        fra_dato: eksisterende.start_dato,
        til_dato: eksisterende.slut_dato
      },
      select: { produkt_id: true, id: true }
    });

    const eksisterendeProduktIds = eksisterendeReservationer.map(r => r.produkt_id);
    const nyeProduktIds = produkt_ids || [];

    // Find produkter der skal tilføjes (nye minus eksisterende)
    const produkterAtTilfoeje = nyeProduktIds.filter(pid => !eksisterendeProduktIds.includes(pid));
    
    // Find produkter der skal fjernes (eksisterende minus nye)
    const produkterAtFjerne = eksisterendeProduktIds.filter(pid => !nyeProduktIds.includes(pid));

    // Slet reservationer for fjernede produkter
    if (produkterAtFjerne.length > 0) {
      const reservationerAtSlette = eksisterendeReservationer
        .filter(r => produkterAtFjerne.includes(r.produkt_id))
        .map(r => r.id);
      
      await prisma.reservationer.deleteMany({
        where: {
          id: { in: reservationerAtSlette }
        }
      });
    }

    // Opret reservationer for nye produkter
    const nyeReservationer = [];
    const konflikter = [];
    if (produkterAtTilfoeje.length > 0) {
      for (const produktId of produkterAtTilfoeje) {
        // Tjek for overlappende reservationer
        const { hasOverlap, overlappingReservations } = await checkReservationOverlap(
          produktId,
          fraDato,
          tilDato
        );

        if (hasOverlap) {
          const produkt = await prisma.produkter.findUnique({
            where: { id: produktId },
            select: { navn: true }
          });
          konflikter.push({
            produktNavn: produkt?.navn || 'Ukendt produkt',
            reservationer: overlappingReservations
          });
        } else {
          const reservation = await createReservation({
            produktId,
            laanerId: bruger_id,
            bruger: bruger.navn,
            teaternavn: bruger.teaternavn,
            startDato: fraDato,
            slutDato: tilDato
          });
          nyeReservationer.push(reservation);
        }
      }
    }

    res.json({
      message: 'Forestillingsperiode opdateret',
      forestillingsperiode: opdateret,
      tilfoejede: nyeReservationer.length,
      fjernede: produkterAtFjerne.length,
      konflikter: konflikter.length > 0 ? konflikter : undefined
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
