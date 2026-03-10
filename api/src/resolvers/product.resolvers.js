import { GraphQLError } from 'graphql';
import {
  createProduct,
  listProducts,
  moderateProduct,
  updateProduct,
  deleteProduct,
} from '../../../back_end/src/services/product.service.js';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';
import { pubsub, EVENTS } from '../pubsub.js';

const prisma = getPrisma();

export const productResolvers = {
  Query: {
    products: async (_, { filters }) => listProducts(filters ?? {}),
    product: async (_, { id }) =>
      prisma.product.findUnique({ where: { id }, include: { vendor: true } }),
    myProducts: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      if (!vendor) return [];
      return prisma.product.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: 'desc' } });
    },
    myVendorProfile: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.vendorProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
    },
    myVendorStats: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      if (!vendor) return { totalOrders: 0, pendingOrders: 0, totalRevenue: 0, totalProducts: 0 };
      const [totalOrders, pendingOrders, revenueData, totalProducts] = await Promise.all([
        prisma.order.count({ where: { vendorId: vendor.id } }),
        prisma.order.count({ where: { vendorId: vendor.id, status: 'PENDING' } }),
        prisma.order.aggregate({ where: { vendorId: vendor.id, status: 'DELIVERED' }, _sum: { total: true } }),
        prisma.product.count({ where: { vendorId: vendor.id } }),
      ]);
      return {
        totalOrders,
        pendingOrders,
        totalRevenue: revenueData._sum.total ?? 0,
        totalProducts,
      };
    },
  },
  Mutation: {
    createProduct: async (_, { input }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      if (user.status !== 'ACTIVE')
        throw new GraphQLError('Votre compte doit être validé par un administrateur avant de pouvoir ajouter des produits.', { extensions: { code: 'FORBIDDEN' } });
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      if (!vendor) throw new GraphQLError('Profil vendeur introuvable', { extensions: { code: 'NOT_FOUND' } });
      // Vendeur ACTIF → produit auto-approuvé et visible immédiatement par les clients
      const product = await createProduct({ ...input, vendorId: vendor.id, autoApprove: true });
      pubsub.publish(EVENTS.PRODUCT_ADDED, { productAdded: product }).catch(() => {});
      return product;
    },
    updateProduct: async (_, { id, input }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      if (user.status !== 'ACTIVE')
        throw new GraphQLError('Votre compte doit être validé pour modifier des produits.', { extensions: { code: 'FORBIDDEN' } });
      const updated = await updateProduct(id, input);
      // Notifier si le produit est toujours approuvé (visible par les clients)
      if (updated.status === 'APPROVED') {
        const full = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        pubsub.publish(EVENTS.PRODUCT_UPDATED, { productUpdated: full }).catch(() => {});
      }
      return updated;
    },
    deleteProduct: async (_, { id }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      if (user.status !== 'ACTIVE')
        throw new GraphQLError('Votre compte doit être validé pour supprimer des produits.', { extensions: { code: 'FORBIDDEN' } });
      await deleteProduct(id);
      return true;
    },
    moderateProduct: async (_, { id, status, rejectionNote }, { user }) => {
      if (!user || user.role !== 'ADMIN')
        throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
      const product = await moderateProduct(id, status, rejectionNote, user.id);
      // Quand un produit est approuvé → notifier les clients en temps réel
      if (status === 'APPROVED') {
        const full = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        pubsub.publish(EVENTS.PRODUCT_ADDED, { productAdded: full }).catch(() => {});
      }
      return product;
    },
  },
  VendorProfile: {
    products: async (parent) =>
      prisma.product.findMany({ where: { vendorId: parent.id }, orderBy: { createdAt: 'desc' } }),
    user: async (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },
};
