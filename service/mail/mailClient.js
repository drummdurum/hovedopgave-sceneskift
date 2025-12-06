const { Resend } = require('resend');

// Opret Resend client
const resend = new Resend(process.env.MAILAPI_KEY);

console.log('Resend mail client initialiseret');

/**
 * Send en email
 * @param {Object} options - Email options
 * @param {string} options.to - Modtagers email
 * @param {string} options.subject - Email emne
 * @param {string} options.text - Plain text indhold
 * @param {string} options.html - HTML indhold
 */
async function sendMail({ to, subject, text, html }) {
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
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Fejl ved afsendelse af email:', error);
    throw error;
  }
}

module.exports = { sendMail };
