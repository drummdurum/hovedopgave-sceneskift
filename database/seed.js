const prisma = require('./prisma');

async function seedAdmin() {
  try {
    // Tjek om admin bruger findes og opdater til admin rolle
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
      console.log('⚠️ Ingen bruger med brugernavn "admin" fundet');
    }
  } catch (error) {
    console.error('Seed fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
