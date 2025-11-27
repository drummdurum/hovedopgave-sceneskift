const express = require('express');
const router = express.Router();

// Forside
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Forside',
    message: 'Velkommen til din Node.js + Express + EJS app!' 
  });
});

// Eksempel på en anden side
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'Om os' 
  });
});

module.exports = router;
