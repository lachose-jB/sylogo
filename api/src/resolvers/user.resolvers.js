import { GraphQLError } from 'graphql';
import { listUsers, getUserById, updateUserStatus, deleteUser } from '../../../back_end/src/services/user.service.js';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';

const prisma = getPrisma();

function requireAdmin(user) {
  if (!user || user.role !== 'ADMIN')
    throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
}

export const userResolvers = {
  Query: {
    users: async (_, { filters }, { user }) => {
      requireAdmin(user);
      return listUsers(filters ?? {});
    },
    user: async (_, { id }, { user }) => {
      requireAdmin(user);
      return getUserById(id);
    },
    myFavoriteDeliveryMan: async (_, __, { user }) => {
      if (!user || !user.favoriteDeliveryManId) return null;
      return prisma.deliveryProfile.findUnique({
        where: { id: user.favoriteDeliveryManId },
        include: { user: true },
      });
    },
    vendors: async (_, { filters }) => {
      return listUsers({ ...(filters ?? {}), role: 'VENDOR', status: 'ACTIVE' });
    },
    vendor: async (_, { id }) => {
      return prisma.vendorProfile.findUnique({ where: { id }, include: { user: true } });
    },
    nearbyVendors: async (_, { lat, lng, radiusKm = 10 }) => {
      // Haversine filter in app layer (could be moved to PostGIS for scale)
      const vendors = await prisma.vendorProfile.findMany({
        where: { user: { status: 'ACTIVE' }, isOpen: true },
        include: { user: true },
      });

      return vendors.filter(v => {
        const R = 6371;
        const dLat = ((v.latitude - lat) * Math.PI) / 180;
        const dLon = ((v.longitude - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat * Math.PI) / 180) * Math.cos((v.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= radiusKm;
      });
    },
  },
  Mutation: {
    updateUserStatus: async (_, { id, status }, { user }) => {
      requireAdmin(user);
      return updateUserStatus(id, status, user.id);
    },
    deleteUser: async (_, { id }, { user }) => {
      requireAdmin(user);
      await deleteUser(id, user.id);
      return true;
    },
    setFavoriteDeliveryMan: async (_, { deliveryManId }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await prisma.user.update({ where: { id: user.id }, data: { favoriteDeliveryManId: deliveryManId ?? null } });
      return true;
    },
  },
  User: {
    vendorProfile: async (parent) =>
      prisma.vendorProfile.findUnique({ where: { userId: parent.id } }),
    deliveryProfile: async (parent) =>
      prisma.deliveryProfile.findUnique({ where: { userId: parent.id } }),
  },
};
