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

/**
 * Send notifikation til hovedlager/admin om reservation af lagerprodukt
 * @param {Object} options
 * @param {string} options.adminEmail - Admin/hovedlager email
 * @param {string} options.reserveretAf - Navnet på den der reserverer
 * @param {string} options.teaterNavn - Teaternavnet på den der reserverer
 * @param {Array} options.produkter - Liste af lagerprodukter der reserveres
 * @param {string} options.fraDato - Reservationens startdato
 * @param {string} options.tilDato - Reservationens slutdato
 * @param {string} options.baseUrl - Base URL til applikationen
 */
async function sendHovedlagerNotifikation({
  adminEmail,
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
        
        <h2 style="color: #333; margin-bottom: 20px;">📦 Lagerreservation!</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Hej Hovedlager,
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          <strong style="color: #8A0517;">${teaterNavn}</strong> har reserveret ${produkter.length === 1 ? 'et produkt' : produkter.length + ' produkter'} fra SceneSkift hovedlager.
        </p>
        
        <div style="background-color: #fef3c7; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">📦 Reserverede lagerprodukter:</h3>
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
        
        <div style="background-color: #f3f4f6; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">🏛️ Reserveret af:</h3>
          <p style="color: #374151; margin: 0; font-size: 16px;">
            <strong>${teaterNavn}</strong><br>
            Kontakt: ${reserveretAf}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Sørg for at produkterne er klar til afhentning inden perioden starter.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${baseUrl}/admin/lager-reservationer" 
             style="background-color: #8A0517; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Se lagerreservationer
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
Lagerreservation - SceneSkift

Hej Hovedlager,

${teaterNavn} har reserveret ${produkter.length === 1 ? 'et produkt' : produkter.length + ' produkter'} fra SceneSkift hovedlager.

Reserverede lagerprodukter:
${produkter.map(p => `- ${p.navn}`).join('\n')}

Periode: ${fraDatoFormateret} – ${tilDatoFormateret}

Reserveret af: ${teaterNavn}
Kontakt: ${reserveretAf}

Sørg for at produkterne er klar til afhentning inden perioden starter.

Se lagerreservationer: ${baseUrl}/admin/lager-reservationer

© ${new Date().getFullYear()} SceneSkift
  `;

  return sendMail({
    to: adminEmail,
    subject: `📦 Ny lagerreservation fra ${teaterNavn} - SceneSkift`,
    text,
    html
  });
}

/**
 * Send påmindelse om kommende reservation (30 dage før start)
 * @param {Object} options
 * @param {string} options.tilEmail - Modtagerens email
 * @param {string} options.tilNavn - Modtagerens navn
 * @param {string} options.andenPartNavn - Den anden parts navn
 * @param {string} options.andenPartTeater - Den anden parts teaternavn
 * @param {string} options.produktNavn - Produktets navn
 * @param {string} options.produktBillede - Produktets billede URL
 * @param {Date} options.fraDato - Reservationens startdato
 * @param {Date} options.tilDato - Reservationens slutdato
 * @param {boolean} options.erUdlaaner - Om modtageren er udlåner (ellers er de låner)
 * @param {string} options.baseUrl - Base URL til applikationen
 */
async function sendReservationPaamindelse({
  tilEmail,
  tilNavn,
  andenPartNavn,
  andenPartTeater,
  produktNavn,
  produktBillede,
  fraDato,
  tilDato,
  erUdlaaner,
  baseUrl
}) {
  const fraDatoFormateret = new Date(fraDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  const tilDatoFormateret = new Date(tilDato).toLocaleDateString('da-DK', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  const rolle = erUdlaaner ? 'udlåner' : 'låner';
  const handling = erUdlaaner 
    ? 'afhentet' 
    : 'afhente';
  const pageUrl = erUdlaaner 
    ? `${baseUrl}/mine-reservationer/udlaant` 
    : `${baseUrl}/mine-reservationer/hente`;

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
        
        <h2 style="color: #333; margin-bottom: 20px;">⏰ Påmindelse: Reservation starter om 30 dage</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Hej ${tilNavn || 'SceneSkift bruger'},
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          Dette er en venlig påmindelse om, at din reservation starter om <strong>30 dage</strong>.
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
          <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Vigtigt</h3>
          <p style="color: #856404; margin: 0;">
            ${erUdlaaner 
              ? `Sørg for at produktet er klar til at blive ${handling}.` 
              : `Husk at aftale afhentning med udlåner senest inden ${fraDatoFormateret}.`
            }
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📦 Produkt:</h3>
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${produktBillede || `${baseUrl}/compentens/image/placeholder.webp`}" 
                 alt="${produktNavn}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div>
              <p style="color: #333; margin: 0; font-weight: bold; font-size: 16px;">${produktNavn}</p>
            </div>
          </div>
        </div>
        
        <div style="background-color: #dbeafe; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📆 Periode:</h3>
          <p style="color: #1e40af; margin: 0; font-size: 18px; font-weight: bold;">
            ${fraDatoFormateret} – ${tilDatoFormateret}
          </p>
        </div>
        
        <div style="background-color: #fef3c7; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">
            ${erUdlaaner ? '🏛️ Reserveret af:' : '🏛️ Udlånt af:'}
          </h3>
          <p style="color: #92400e; margin: 0; font-size: 16px;">
            <strong>${andenPartTeater}</strong><br>
            Kontakt: ${andenPartNavn}
          </p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          ${erUdlaaner 
            ? `Kontakt venligst ${andenPartTeater} for at bekræfte afhentning og aftale eventuelle detaljer.`
            : `Kontakt venligst ${andenPartTeater} for at aftale hvor og hvornår du kan ${handling} produktet.`
          }
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${pageUrl}" 
             style="background-color: #8A0517; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Se mine reservationer
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
Påmindelse: Reservation starter om 30 dage - SceneSkift

Hej ${tilNavn},

Dette er en venlig påmindelse om, at din reservation starter om 30 dage.

Produkt: ${produktNavn}
Periode: ${fraDatoFormateret} – ${tilDatoFormateret}

${erUdlaaner ? 'Reserveret af:' : 'Udlånt af:'} ${andenPartTeater}
Kontakt: ${andenPartNavn}

${erUdlaaner 
  ? `Sørg for at produktet er klar til at blive ${handling}.`
  : `Husk at aftale afhentning med udlåner senest inden ${fraDatoFormateret}.`
}

Se mine reservationer: ${pageUrl}

© ${new Date().getFullYear()} SceneSkift
  `;

  return sendMail({
    to: tilEmail,
    subject: `⏰ Påmindelse: Din reservation starter om 30 dage - SceneSkift`,
    text,
    html
  });
}

module.exports = { 
  sendReservationNotifikation,
  sendReservationBekraeftelse,
  sendHovedlagerNotifikation,
  sendReservationPaamindelse
};
