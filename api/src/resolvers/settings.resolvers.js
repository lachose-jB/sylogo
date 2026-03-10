import { GraphQLError } from 'graphql';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';

const prisma = getPrisma();

function requireAdmin(user) {
  if (!user || user.role !== 'ADMIN')
    throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
}

export const settingsResolvers = {
  Query: {
    platformSettings: async () => prisma.platformSettings.findFirst(),
  },
  Mutation: {
    updatePlatformSettings: async (_, { input }, { user }) => {
      requireAdmin(user);
      const existing = await prisma.platformSettings.findFirst();

      if (existing) {
        return prisma.platformSettings.update({ where: { id: existing.id }, data: input });
      }

      return prisma.platformSettings.create({ data: input });
    },
  },
};
