const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');
const { sendApprovalEmail } = require('../../service/mail/registrationMailService');

// Middleware til at tjekke admin rolle
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Ikke logget ind' });
  }
  if (req.session.user.rolle !== 'admin') {
    return res.status(403).json({ error: 'Kun administratorer har adgang' });
  }
  next();
};

// Hent alle brugere
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.brugere.findMany({
      select: {
        id: true,
        navn: true,
        teaternavn: true,
        lokation: true,
        email: true,
        features: true,
        godkendt: true,
        rolle: true
      },
      orderBy: [
        { godkendt: 'asc' },
        { id: 'desc' }
      ]
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Godkend en bruger
router.post('/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.brugere.update({
      where: { id: parseInt(id) },
      data: { godkendt: true }
    });

    // Send godkendelses-email til brugeren
    sendApprovalEmail({
      navn: user.navn,
      teaternavn: user.teaternavn,
      email: user.email
    });

    res.json({ 
      message: 'Bruger godkendt',
      user: {
        id: user.id,
        navn: user.navn,
        godkendt: user.godkendt
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});


// Slet/afvis en bruger
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Sørg for at admin ikke kan slette sig selv
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({ error: 'Du kan ikke slette dig selv' });
    }

    await prisma.brugere.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Bruger slettet' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent antal produkter på hovedlager (Sceneskifts lager)
router.get('/hovedlager/count', requireAuth, requireAdmin, async (req, res) => {
  try {
    const count = await prisma.produkter.count({
      where: { paa_sceneskift: true }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error counting hovedlager:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent alle produkter på hovedlager
router.get('/hovedlager', requireAuth, requireAdmin, async (req, res) => {
  try {
    const produkter = await prisma.produkter.findMany({
      where: { paa_sceneskift: true },
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
      },
      orderBy: { id: 'desc' }
    });

    const transformedProdukter = produkter.map(p => ({
      ...p,
      kategorier: p.kategorier.map(pk => pk.kategori.navn),
      billeder: p.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
    }));

    res.json({ produkter: transformedProdukter });
  } catch (error) {
    console.error('Error fetching hovedlager:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent antal produkter på lager med aktive reservationer
router.get('/lager-reservationer/count', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const count = await prisma.produkter.count({
      where: {
        paa_sceneskift: true,
        reservationer: {
          some: {
            til_dato: { gte: now }
          }
        }
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error counting lager-reservationer:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent alle produkter på lager med aktive reservationer
router.get('/lager-reservationer', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const produkter = await prisma.produkter.findMany({
      where: {
        paa_sceneskift: true,
        reservationer: {
          some: {
            til_dato: { gte: now }
          }
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
        reservationer: {
          where: {
            til_dato: { gte: now }
          },
          include: {
            laaner: {
              select: {
                id: true,
                navn: true,
                teaternavn: true
              }
            }
          },
          orderBy: { fra_dato: 'asc' }
        },
        billeder: {
          orderBy: { position: 'asc' },
          take: 1
        }
      },
      orderBy: { id: 'desc' }
    });

    const transformedProdukter = produkter.map(p => ({
      ...p,
      billeder: p.billeder.map(b => ({ id: b.id, url: b.billede_url, position: b.position }))
    }));

    res.json({ produkter: transformedProdukter });
  } catch (error) {
    console.error('Error fetching lager-reservationer:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent antal kommende reservationer
router.get('/reservationer/count', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const count = await prisma.reservationer.count({
      where: {
        fra_dato: { gte: now }
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error counting reservationer:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

// Hent alle kommende reservationer
router.get('/reservationer', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const reservationer = await prisma.reservationer.findMany({
      where: {
        fra_dato: { gte: now }
      },
      include: {
        produkt: {
          include: {
            ejer: {
              select: {
                id: true,
                navn: true,
                teaternavn: true
              }
            },
            billeder: {
              orderBy: { position: 'asc' },
              take: 1
            }
          }
        }
      },
      orderBy: { fra_dato: 'asc' }
    });

    res.json({ reservationer });
  } catch (error) {
    console.error('Error fetching reservationer:', error);
    res.status(500).json({ error: 'Der opstod en fejl' });
  }
});

module.exports = router;
