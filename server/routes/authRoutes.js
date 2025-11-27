const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../../database/prisma');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Register ny bruger
router.post('/register', async (req, res) => {
  try {
    const { brugernavn, password, navn, teaternavn, lokation, email, features } = req.body;

    // Valider input
    if (!brugernavn || !password || !navn || !teaternavn || !lokation || !email) {
      return res.status(400).json({ error: 'Alle felter er påkrævet' });
    }

    // Tjek om bruger allerede eksisterer
    const existingUser = await prisma.brugere.findFirst({
      where: {
        OR: [
          { brugernavn: brugernavn },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Brugernavn eller email er allerede i brug' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Opret ny bruger
    const newUser = await prisma.brugere.create({
      data: {
        brugernavn,
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
      brugernavn: newUser.brugernavn,
      navn: newUser.navn,
      teaternavn: newUser.teaternavn,
      lokation: newUser.lokation,
      email: newUser.email,
      features: newUser.features
    };

    res.status(201).json({ 
      message: 'Bruger oprettet succesfuldt',
      user: req.session.user 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved registrering' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { brugernavn, password } = req.body;

    // Valider input
    if (!brugernavn || !password) {
      return res.status(400).json({ error: 'Brugernavn og password er påkrævet' });
    }

    // Find bruger
    const user = await prisma.brugere.findUnique({
      where: { brugernavn }
    });

    if (!user) {
      return res.status(401).json({ error: 'Forkert brugernavn eller password' });
    }

    // Verificer password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Forkert brugernavn eller password' });
    }

    // Gem bruger i session (uden password)
    req.session.user = {
      id: user.id,
      brugernavn: user.brugernavn,
      navn: user.navn,
      teaternavn: user.teaternavn,
      lokation: user.lokation,
      email: user.email,
      features: user.features
    };

    res.json({ 
      message: 'Login succesfuldt',
      user: req.session.user 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved login' });
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

// Hent nuværende bruger (hvis logget ind)
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Ikke logget ind' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
