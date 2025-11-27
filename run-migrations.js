// Script til at køre migrations på Railway
require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMigrations() {
  console.log('🚀 Starter database migration...\n');
  
  try {
    console.log('📋 Kører: npx prisma migrate deploy\n');
    
    const { stdout, stderr } = await execPromise('npx prisma migrate deploy');
    
    if (stdout) console.log('✅ Output:', stdout);
    if (stderr) console.log('⚠️  Warnings:', stderr);
    
    console.log('\n✨ Migration gennemført!');
    console.log('🔄 Genererer Prisma Client...\n');
    
    const { stdout: genStdout } = await execPromise('npx prisma generate');
    console.log('✅', genStdout);
    
    console.log('\n✅ Alt er klar! Databasen er sat op korrekt.');
    
  } catch (error) {
    console.error('❌ Fejl under migration:');
    console.error(error.message);
    
    if (error.stdout) console.log('\nOutput:', error.stdout);
    if (error.stderr) console.log('\nError details:', error.stderr);
    
    process.exit(1);
  }
}

runMigrations();
