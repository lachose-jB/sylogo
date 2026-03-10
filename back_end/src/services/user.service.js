import { getPrisma } from '../utils/prisma.js';
import { hashPassword } from './auth.service.js';

const prisma = getPrisma();

export async function createUser(data) {
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: data.role === 'ADMIN' ? 'ACTIVE' : 'PENDING',
    },
  });

  // Auto-créer le profil métier selon le rôle
  if (data.role === 'VENDOR') {
    await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: `${data.firstName} ${data.lastName}`,
        businessType: 'Non défini',
        address: 'À compléter',
        latitude: 9.5370,   // Centre de Conakry
        longitude: -13.6773,
      },
    });
  } else if (data.role === 'DELIVERY') {
    await prisma.deliveryProfile.create({
      data: {
        userId: user.id,
        vehicleType: 'Non défini',
        licenseNumber: 'À compléter',
      },
    });
  }

  return user;
}

export async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByPhone(phone) {
  return prisma.user.findUnique({ where: { phone } });
}

export async function listUsers(filters = {}) {
  const where = {};
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

export async function updateUserStatus(id, status, adminId) {
  const user = await prisma.user.update({
    where: { id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'UPDATE_USER_STATUS',
      entity: 'User',
      entityId: id,
      details: { newStatus: status },
    },
  });

  return user;
}

export async function deleteUser(id, adminId) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
    },
  });

  return prisma.user.delete({ where: { id } });
}
