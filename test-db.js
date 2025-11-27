// Test script til at verificere database connection og Prisma setup
require('dotenv').config();
const prisma = require('./database/prisma');

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test at hente brugere (vil være tom til at starte med)
    const brugere = await prisma.brugere.findMany();
    console.log(`✅ Found ${brugere.length} brugere i databasen`);
    
    console.log('\n✨ Setup er korrekt! Du kan nu starte serveren med: npm run dev');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n⚠️  Hvis du kører lokalt, skal du bruge Railway\'s public database URL');
    console.log('⚠️  Eller sæt en lokal PostgreSQL database op');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
