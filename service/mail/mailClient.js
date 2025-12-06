const { Resend } = require('resend');

// Opret Resend client
const resend = new Resend(process.env.MAILAPI_KEY);

console.log('Resend mail client initialiseret');

/**
 * Sleep funktion til rate limiting
 * @param {number} ms - Millisekunder at vente
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mail queue til rate limiting
let mailQueue = Promise.resolve();
const DELAY_BETWEEN_MAILS = 1000; // 1 sekund mellem mails (Resend tillader 2/sek)

/**
 * Send en email med rate limiting
 * @param {Object} options - Email options
 * @param {string} options.to - Modtagers email
 * @param {string} options.subject - Email emne
 * @param {string} options.text - Plain text indhold
 * @param {string} options.html - HTML indhold
 */
async function sendMail({ to, subject, text, html }) {
  // Tilføj til queue for at undgå rate limiting
  mailQueue = mailQueue.then(async () => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'SceneSkift <noreply@sceneskift.nu>',
        to: [to],
        subject,
        text,
        html
      });

      if (error) {
        console.error('Fejl ved afsendelse af email:', error);
        throw new Error(error.message);
      }

      console.log('Email sendt til:', to, '- ID:', data.id);
      
      // Vent mellem mails for at undgå rate limiting
      await sleep(DELAY_BETWEEN_MAILS);
      
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Fejl ved afsendelse af email til', to, ':', error.message);
      // Vent alligevel så næste mail ikke også fejler
      await sleep(DELAY_BETWEEN_MAILS);
      throw error;
    }
  });

  return mailQueue;
}

module.exports = { sendMail };
