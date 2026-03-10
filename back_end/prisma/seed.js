import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { phone: '+224600000000' } });
  if (existing) {
    console.log('Admin déjà existant :', existing.phone);
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      phone: '+224600000000',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash,
    },
  });
  console.log('Admin créé :', admin.phone, '/ mot de passe : admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
