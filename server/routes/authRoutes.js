const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../../database/prisma');
const { redirectIfAuthenticated, requireAuth } = require('../middleware/auth');
const { sendRegistrationEmails } = require('../../service/mail/registrationMailService');

// Register ny bruger
router.post('/register', async (req, res) => {
  try {
    const { password, navn, teaternavn, lokation, email, features } = req.body;

    // Valider input
    if (!password || !navn || !teaternavn || !lokation || !email) {
      return res.status(400).json({ error: 'Alle felter er påkrævet' });
    }

    // Tjek om email allerede eksisterer
    const existingUser = await prisma.brugere.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email er allerede i brug' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Opret ny bruger
    const newUser = await prisma.brugere.create({
      data: {
        password: hashedPassword,
        navn,
        teaternavn,
        lokation,
        email,
        features: features === true || features === 'true'
      }
    });

    // Gem bruger i session (uden password)
    req.session.user = {
      id: newUser.id,
      navn: newUser.navn,
      teaternavn: newUser.teaternavn,
      lokation: newUser.lokation,
      email: newUser.email,
      features: newUser.features,
      godkendt: newUser.godkendt,
      rolle: newUser.rolle
    };

    // Send velkomst-email til bruger og notifikation til admin
    sendRegistrationEmails({
      navn,
      teaternavn,
      lokation,
      email,
      features: features === true || features === 'true'
    });

    res.status(201).json({ 
      message: 'Bruger oprettet succesfuldt',
      user: req.session.user 
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      error: 'Der opstod en fejl ved registrering',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Valider input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email og password er påkrævet' });
    }

    // Find bruger via email
    const user = await prisma.brugere.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Forkert email eller password' });
    }

    // Verificer password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Forkert email eller password' });
    }

    // Gem bruger i session (uden password)
    req.session.user = {
      id: user.id,
      navn: user.navn,
      teaternavn: user.teaternavn,
      lokation: user.lokation,
      email: user.email,
      features: user.features,
      godkendt: user.godkendt,
      rolle: user.rolle
    };

    res.json({ 
      message: 'Login succesfuldt',
      user: req.session.user 
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Der opstod en fejl ved login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Opdater profil
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { navn, teaternavn, lokation, email } = req.body;
    const bruger_id = req.session.user.id;

    // Valider input
    if (!navn || !teaternavn || !lokation || !email) {
      return res.status(400).json({ error: 'Alle felter er påkrævet' });
    }

    // Tjek om email allerede bruges af en anden bruger
    const existingUser = await prisma.brugere.findFirst({
      where: {
        email: email,
        NOT: { id: bruger_id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email er allerede i brug af en anden bruger' });
    }

    // Opdater bruger
    const updatedUser = await prisma.brugere.update({
      where: { id: bruger_id },
      data: { navn, teaternavn, lokation, email }
    });

    // Opdater session
    req.session.user = {
      ...req.session.user,
      navn: updatedUser.navn,
      teaternavn: updatedUser.teaternavn,
      lokation: updatedUser.lokation,
      email: updatedUser.email
    };

    res.json({ 
      message: 'Profil opdateret',
      user: req.session.user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved opdatering af profil' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Der opstod en fejl ved logout' });
    }
    res.json({ message: 'Logout succesfuldt' });
  });
});

// Logout GET route (for direkte links)
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Hent nuværende bruger (hvis logget ind)
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Ikke logget ind' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
