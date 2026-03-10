import { GraphQLError } from 'graphql';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  assignDeliveryMan,
} from '../../../back_end/src/services/order.service.js';
import { getPrisma } from '../../../back_end/src/utils/prisma.js';
import {
  notifyOrderStatusChange,
  notifyNewOrder,
  notifyDeliveryAssigned,
} from '../../../back_end/src/services/notification.service.js';
import { pubsub, EVENTS } from '../pubsub.js';

const prisma = getPrisma();

const { ORDER_STATUS_CHANGED, DELIVERY_LOCATION_UPDATED, NEW_ORDER } = EVENTS;

export const orderResolvers = {
  Query: {
    orders: async (_, { filters }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return listOrders(filters ?? {});
    },
    order: async (_, { id }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return getOrderById(id);
    },
    myOrders: async (_, __, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return listOrders({ clientId: user.id });
    },
  },
  Mutation: {
    createOrder: async (_, { input }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const order = await createOrder({ ...input, clientId: user.id });
      await pubsub.publish(NEW_ORDER, { newOrder: order });
      notifyNewOrder(order.id).catch(() => {});
      return order;
    },

    updateOrderStatus: async (_, { id, status }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const adminId = user.role === 'ADMIN' ? user.id : null;
      const order = await updateOrderStatus(id, status, adminId);
      const fullOrder = await getOrderById(id);
      await pubsub.publish(ORDER_STATUS_CHANGED, { orderStatusChanged: fullOrder, orderId: id });
      notifyOrderStatusChange(id, status).catch(() => {});
      return order;
    },

    assignDeliveryMan: async (_, { orderId, deliveryManId }, { user }) => {
      if (!user || user.role !== 'ADMIN')
        throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
      const delivery = await assignDeliveryMan(orderId, deliveryManId, user.id);
      // Récupérer l'userId du livreur pour la notification
      const deliveryProfile = await prisma.deliveryProfile.findUnique({ where: { id: deliveryManId } });
      if (deliveryProfile) notifyDeliveryAssigned(orderId, deliveryProfile.userId).catch(() => {});
      return delivery;
    },

    cancelOrder: async (_, { id }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const order = await updateOrderStatus(id, 'CANCELLED', user.role === 'ADMIN' ? user.id : null);
      const fullOrder = await getOrderById(id);
      await pubsub.publish(ORDER_STATUS_CHANGED, { orderStatusChanged: fullOrder, orderId: id });
      notifyOrderStatusChange(id, 'CANCELLED').catch(() => {});
      return order;
    },

    updateDeliveryLocation: async (_, { orderId, lat, lng }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const delivery = await prisma.delivery.update({
        where: { orderId },
        data: { currentLat: lat, currentLng: lng },
        include: { deliveryMan: { include: { user: true } } },
      });
      await pubsub.publish(DELIVERY_LOCATION_UPDATED, { deliveryLocationUpdated: delivery, orderId });
      return delivery;
    },

    confirmPickup: async (_, { orderId }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const delivery = await prisma.delivery.update({
        where: { orderId },
        data: { pickedUpAt: new Date() },
      });
      await updateOrderStatus(orderId, 'IN_TRANSIT');
      const fullOrder = await getOrderById(orderId);
      await pubsub.publish(ORDER_STATUS_CHANGED, { orderStatusChanged: fullOrder, orderId });
      return delivery;
    },

    confirmDelivery: async (_, { orderId, proofImageUrl }, { user }) => {
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const delivery = await prisma.delivery.update({
        where: { orderId },
        data: { deliveredAt: new Date(), proofImageUrl },
      });
      await updateOrderStatus(orderId, 'DELIVERED');
      await prisma.payment.update({ where: { orderId }, data: { status: 'PAID' } });
      const fullOrder = await getOrderById(orderId);
      await pubsub.publish(ORDER_STATUS_CHANGED, { orderStatusChanged: fullOrder, orderId });
      return delivery;
    },
  },

  Subscription: {
    orderStatusChanged: {
      subscribe: (_, { orderId }) =>
        pubsub.asyncIterableIterator([ORDER_STATUS_CHANGED]),
      resolve: (payload) => payload.orderStatusChanged,
    },
    deliveryLocationUpdated: {
      subscribe: (_, { orderId }) =>
        pubsub.asyncIterableIterator([DELIVERY_LOCATION_UPDATED]),
      resolve: (payload) => payload.deliveryLocationUpdated,
    },
    newOrder: {
      subscribe: (_, { vendorId }) =>
        pubsub.asyncIterableIterator([NEW_ORDER]),
      resolve: (payload) => payload.newOrder,
    },
  },

  Order: {
    client: async (parent) => prisma.user.findUnique({ where: { id: parent.clientId } }),
    vendor: async (parent) => prisma.vendorProfile.findUnique({ where: { id: parent.vendorId }, include: { user: true } }),
    items: async (parent) =>
      prisma.orderItem.findMany({ where: { orderId: parent.id }, include: { product: true } }),
    delivery: async (parent) =>
      prisma.delivery.findUnique({ where: { orderId: parent.id }, include: { deliveryMan: { include: { user: true } } } }),
    payment: async (parent) => prisma.payment.findUnique({ where: { orderId: parent.id } }),
  },
};
