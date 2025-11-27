const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS som view engine
app.set('view engine', 'ejs');

// Sæt views-mappen til at pege på public/compentens/view
app.set('views', path.join(__dirname, 'public', 'compentens', 'view'));

// Statisk mappe: public/
app.use(express.static(path.join(__dirname, 'public')));

// Middleware til at parse JSON og URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importer routes
const mainRoutes = require('./server/routes/mainRoutes');

// Brug routes
app.use('/', mainRoutes);

// Start serveren
app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});

module.exports = app;
