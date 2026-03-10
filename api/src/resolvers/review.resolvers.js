import { GraphQLError } from 'graphql';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';

const prisma = getPrisma();

export const reviewResolvers = {
  Mutation: {
    createReview: async (_, { input }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const { orderId, vendorId, deliveryManId, rating, comment } = input;

      if (!vendorId && !deliveryManId)
        throw new GraphQLError('Provide vendorId or deliveryManId', { extensions: { code: 'BAD_USER_INPUT' } });
      if (rating < 1 || rating > 5)
        throw new GraphQLError('Rating must be between 1 and 5', { extensions: { code: 'BAD_USER_INPUT' } });

      const review = await prisma.review.create({
        data: { authorId: user.id, orderId, vendorId, deliveryManId, rating, comment },
        include: { author: true, vendor: true, deliveryMan: true },
      });

      // Update vendor average rating
      if (vendorId) {
        const agg = await prisma.review.aggregate({
          where: { vendorId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await prisma.vendorProfile.update({
          where: { id: vendorId },
          data: { averageRating: agg._avg.rating ?? 0, totalReviews: agg._count.rating },
        });
      }

      // Update delivery person average rating
      if (deliveryManId) {
        const agg = await prisma.review.aggregate({
          where: { deliveryManId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await prisma.deliveryProfile.update({
          where: { id: deliveryManId },
          data: { averageRating: agg._avg.rating ?? 0 },
        });
      }

      return review;
    },
  },

  Review: {
    author: async (parent) => prisma.user.findUnique({ where: { id: parent.authorId } }),
    vendor: async (parent) => parent.vendorId
      ? prisma.vendorProfile.findUnique({ where: { id: parent.vendorId } })
      : null,
    deliveryMan: async (parent) => parent.deliveryManId
      ? prisma.deliveryProfile.findUnique({ where: { id: parent.deliveryManId } })
      : null,
  },
};
