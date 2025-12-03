const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../../database/prisma');
const { sendPasswordResetEmail } = require('../../service/mailService');

// Anmod om password reset
router.post('/glemt-adgangskode', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email er påkrævet' });
    }

    // Find bruger med email
    const user = await prisma.brugere.findUnique({
      where: { email }
    });

    // Svar altid positivt for at undgå email enumeration
    if (!user) {
      return res.json({ 
        message: 'Hvis emailen er registreret, vil du modtage et link til at nulstille din adgangskode.' 
      });
    }

    // Generer token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 time

    // Invalider tidligere tokens for denne email
    await prisma.passwordReset.updateMany({
      where: { 
        email,
        used: false 
      },
      data: { used: true }
    });

    // Opret nyt password reset token
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expires_at: expiresAt
      }
    });

    // Send email
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    await sendPasswordResetEmail(email, token, baseUrl);

    res.json({ 
      message: 'Hvis emailen er registreret, vil du modtage et link til at nulstille din adgangskode.' 
    });

  } catch (error) {
    console.error('Glemt adgangskode fejl:', error);
    res.status(500).json({ 
      error: 'Der opstod en fejl. Prøv igen senere.' 
    });
  }
});

// Verificer token (bruges når brugeren klikker på linket)
router.get('/verificer-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Ugyldigt link' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Dette link er allerede blevet brugt' });
    }

    if (new Date() > resetRecord.expires_at) {
      return res.status(400).json({ error: 'Dette link er udløbet. Anmod om et nyt.' });
    }

    res.json({ valid: true, email: resetRecord.email });

  } catch (error) {
    console.error('Token verifikation fejl:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved verificering af linket' });
  }
});

// Nulstil adgangskode
router.post('/nulstil-adgangskode', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token og password er påkrævet' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Adgangskoden skal være mindst 6 tegn' });
    }

    // Find og valider token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Ugyldigt link' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Dette link er allerede blevet brugt' });
    }

    if (new Date() > resetRecord.expires_at) {
      return res.status(400).json({ error: 'Dette link er udløbet. Anmod om et nyt.' });
    }

    // Hash nyt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Opdater brugerens password
    await prisma.brugere.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword }
    });

    // Marker token som brugt
    await prisma.passwordReset.update({
      where: { token },
      data: { used: true }
    });

    res.json({ message: 'Din adgangskode er blevet nulstillet. Du kan nu logge ind.' });

  } catch (error) {
    console.error('Nulstil adgangskode fejl:', error);
    res.status(500).json({ error: 'Der opstod en fejl ved nulstilling af adgangskoden' });
  }
});

module.exports = router;
