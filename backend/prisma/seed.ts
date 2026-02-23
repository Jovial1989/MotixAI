import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@hammerai.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hammerai.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  console.log('Database seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
