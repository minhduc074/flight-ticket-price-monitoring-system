// Export Prisma client and models
// All database operations should use prisma client directly
const { prisma } = require('../lib/prisma');

// Export prisma client for direct usage
module.exports = {
  prisma
};
