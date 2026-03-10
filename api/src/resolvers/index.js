import { authResolvers } from './auth.resolvers.js';
import { userResolvers } from './user.resolvers.js';
import { productResolvers } from './product.resolvers.js';
import { orderResolvers } from './order.resolvers.js';
import { analyticsResolvers } from './analytics.resolvers.js';
import { settingsResolvers } from './settings.resolvers.js';
import { reviewResolvers } from './review.resolvers.js';
import { pubsub, EVENTS } from '../pubsub.js';
import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) return JSON.parse(ast.value);
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...orderResolvers.Query,
    ...analyticsResolvers.Query,
    ...settingsResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...productResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...reviewResolvers.Mutation,
  },
  Subscription: {
    ...orderResolvers.Subscription,
    productAdded: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.PRODUCT_ADDED]),
      resolve: (payload) => payload.productAdded,
    },
    productUpdated: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.PRODUCT_UPDATED]),
      resolve: (payload) => payload.productUpdated,
    },
  },
  User: userResolvers.User,
  Order: orderResolvers.Order,
  VendorProfile: productResolvers.VendorProfile,
  Review: reviewResolvers.Review,
};
