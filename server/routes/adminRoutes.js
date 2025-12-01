const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { requireAuth } = require('../middleware/auth');

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
        brugernavn: true,
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

// Gør en bruger til admin
router.post('/users/:id/make-admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.brugere.update({
      where: { id: parseInt(id) },
      data: { rolle: 'admin', godkendt: true }
    });

    res.json({ 
      message: 'Bruger er nu admin',
      user: {
        id: user.id,
        navn: user.navn,
        rolle: user.rolle
      }
    });
  } catch (error) {
    console.error('Error making user admin:', error);
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

module.exports = router;
