import { PrismaClient } from '@prisma/client';

let instance = null;

export function getPrisma() {
  if (!instance) {
    instance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return instance;
}

export async function disconnectPrisma() {
  if (instance) {
    await instance.$disconnect();
    instance = null;
  }
}
