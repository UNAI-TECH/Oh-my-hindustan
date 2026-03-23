import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Hindusthan@26', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'ohmyhindusthan@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'ohmyhindusthan@gmail.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
