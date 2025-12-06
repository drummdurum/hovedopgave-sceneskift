const { sendMail } = require('./mailClient');

/**
 * Send reservation notifikation til ejer af produkt
 * @param {Object} options
 * @param {string} options.ejerEmail - Ejerens email
 * @param {string} options.ejerNavn - Ejerens navn
 * @param {string} options.reserveretAf - Navnet på den der reserverer
 * @param {string} options.teaterNavn - Teaternavnet på den der reserverer
 * @param {Array} options.produkter - Liste af produkter der reserveres
 * @param {string} options.fraDato - Reservationens startdato
 * @param {string} options.tilDato - Reservationens slutdato
 * @param {string} options.baseUrl - Base URL til applikationen
 */
async function sendReservationNotifikation({
  ejerEmail,
  ejerNavn,
  reserveretAf,
  teaterNavn,
  produkter,
  fraDato,
  tilDato,
  baseUrl
}) {
  const fraDatoFormateret = new Date(fraDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  const tilDatoFormateret = new Date(tilDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const produktListe = produkter.map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${p.billede || `${baseUrl}/compentens/image/placeholder.webp`}" 
               alt="${p.navn}" 
               style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
          <span style="font-weight: 500; color: #333;">${p.navn}</span>
        </div>
      </td>
    </tr>
  `).join('');
  
  const produktNavne = produkter.map(p => p.navn).join(', ');

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
        
        <h2 style="color: #333; margin-bottom: 20px;">📅 Ny reservation!</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Hej ${ejerNavn || 'SceneSkift bruger'},
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          <strong style="color: #8A0517;">${teaterNavn}</strong> har reserveret ${produkter.length === 1 ? 'et produkt' : produkter.length + ' produkter'} fra dit teater.
        </p>
        
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📦 Reserverede produkter:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${produktListe}
          </table>
        </div>
        
        <div style="background-color: #dbeafe; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📆 Periode:</h3>
          <p style="color: #1e40af; margin: 0; font-size: 18px; font-weight: bold;">
            ${fraDatoFormateret} – ${tilDatoFormateret}
          </p>
        </div>
        
        <div style="background-color: #fef3c7; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🏛️ Reserveret af:</h3>
          <p style="color: #92400e; margin: 0; font-size: 16px;">
            <strong>${teaterNavn}</strong><br>
            Kontakt: ${reserveretAf}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Kontakt venligst ${teaterNavn} for at aftale nærmere detaljer om afhentning og aflevering.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${baseUrl}/mine-reservationer/udlaant" 
             style="background-color: #8A0517; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Se alle reservationer
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
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
Ny reservation - SceneSkift

Hej ${ejerNavn || 'SceneSkift bruger'},

${teaterNavn} har reserveret ${produkter.length === 1 ? 'et produkt' : produkter.length + ' produkter'} fra dit teater.

Reserverede produkter:
${produkter.map(p => `- ${p.navn}`).join('\n')}

Periode: ${fraDatoFormateret} – ${tilDatoFormateret}

Reserveret af: ${teaterNavn}
Kontakt: ${reserveretAf}

Kontakt venligst ${teaterNavn} for at aftale nærmere detaljer om afhentning og aflevering.

Se alle dine reservationer: ${baseUrl}/mine-reservationer/udlaant

© ${new Date().getFullYear()} SceneSkift
  `;

  return sendMail({
    to: ejerEmail,
    subject: `📅 Ny reservation fra ${teaterNavn} - SceneSkift`,
    text,
    html
  });
}

/**
 * Send bekræftelse til den der reserverer
 * @param {Object} options
 * @param {string} options.brugerEmail - Brugerens email
 * @param {string} options.brugerNavn - Brugerens navn
 * @param {Array} options.produkter - Liste af produkter der reserveres (med ejer info)
 * @param {string} options.fraDato - Reservationens startdato
 * @param {string} options.tilDato - Reservationens slutdato
 * @param {string} options.baseUrl - Base URL til applikationen
 */
async function sendReservationBekraeftelse({
  brugerEmail,
  brugerNavn,
  produkter,
  fraDato,
  tilDato,
  baseUrl
}) {
  const fraDatoFormateret = new Date(fraDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  const tilDatoFormateret = new Date(tilDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const produktListe = produkter.map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 500; color: #333;">${p.navn}</div>
        <div style="font-size: 13px; color: #666;">Ejes af: ${p.ejerNavn}</div>
      </td>
    </tr>
  `).join('');

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
        
        <h2 style="color: #333; margin-bottom: 20px;">✅ Reservation bekræftet!</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Hej ${brugerNavn || 'SceneSkift bruger'},
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          Din reservation er blevet oprettet! Ejerne af produkterne er blevet informeret.
        </p>
        
        <div style="background-color: #dcfce7; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">📦 Dine reserverede produkter:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${produktListe}
          </table>
        </div>
        
        <div style="background-color: #dbeafe; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📆 Periode:</h3>
          <p style="color: #1e40af; margin: 0; font-size: 18px; font-weight: bold;">
            ${fraDatoFormateret} – ${tilDatoFormateret}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Ejerne vil kontakte dig for at aftale nærmere detaljer om afhentning.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${baseUrl}/mine-reservationer/hente" 
             style="background-color: #8A0517; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Se dine reservationer
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
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
Reservation bekræftet - SceneSkift

Hej ${brugerNavn || 'SceneSkift bruger'},

Din reservation er blevet oprettet! Ejerne af produkterne er blevet informeret.

Dine reserverede produkter:
${produkter.map(p => `- ${p.navn} (ejes af ${p.ejerNavn})`).join('\n')}

Periode: ${fraDatoFormateret} – ${tilDatoFormateret}

Ejerne vil kontakte dig for at aftale nærmere detaljer om afhentning.

Se dine reservationer: ${baseUrl}/mine-reservationer/hente

© ${new Date().getFullYear()} SceneSkift
  `;

  return sendMail({
    to: brugerEmail,
    subject: '✅ Din reservation er bekræftet - SceneSkift',
    text,
    html
  });
}

module.exports = { 
  sendReservationNotifikation,
  sendReservationBekraeftelse 
};
