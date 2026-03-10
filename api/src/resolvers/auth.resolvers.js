import { GraphQLError } from 'graphql';
import {
  createSession,
  revokeSession,
  verifyPassword,
} from '../../../back_end/src/services/auth.service.js';
import { createUser, getUserByPhone } from '../../../back_end/src/services/user.service.js';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';

const prisma = getPrisma();

export const authResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return user;
    },
  },
  Mutation: {
    register: async (_, { input }) => {
      const existing = await getUserByPhone(input.phone);
      if (existing) throw new GraphQLError('Phone already registered', { extensions: { code: 'BAD_USER_INPUT' } });

      const user = await createUser(input);
      const token = await createSession(user.id);
      return { token, user };
    },

    login: async (_, { input }) => {
      const user = await getUserByPhone(input.phone);
      if (!user) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });

      if (user.status === 'SUSPENDED')
        throw new GraphQLError('Account suspended', { extensions: { code: 'FORBIDDEN' } });

      const token = await createSession(user.id);
      return { token, user };
    },

    logout: async (_, __, { token }) => {
      if (token) await revokeSession(token);
      return true;
    },

    // Enregistre le token FCM de l'appareil mobile de l'utilisateur connecté
    registerFcmToken: async (_, { token }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await prisma.user.update({ where: { id: user.id }, data: { fcmToken: token } });
      return true;
    },
  },
};
