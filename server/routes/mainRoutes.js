const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');

// Forside
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Forside',
    message: 'Velkommen til din Node.js + Express + EJS app!',
    user: req.session.user || null
  });
});

// Om os side
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'Om os',
    user: req.session.user || null
  });
});

// Login side
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { 
    title: 'Log ind',
    user: null
  });
});

// Register side
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', { 
    title: 'Opret konto',
    user: null
  });
});

// Profil side (kræver login)
router.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { 
    title: 'Min profil',
    user: req.session.user
  });
});

// Admin side (kræver login - rollen tjekkes i viewet)
router.get('/admin', requireAuth, (req, res) => {
  res.render('admin', { 
    title: 'Admin',
    user: req.session.user
  });
});

// Rekvisitter side (alle kan se)
router.get('/rekvisitter', (req, res) => {
  res.render('rekvisitter', { 
    title: 'Rekvisitter',
    user: req.session.user || null
  });
});

// Forestillingsperioder side (kræver login)
router.get('/forestillingsperioder', requireAuth, (req, res) => {
  res.render('forestillingsperioder', { 
    title: 'Mine forestillingsperioder',
    user: req.session.user
  });
});

// Glemt adgangskode side
router.get('/glemt-adgangskode', redirectIfAuthenticated, (req, res) => {
  res.render('glemt-adgangskode', { 
    title: 'Glemt adgangskode',
    user: null
  });
});

// Nulstil adgangskode side (med token)
router.get('/nulstil-adgangskode/:token', redirectIfAuthenticated, (req, res) => {
  res.render('nulstil-adgangskode', { 
    title: 'Nulstil adgangskode',
    user: null,
    token: req.params.token
  });
});

// Admin - Hovedlager side
router.get('/admin/hovedlager', requireAuth, (req, res) => {
  if (req.session.user.rolle !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin-hovedlager', { 
    title: 'Produkter på hovedlager',
    user: req.session.user
  });
});

// Admin - Reservationer side
router.get('/admin/reservationer', requireAuth, (req, res) => {
  if (req.session.user.rolle !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin-reservationer', { 
    title: 'Kommende reservationer',
    user: req.session.user
  });
});

// Admin - Lager reservationer side
router.get('/admin/lager-reservationer', requireAuth, (req, res) => {
  if (req.session.user.rolle !== 'admin') {
    return res.redirect('/');
  }
  res.render('admin-lager-reservationer', { 
    title: 'Reserverede produkter på lager',
    user: req.session.user
  });
});

// Mine reservationer - Produkter jeg skal hente
router.get('/mine-reservationer/hente', requireAuth, (req, res) => {
  res.render('mine-reservationer-hente', { 
    title: 'Produkter jeg skal hente',
    user: req.session.user
  });
});

// Mine reservationer - Mine produkter der er reserveret
router.get('/mine-reservationer/udlaant', requireAuth, (req, res) => {
  res.render('mine-reservationer-udlaant', { 
    title: 'Mine produkter der er reserveret',
    user: req.session.user
  });
});

// Produkt detalje side (enkelt rekvisit)
router.get('/rekvisitter/:id', (req, res) => {
  const produktId = parseInt(req.params.id);
  
  if (isNaN(produktId)) {
    return res.redirect('/rekvisitter');
  }
  
  res.render('produkt-detalje', { 
    title: 'Rekvisit',
    user: req.session.user || null,
    produktId: produktId
  });
});

module.exports = router;
