const prisma = require('./prisma');

// Standard kategorier
const standardKategorier = [
  'Møbler',
  'Belysning',
  'Dekoration',
  'Kostumer',
  'Rekvisitter',
  'Teknik',
  'Scenografi',
  'Lyd',
  'Tekstiler',
  'Andet'
];

async function seed() {
  try {
    console.log('📦 Opretter standard kategorier...');
    
    for (const navn of standardKategorier) {
      await prisma.kategorier.upsert({
        where: { navn },
        update: {},
        create: { navn }
      });
    }
    
    console.log(`✅ ${standardKategorier.length} kategorier oprettet/opdateret`);
  } catch (error) {
    console.error('Seed fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
