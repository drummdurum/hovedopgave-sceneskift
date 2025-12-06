const prisma = require('./prisma');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // Opdater admin bruger hvis den findes (id 2)
    const adminUser = await prisma.brugere.findUnique({
      where: { id: 2 }
    });

    if (adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.brugere.update({
        where: { id: adminUser.id },
        data: { 
          godkendt: true, 
          rolle: 'admin',
          password: hashedPassword
        }
      });
      console.log('✅ Admin bruger opdateret med nyt password:', adminUser.email);
    } else {
      console.log('⚠️ Ingen admin bruger fundet med id 2 - opret den via /register');
    }
  } catch (error) {
    console.error('Seed fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
