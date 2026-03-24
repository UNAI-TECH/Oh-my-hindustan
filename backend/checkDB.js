require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Recent Users in DB:');
  console.dir(users);
  
  // To query auth.users, use raw query
  const authUsers = await prisma.$queryRaw`SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent Auth Users:');
  console.dir(authUsers);
  
  await prisma.$disconnect();
}

main().catch(console.error);
