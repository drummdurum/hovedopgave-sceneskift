const prisma = require('../database/prisma');

/**
 * Tjek om et produkt har overlappende reservationer i en given periode
 * @param {number} produktId - Produkt ID
 * @param {Date|string} startDato - Start dato
 * @param {Date|string} slutDato - Slut dato
 * @returns {Promise<{hasOverlap: boolean, overlappingReservations: Array}>}
 */
async function checkReservationOverlap(produktId, startDato, slutDato) {
  const start = new Date(startDato);
  const slut = new Date(slutDato);

  // Find overlappende reservationer
  // Overlap sker når: eksisterende.start <= ny.slut OG eksisterende.slut >= ny.start
  const overlappingReservations = await prisma.reservationer.findMany({
    where: {
      produkt_id: produktId,
      AND: [
        { fra_dato: { lte: slut } },
        { til_dato: { gte: start } }
      ]
    },
    select: {
      id: true,
      bruger: true,
      teaternavn: true,
      fra_dato: true,
      til_dato: true
    }
  });

  return {
    hasOverlap: overlappingReservations.length > 0,
    overlappingReservations
  };
}

/**
 * Tjek overlap for flere produkter på én gang
 * @param {Array<number>} produktIds - Liste af produkt IDs
 * @param {Date|string} startDato - Start dato
 * @param {Date|string} slutDato - Slut dato
 * @returns {Promise<{hasOverlap: boolean, conflicts: Array}>}
 */
async function checkBulkReservationOverlap(produktIds, startDato, slutDato) {
  const start = new Date(startDato);
  const slut = new Date(slutDato);

  // Find alle overlappende reservationer for de valgte produkter
  const overlappingReservations = await prisma.reservationer.findMany({
    where: {
      produkt_id: { in: produktIds },
      AND: [
        { fra_dato: { lte: slut } },
        { til_dato: { gte: start } }
      ]
    },
    include: {
      produkt: {
        select: { id: true, navn: true }
      }
    }
  });

  // Gruppér konflikter per produkt
  const conflicts = overlappingReservations.reduce((acc, res) => {
    const existing = acc.find(c => c.produktId === res.produkt_id);
    if (existing) {
      existing.reservationer.push({
        id: res.id,
        teaternavn: res.teaternavn,
        fra_dato: res.fra_dato,
        til_dato: res.til_dato
      });
    } else {
      acc.push({
        produktId: res.produkt_id,
        produktNavn: res.produkt.navn,
        reservationer: [{
          id: res.id,
          teaternavn: res.teaternavn,
          fra_dato: res.fra_dato,
          til_dato: res.til_dato
        }]
      });
    }
    return acc;
  }, []);

  return {
    hasOverlap: conflicts.length > 0,
    conflicts
  };
}

/**
 * Opret en enkelt reservation
 * @param {Object} data - Reservation data
 * @returns {Promise<Object>} Den oprettede reservation
 */
async function createReservation({ produktId, laanerId, bruger, teaternavn, startDato, slutDato }) {
  return prisma.reservationer.create({
    data: {
      bruger,
      teaternavn,
      laaner_id: laanerId,
      fra_dato: new Date(startDato),
      til_dato: new Date(slutDato),
      produkt_id: produktId
    }
  });
}

/**
 * Opret flere reservationer på én gang
 * @param {Array<number>} produktIds - Liste af produkt IDs
 * @param {number} laanerId - Lånerens bruger ID
 * @param {string} bruger - Brugerens navn
 * @param {string} teaternavn - Teaternavnet
 * @param {Date|string} startDato - Start dato
 * @param {Date|string} slutDato - Slut dato
 * @returns {Promise<Array>} Liste af oprettede reservationer
 */
async function createBulkReservations(produktIds, laanerId, bruger, teaternavn, startDato, slutDato) {
  const reservationer = await Promise.all(
    produktIds.map(produktId => 
      createReservation({ produktId, laanerId, bruger, teaternavn, startDato, slutDato })
    )
  );
  return reservationer;
}

/**
 * Hent produkter med ejer info
 * @param {Array<number>} produktIds - Liste af produkt IDs
 * @returns {Promise<Array>} Liste af produkter med ejer
 */
async function getProduktsMedEjer(produktIds) {
  return prisma.produkter.findMany({
    where: { id: { in: produktIds } },
    include: { 
      ejer: { 
        select: { id: true, navn: true, teaternavn: true, email: true } 
      } 
    }
  });
}

/**
 * Gruppér produkter efter ejer
 * @param {Array} produkter - Liste af produkter med ejer
 * @returns {Object} Produkter grupperet efter ejer ID
 */
function groupProdukterByEjer(produkter) {
  return produkter.reduce((acc, produkt) => {
    const ejerId = produkt.ejer.id;
    if (!acc[ejerId]) {
      acc[ejerId] = {
        ejer: produkt.ejer,
        produkter: []
      };
    }
    acc[ejerId].produkter.push({
      id: produkt.id,
      navn: produkt.navn,
      billede: produkt.billede_url
    });
    return acc;
  }, {});
}

module.exports = {
  checkReservationOverlap,
  checkBulkReservationOverlap,
  createReservation,
  createBulkReservations,
  getProduktsMedEjer,
  groupProdukterByEjer
};
