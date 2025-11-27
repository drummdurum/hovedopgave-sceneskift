require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL pool til sessions
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set EJS som view engine
app.set('view engine', 'ejs');

// Sæt views-mappen til at pege på public/compentens/view
app.set('views', path.join(__dirname, 'public', 'compentens', 'view'));

// Statisk mappe: public/
app.use(express.static(path.join(__dirname, 'public')));

// Statisk mappe for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware til at parse JSON og URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware med PostgreSQL store
app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'Session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dage
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Kun HTTPS i produktion
    },
  })
);

// Middleware til at gøre bruger tilgængelig i alle views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Importer routes
const mainRoutes = require('./server/routes/mainRoutes');
const authRoutes = require('./server/routes/authRoutes');
const produkterRoutes = require('./server/routes/produkterRoutes');
const dataRoutes = require('./server/routes/dataRoutes');

// Brug routes
app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/produkter', produkterRoutes);
app.use('/api', dataRoutes);

// Start serveren
app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});

module.exports = app;
