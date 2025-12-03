const nodemailer = require('nodemailer');

// Opret transporter med Gmail via SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  // Timeout settings for cloud environments
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Verificer transporter ved opstart (ikke-blokerende)
transporter.verify((error, success) => {
  if (error) {
    console.error('Mail transporter fejl:', error.message);
  } else {
    console.log('Mail server er klar til at sende emails');
  }
});

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
    const mailOptions = {
      from: `"SceneSkift" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sendt:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Fejl ved afsendelse af email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - Brugerens email
 * @param {string} resetToken - Reset token
 * @param {string} baseUrl - Base URL til applikationen
 */
async function sendPasswordResetEmail(email, resetToken, baseUrl) {
  const resetUrl = `${baseUrl}/nulstil-adgangskode/${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8A0517; margin: 0; font-size: 28px;">SceneSkift</h1>
          <div style="width: 60px; height: 3px; background-color: #D4AF37; margin: 15px auto;"></div>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Nulstil din adgangskode</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Vi har modtaget en anmodning om at nulstille din adgangskode til din SceneSkift konto.
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          Klik på knappen nedenfor for at oprette en ny adgangskode:
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" 
             style="background-color: #8A0517; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Nulstil adgangskode
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Hvis knappen ikke virker, kan du kopiere og indsætte dette link i din browser:
        </p>
        <p style="color: #8A0517; word-break: break-all; font-size: 14px;">
          ${resetUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; line-height: 1.6;">
          <strong>Bemærk:</strong> Dette link udløber om 1 time af sikkerhedsmæssige årsager.
        </p>
        
        <p style="color: #999; font-size: 12px; line-height: 1.6;">
          Hvis du ikke har anmodet om at nulstille din adgangskode, kan du ignorere denne email. 
          Din konto er stadig sikker.
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} SceneSkift. Alle rettigheder forbeholdes.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Nulstil din adgangskode - SceneSkift

Vi har modtaget en anmodning om at nulstille din adgangskode til din SceneSkift konto.

Klik på linket nedenfor for at oprette en ny adgangskode:
${resetUrl}

Bemærk: Dette link udløber om 1 time af sikkerhedsmæssige årsager.

Hvis du ikke har anmodet om at nulstille din adgangskode, kan du ignorere denne email.
Din konto er stadig sikker.

© ${new Date().getFullYear()} SceneSkift
  `;

  return sendMail({
    to: email,
    subject: 'Nulstil din adgangskode - SceneSkift',
    text,
    html
  });
}

module.exports = {
  sendMail,
  sendPasswordResetEmail
};
