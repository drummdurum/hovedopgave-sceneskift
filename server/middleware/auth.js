// Middleware til at beskytte routes der kræver login
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Du skal være logget ind for at tilgå denne ressource' });
  }
  next();
}

// Middleware til at tjekke om bruger allerede er logget ind
function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated
};
