const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendReservationNotifikation, sendReservationBekraeftelse } = require('../../service/mail');
const { 
  checkReservationOverlap, 
  checkBulkReservationOverlap, 
  createReservation,
  createBulkReservations,
  getProduktsMedEjer,
  groupProdukterByEjer 
} = require('../../service/reservationService');

// ============= RESERVATIONER ROUTES =============

// Hent brugerens reservationer (produkter de skal hente)
router.get('/reservationer/mine/hente', requireAuth, async (req, res) => {
  try {
    const teaternavn = req.session.user.teaternavn;
    const now = new Date();

    const reservationer = await prisma.reservationer.findMany({
      where: { 
        teaternavn: teaternavn,
        til_dato: { gte: now },
        produkt: {
          paa_sceneskift: false  // Kun produkter der IKKE er på SceneSkift lager
        }
      },
      include: {
        produkt: {
          include: {
            ejer: {
              select: { id: true, teaternavn: true }
            }
          }
        }
      },
      orderBy: { fra_dato: 'asc' }
    });

    res.json({ reservationer, count: reservationer.length });
  } catch (error) {
    console.error('Fetch mine hente reservationer error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af reservationer' });
  }
});

// Hent reservationer på brugerens produkter (andre har reserveret)
router.get('/reservationer/mine/udlaant', requireAuth, async (req, res) => {
  try {
    const bruger_id = req.session.user.id;
    const now = new Date();

    const reservationer = await prisma.reservationer.findMany({
      where: { 
        produkt: {
          bruger_id: bruger_id,
          paa_sceneskift: false  // Kun produkter der IKKE er på SceneSkift lager
        },
        til_dato: { gte: now }
      },
      include: {
        produkt: {
          select: { id: true, navn: true, billede_url: true }
        }
      },
      orderBy: { fra_dato: 'asc' }
    });

    res.json({ reservationer, count: reservationer.length });
  } catch (error) {
    console.error('Fetch mine udlaant reservationer error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved hentning af reservationer' });
  }
});

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
    const produktId = parseInt(produkt_id);

    // Valider input
    if (!fra_dato || !til_dato) {
      return res.status(400).json({ error: 'Fra_dato og til_dato er påkrævet' });
    }

    // Tjek om produkt eksisterer
    const produkt = await prisma.produkter.findUnique({
      where: { id: produktId }
    });

    if (!produkt) {
      return res.status(404).json({ error: 'Produkt ikke fundet' });
    }

    // Tjek for overlappende reservationer
    const { hasOverlap, overlappingReservations } = await checkReservationOverlap(produktId, fra_dato, til_dato);
    
    if (hasOverlap) {
      const konfliktPerioder = overlappingReservations.map(r => {
        const fra = new Date(r.fra_dato).toLocaleDateString('da-DK');
        const til = new Date(r.til_dato).toLocaleDateString('da-DK');
        return `${fra} - ${til} (${r.teaternavn})`;
      }).join(', ');
      
      return res.status(409).json({ 
        error: 'Produktet er allerede reserveret i denne periode',
        konflikter: overlappingReservations,
        besked: `Eksisterende reservationer: ${konfliktPerioder}`
      });
    }

    const nyReservation = await createReservation({
      produktId,
      bruger,
      teaternavn,
      startDato: fra_dato,
      slutDato: til_dato
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

    const produktIdsParsed = produkt_ids.map(id => parseInt(id));

    // Tjek om produkterne eksisterer 
    const produkter = await getProduktsMedEjer(produktIdsParsed);

    if (produkter.length !== produkt_ids.length) {
      return res.status(404).json({ error: 'Et eller flere produkter blev ikke fundet' });
    }

    // Tjek for overlappende reservationer
    const { hasOverlap, conflicts } = await checkBulkReservationOverlap(produktIdsParsed, start_dato, slut_dato);
    
    if (hasOverlap) {
      const konfliktBeskeder = conflicts.map(c => {
        const perioder = c.reservationer.map(r => {
          const fra = new Date(r.fra_dato).toLocaleDateString('da-DK');
          const til = new Date(r.til_dato).toLocaleDateString('da-DK');
          return `${fra} - ${til} (${r.teaternavn})`;
        }).join('; ');
        return `"${c.produktNavn}": ${perioder}`;
      }).join('\n');
      
      return res.status(409).json({ 
        error: 'Et eller flere produkter er allerede reserveret i denne periode',
        konflikter: conflicts,
        besked: konfliktBeskeder
      });
    }

    // Opret reservationer for alle produkter
    const reservationer = await createBulkReservations(
      produktIdsParsed, 
      bruger, 
      teaternavn, 
      start_dato, 
      slut_dato
    );

    // Gruppér produkter efter ejer for at sende mails
    const produkterPrEjer = groupProdukterByEjer(produkter);

    // Hent brugerens email til bekræftelse
    const brugerData = await prisma.brugere.findUnique({
      where: { id: bruger_id },
      select: { email: true, navn: true }
    });

    // Hent base URL
    const baseUrl = process.env.BASE_URL || 'https://sceneskift.nu';

    // Send mail til hver ejer (async, fejler ikke reservationen)
    const mailPromises = Object.values(produkterPrEjer).map(async ({ ejer, produkter: ejerProdukter }) => {
      try {
        await sendReservationNotifikation({
          ejerEmail: ejer.email,
          ejerNavn: ejer.navn,
          reserveretAf: bruger,
          teaterNavn: teaternavn,
          produkter: ejerProdukter,
          fraDato: start_dato,
          tilDato: slut_dato,
          baseUrl
        });
      } catch (mailError) {
        console.error(`Fejl ved afsendelse af mail til ejer ${ejer.email}:`, mailError);
      }
    });

    // Send bekræftelse til brugeren
    if (brugerData?.email) {
      mailPromises.push(
        sendReservationBekraeftelse({
          brugerEmail: brugerData.email,
          brugerNavn: brugerData.navn,
          produkter: produkter.map(p => ({
            navn: p.navn,
            ejerNavn: p.ejer.teaternavn
          })),
          fraDato: start_dato,
          tilDato: slut_dato,
          baseUrl
        }).catch(err => console.error('Fejl ved bekræftelsesmail:', err))
      );
    }

    // Vent på alle mails (men fejl stopper ikke response)
    Promise.all(mailPromises).catch(err => console.error('Mail errors:', err));

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
