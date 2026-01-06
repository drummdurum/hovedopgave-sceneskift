const prisma = require('./prisma');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // Opdater eksamen@admin.com bruger til admin
    const eksamenUser = await prisma.brugere.findUnique({
      where: { email: 'eksamen@admin.com' }
    });

    if (eksamenUser) {
      await prisma.brugere.update({
        where: { id: eksamenUser.id },
        data: { 
          godkendt: true, 
          rolle: 'admin'
        }
      });
      console.log('✅ Bruger opdateret til admin:', eksamenUser.email);
      console.log('   Navn:', eksamenUser.navn);
      console.log('   Godkendt: true');
      console.log('   Rolle: admin');
    } else {
      console.log('⚠️ Ingen bruger fundet med email: eksamen@admin.com');
    }
  } catch (error) {
    console.error('Seed fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
