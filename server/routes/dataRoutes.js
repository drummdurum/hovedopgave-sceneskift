const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');

// ============= RESERVATIONER ROUTES =============

// Hent alle reservationer for et produkt
router.get('/produkt/:produkt_id/reservationer', async (req, res) => {
  try {
    const { produkt_id } = req.params;

    const reservationer = await prisma.reservationer.findMany({
      where: { produkt_id: parseInt(produkt_id) },
      orderBy: {
        fra_dato: 'asc'
      }
    });

    res.json({ reservationer });
  } catch (error) {
    console.error('Fetch reservationer error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af reservationer' });
  }
});

// Hent en enkelt reservation
router.get('/reservationer/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservationer.findUnique({
      where: { id: parseInt(id) },
      include: {
        produkt: {
          include: {
            ejer: {
              select: {
                id: true,
                navn: true,
                teaternavn: true
              }
            }
          }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation ikke fundet' });
    }

    res.json({ reservation });
  } catch (error) {
    console.error('Fetch reservation error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af reservation' });
  }
});

// Opret ny reservation (kræver login)
router.post('/produkt/:produkt_id/reservationer', requireAuth, async (req, res) => {
  try {
    const { produkt_id } = req.params;
    const { fra_dato, til_dato } = req.body;
    const bruger = req.session.user.navn;
    const teaternavn = req.session.user.teaternavn;

    // Valider input
    if (!fra_dato || !til_dato) {
      return res.status(400).json({ error: 'Fra_dato og til_dato er påkrævet' });
    }

    // Tjek om produkt eksisterer
    const produkt = await prisma.produkter.findUnique({
      where: { id: parseInt(produkt_id) }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    const nyReservation = await prisma.reservationer.create({
      data: {
        bruger,
        teaternavn,
        fra_dato: new Date(fra_dato),
        til_dato: new Date(til_dato),
        produkt_id: parseInt(produkt_id)
      }
    });

    res.status(201).json({ 
      message: 'Reservation oprettet succesfuldt',
      reservation: nyReservation 
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved oprettelse af reservation' });
  }
});

// Bulk opret reservationer for flere produkter (kræver login)
router.post('/reservationer/bulk', requireAuth, async (req, res) => {
  try {
    const { produkt_ids, start_dato, slut_dato, forestillingsperiode_id } = req.body;
    const bruger = req.session.user.navn;
    const teaternavn = req.session.user.teaternavn;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!produkt_ids || !Array.isArray(produkt_ids) || produkt_ids.length === 0) {
      return res.status(400).json({ error: 'Ingen produkter valgt' });
    }

    if (!start_dato || !slut_dato) {
      return res.status(400).json({ error: 'Fra_dato og til_dato er påkrævet' });
    }

    // Tjek om produkterne eksisterer og at bruger ikke reserverer egne produkter
    const produkter = await prisma.produkter.findMany({
      where: { id: { in: produkt_ids.map(id => parseInt(id)) } },
      include: { ejer: { select: { id: true, teaternavn: true, email: true } } }
    });

    if (produkter.length !== produkt_ids.length) {
      return res.status(404).json({ error: 'Et eller flere produkter blev ikke fundet' });
    }

    // Opret reservationer for alle produkter
    const reservationer = await Promise.all(
      produkter.map(produkt => 
        prisma.reservationer.create({
          data: {
            bruger,
            teaternavn,
            fra_dato: new Date(start_dato),
            til_dato: new Date(slut_dato),
            produkt_id: produkt.id
          }
        })
      )
    );

    // Gruppér produkter efter ejer for at sende samlet besked
    const produkterPrEjer = produkter.reduce((acc, produkt) => {
      const ejerId = produkt.ejer.id;
      if (!acc[ejerId]) {
        acc[ejerId] = {
          ejer: produkt.ejer,
          produkter: []
        };
      }
      acc[ejerId].produkter.push(produkt.navn);
      return acc;
    }, {});

    res.status(201).json({ 
      message: `${reservationer.length} reservationer oprettet succesfuldt`,
      reservationer,
      antalEjere: Object.keys(produkterPrEjer).length
    });

  } catch (error) {
    console.error('Bulk create reservation error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved oprettelse af reservationer' });
  }
});

// Opdater reservation (kun ejer af produkt kan opdatere)
router.put('/reservationer/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { bruger, teaternavn, fra_dato, til_dato } = req.body;
    const bruger_id = req.session.user.id;

    // Tjek om reservation eksisterer
    const reservation = await prisma.reservationer.findUnique({
      where: { id: parseInt(id) },
      include: { produkt: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation ikke fundet' });
    }

    // Kun ejer af produkt kan opdatere reservation
    if (reservation.produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at opdatere denne reservation' });
    }

    const updateData = {};
    if (bruger) updateData.bruger = bruger;
    if (teaternavn) updateData.teaternavn = teaternavn;
    if (fra_dato) updateData.fra_dato = new Date(fra_dato);
    if (til_dato) updateData.til_dato = new Date(til_dato);

    const opdateretReservation = await prisma.reservationer.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ 
      message: 'Reservation opdateret succesfuldt',
      reservation: opdateretReservation 
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved opdatering af reservation' });
  }
});

// Slet reservation (kun ejer af produkt kan slette)
router.delete('/reservationer/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const bruger_id = req.session.user.id;

    // Tjek om reservation eksisterer
    const reservation = await prisma.reservationer.findUnique({
      where: { id: parseInt(id) },
      include: { produkt: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation ikke fundet' });
    }

    // Kun ejer af produkt kan slette reservation
    if (reservation.produkt.bruger_id !== bruger_id) {
      return res.status(403).json({ error: 'Du har ikke tilladelse til at slette denne reservation' });
    }

    await prisma.reservationer.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Reservation slettet succesfuldt' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved sletning af reservation' });
  }
});

module.exports = router;
