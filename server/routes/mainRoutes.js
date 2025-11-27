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

module.exports = router;
