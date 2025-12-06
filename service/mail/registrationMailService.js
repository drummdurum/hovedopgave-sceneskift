const { sendMail } = require('./mailClient');
const prisma = require('../../database/prisma');

/**
 * Hent admin email fra databasen (bruger id 2)
 */
async function getAdminEmail() {
  try {
    const admin = await prisma.brugere.findUnique({
      where: { id: 2 },
      select: { email: true }
    });
    return admin?.email || null;
  } catch (error) {
    console.error('Kunne ikke hente admin email:', error);
    return null;
  }
}

/**
 * Send velkomst-email til ny bruger
 * @param {Object} user - Brugeroplysninger
 */
async function sendWelcomeEmail(user) {
  const { navn, teaternavn, lokation, email } = user;
  
  try {
    await sendMail({
      to: email,
      subject: 'Velkommen til SceneSkift! 🎭',
      text: `Hej ${navn},\n\nTak for din oprettelse på SceneSkift!\n\nDin konto er nu oprettet, men afventer godkendelse fra SceneSkift. Vi gennemgår din ansøgning hurtigst muligt, og du vil modtage en besked, når din konto er aktiveret.\n\nI mellemtiden kan du logge ind og udforske platformen.\n\nDine oplysninger:\n- Navn: ${navn}\n- Teater: ${teaternavn}\n- Lokation: ${lokation}\n- Email: ${email}\n\nHar du spørgsmål? Kontakt os på info@sceneskift.nu\n\nVenlig hilsen,\nSceneSkift`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🎭 SceneSkift</h1>
          </div>
          
          <h2 style="color: #1e40af;">Velkommen, ${navn}!</h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Tak for din oprettelse på SceneSkift – platformen for deling af teaterrekvisitter!
          </p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #92400e; margin: 0;">
              <strong>⏳ Afventer godkendelse</strong><br>
              Din konto er oprettet, men afventer godkendelse fra SceneSkift. Vi gennemgår din ansøgning hurtigst muligt og kontakter dig, når din konto er aktiveret.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Dine oplysninger:</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>Navn:</strong> ${navn}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Teater:</strong> ${teaternavn}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Lokation:</strong> ${lokation}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${email}</p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            Har du spørgsmål? Kontakt os på <a href="mailto:info@sceneskift.nu" style="color: #2563eb;">info@sceneskift.nu</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Venlig hilsen,<br>
            <strong>SceneSkift</strong>
          </p>
        </div>
      `
    });
    console.log('Velkomst-email sendt til:', email);
  } catch (error) {
    console.error('Kunne ikke sende velkomst-email:', error);
  }
}

/**
 * Send notifikation til admin om ny bruger
 * @param {Object} user - Brugeroplysninger
 */
async function sendAdminNotification(user) {
  const { navn, teaternavn, lokation, email, features } = user;
  
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    console.error('Ingen admin email fundet - kunne ikke sende notifikation');
    return;
  }
  
  try {
    await sendMail({
      to: adminEmail,
      subject: `Ny bruger oprettet: ${teaternavn} 🆕`,
      text: `En ny bruger har oprettet sig på SceneSkift!\n\nBrugeroplysninger:\n- Navn: ${navn}\n- Teater: ${teaternavn}\n- Lokation: ${lokation}\n- Email: ${email}\n- Ønsker features: ${features ? 'Ja' : 'Nej'}\n\nLog ind på admin-panelet for at godkende brugeren:\nhttps://sceneskift.nu/admin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🎭 SceneSkift Admin</h1>
          </div>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h2 style="color: #1e40af; margin: 0;">🆕 Ny bruger oprettet!</h2>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Brugeroplysninger:</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>Navn:</strong> ${navn}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Teater:</strong> ${teaternavn}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Lokation:</strong> ${lokation}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb;">${email}</a></p>
            <p style="margin: 8px 0; color: #374151;"><strong>Ønsker features:</strong> ${features ? 'Ja ✅' : 'Nej ❌'}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sceneskift.nu/admin" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 100px; font-weight: bold;">
              Godkend bruger i Admin →
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Denne email blev sendt automatisk fra SceneSkift
          </p>
        </div>
      `
    });
    console.log('Admin notifikation sendt til:', adminEmail);
  } catch (error) {
    console.error('Kunne ikke sende admin notifikation:', error);
  }
}

/**
 * Send alle registrerings-emails (velkomst + admin notifikation)
 * @param {Object} user - Brugeroplysninger
 */
async function sendRegistrationEmails(user) {
  // Send begge emails (de køres i kø via mailClient)
  await sendWelcomeEmail(user);
  await sendAdminNotification(user);
}

module.exports = {
  sendWelcomeEmail,
  sendAdminNotification,
  sendRegistrationEmails
};
