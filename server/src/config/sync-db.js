require('dotenv').config();
const { prisma, connectDB, disconnectDB } = require('../lib/prisma');

const syncDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL via Prisma...');
    await connectDB();
    console.log('Connection established successfully.');

    console.log('\nTo sync database schema, run:');
    console.log('  npx prisma db push     - Push schema to database');
    console.log('  npx prisma migrate dev - Create migration');
    console.log('  npx prisma generate    - Generate Prisma Client');
    console.log('  npx prisma studio      - Open Prisma Studio GUI');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

syncDatabase();
