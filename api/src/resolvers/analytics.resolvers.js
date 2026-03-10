import { GraphQLError } from 'graphql';
import { getPlatformStats, getOrdersOverTime, getTopVendors } from '../../../back_end/src/services/analytics.service.js';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';

const prisma = getPrisma();

function requireAdmin(user) {
  if (!user || user.role !== 'ADMIN')
    throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
}

export const analyticsResolvers = {
  Query: {
    platformStats: async (_, __, { user }) => {
      requireAdmin(user);
      return getPlatformStats();
    },
    ordersOverTime: async (_, { days = 30 }, { user }) => {
      requireAdmin(user);
      return getOrdersOverTime(days);
    },
    topVendors: async (_, { limit = 10 }, { user }) => {
      requireAdmin(user);
      return getTopVendors(limit);
    },
    auditLogs: async (_, { limit = 50, offset = 0 }, { user }) => {
      requireAdmin(user);
      return prisma.auditLog.findMany({
        where: {},
        include: { admin: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },
  },
};
