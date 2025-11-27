#!/bin/bash
# Dette script skal køres når du deployer til Railway for at migrere databasen

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Generating Prisma Client..."
npx prisma generate

echo "Database setup complete!"
