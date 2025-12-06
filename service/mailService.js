/**
 * Mail Service - Re-export fra ny struktur
 * 
 * OBS: Denne fil eksisterer for bagudkompatibilitet.
 * Brug helst: require('./mail') eller require('./mail/reservationMail') etc.
 * 
 * Ny struktur:
 * - service/mail/mailClient.js       - Basis mail sending
 * - service/mail/passwordResetMail.js - Password reset emails
 * - service/mail/reservationMail.js   - Reservation notifikationer
 * - service/mail/index.js             - Central export
 */

module.exports = require('./mail');

