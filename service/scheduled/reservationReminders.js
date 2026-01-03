const cron = require('node-cron');
const prisma = require('../../database/prisma');
const { sendReservationPaamindelse } = require('../mail/reservationMail');

/**
 * Tjek dagligt for reservationer der starter om 30 dage
 * Kører hver dag kl. 09:00
 */
function startReservationReminderJob() {
  // Cron schedule: '0 9 * * *' = hver dag kl. 09:00
  cron.schedule('0 9 * * *', async () => {
    console.log('Tjekker reservationer for påmindelser...');
    
    try {
      // Beregn dato for om 30 dage
      const om30Dage = new Date();
      om30Dage.setDate(om30Dage.getDate() + 30);
      om30Dage.setHours(0, 0, 0, 0);
      
      const naesteDag = new Date(om30Dage);
      naesteDag.setDate(naesteDag.getDate() + 1);
      
      // Find alle reservationer der starter om 30 dage
      const reservationer = await prisma.reservationer.findMany({
        where: {
          fra_dato: {
            gte: om30Dage,
            lt: naesteDag
          },
          er_hentet: false, // Kun ikke-hentede reservationer
          paamindelse_sendt: false // Undgå at sende flere gange
        },
        include: {
          laaner: {
            select: {
              id: true,
              navn: true,
              teaternavn: true,
              email: true
            }
          },
          produkt: {
            include: {
              ejer: {
                select: {
                  id: true,
                  navn: true,
                  teaternavn: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      console.log(`Fandt ${reservationer.length} reservationer der starter om 30 dage`);
      
      // Send påmindelse til både udlåner og låner
      for (const reservation of reservationer) {
        try {
          const baseUrl = process.env.BASE_URL || 'https://sceneskift.nu';
          
          // Send til udlåner (ejer af produkt)
          await sendReservationPaamindelse({
            tilEmail: reservation.produkt.ejer.email,
            tilNavn: reservation.produkt.ejer.navn,
            andenPartNavn: reservation.laaner.navn,
            andenPartTeater: reservation.laaner.teaternavn,
            produktNavn: reservation.produkt.navn,
            produktBillede: reservation.produkt.billede_url,
            fraDato: reservation.fra_dato,
            tilDato: reservation.til_dato,
            erUdlaaner: true,
            baseUrl
          });
          
          // Send til låner (den der har reserveret)
          await sendReservationPaamindelse({
            tilEmail: reservation.laaner.email,
            tilNavn: reservation.laaner.navn,
            andenPartNavn: reservation.produkt.ejer.navn,
            andenPartTeater: reservation.produkt.ejer.teaternavn,
            produktNavn: reservation.produkt.navn,
            produktBillede: reservation.produkt.billede_url,
            fraDato: reservation.fra_dato,
            tilDato: reservation.til_dato,
            erUdlaaner: false,
            baseUrl
          });
          
          // Marker at påmindelse er sendt
          await prisma.reservationer.update({
            where: { id: reservation.id },
            data: { paamindelse_sendt: true }
          });
          
          console.log(`Påmindelse sendt for reservation #${reservation.id}`);
        } catch (error) {
          console.error(`Fejl ved afsendelse af påmindelse for reservation #${reservation.id}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Fejl i reservation reminder job:', error);
    }
  });
  
  console.log('✅ Reservation reminder job er startet (kører dagligt kl. 09:00)');
}

module.exports = { startReservationReminderJob };
