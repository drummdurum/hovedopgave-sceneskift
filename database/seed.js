const prisma = require('./prisma');

async function seed() {
  try {
    // Opdater admin bruger hvis den findes
    const adminUser = await prisma.brugere.findUnique({
      where: { brugernavn: 'admin' }
    });

    if (adminUser) {
      await prisma.brugere.update({
        where: { id: adminUser.id },
        data: { 
          godkendt: true, 
          rolle: 'admin' 
        }
      });
      console.log('✅ Admin bruger opdateret:', adminUser.brugernavn);
    } else {
      console.log('⚠️ Ingen bruger med brugernavn "admin" fundet - opret den via /register');
    }
  } catch (error) {
    console.error('Seed fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
