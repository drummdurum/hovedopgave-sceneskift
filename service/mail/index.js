/**
 * Mail Service - Central export af alle mail funktioner
 * 
 * Struktur:
 * - mailClient.js       - Basis mail sending (Resend)
 * - passwordResetMail.js - Password reset emails
 * - reservationMail.js   - Reservation notifikationer
 */

const { sendMail } = require('./mailClient');
const { sendPasswordResetEmail } = require('./passwordResetMail');
const { sendReservationNotifikation, sendReservationBekraeftelse } = require('./reservationMail');

module.exports = {
  // Basis
  sendMail,
  
  // Password
  sendPasswordResetEmail,
  
  // Reservationer
  sendReservationNotifikation,
  sendReservationBekraeftelse
};
