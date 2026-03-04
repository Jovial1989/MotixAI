import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-heavy' },
    update: {},
    create: {
      name: 'Acme Heavy Industries',
      slug: 'acme-heavy',
    },
  });

  const passwordHash = await bcrypt.hash('Admin123!@#', 10);

  await prisma.user.upsert({
    where: { email: 'admin@motixai.dev' },
    update: {},
    create: {
      email: 'admin@motixai.dev',
      fullName: 'Enterprise Admin',
      role: Role.ENTERPRISE_ADMIN,
      passwordHash,
      tenantId: tenant.id,
    },
  });

  const userHash = await bcrypt.hash('User123!@#', 10);

  await prisma.user.upsert({
    where: { email: 'user@motixai.dev' },
    update: {},
    create: {
      email: 'user@motixai.dev',
      fullName: 'Regular User',
      role: Role.USER,
      passwordHash: userHash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
