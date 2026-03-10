import { getPrisma } from '../utils/prisma.js';

const prisma = getPrisma();

export async function createOrder(data) {
  const { clientId, vendorId, items, deliveryAddress, deliveryLat, deliveryLng, paymentMethod, notes } = data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
  });

  const productMap = new Map(products.map(p => [p.id, p]));
  let subtotal = 0;

  const orderItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product || product.status !== 'APPROVED') throw new Error(`Product ${item.productId} unavailable`);
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, subtotal: lineTotal };
  });

  const settings = await prisma.platformSettings.findFirst();
  const deliveryFee = settings?.baseDeliveryFee ?? 1000;
  const total = subtotal + deliveryFee;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        clientId, vendorId, deliveryAddress, deliveryLat, deliveryLng,
        deliveryFee, subtotal, total, paymentMethod, notes,
        items: { create: orderItems },
        delivery: { create: {} },
        payment: { create: { amount: total, method: paymentMethod } },
      },
      include: { items: { include: { product: true } }, delivery: true, payment: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  });
}

export async function getOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      vendor: true,
      items: { include: { product: true } },
      delivery: { include: { deliveryMan: { include: { user: true } } } },
      payment: true,
    },
  });
}

export async function listOrders(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.vendorId) where.vendorId = filters.vendorId;

  return prisma.order.findMany({
    where,
    include: {
      client: true,
      vendor: true,
      items: { include: { product: true } },
      delivery: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

export async function updateOrderStatus(id, status, adminId = null) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  if (adminId) {
    await prisma.auditLog.create({
      data: { adminId, action: 'UPDATE_ORDER_STATUS', entity: 'Order', entityId: id, details: { status } },
    });
  }

  return order;
}

export async function assignDeliveryMan(orderId, deliveryManId, adminId) {
  const delivery = await prisma.delivery.update({
    where: { orderId },
    data: { deliveryManId },
    include: { deliveryMan: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: { adminId, action: 'ASSIGN_DELIVERY', entity: 'Order', entityId: orderId, details: { deliveryManId } },
  });

  return delivery;
}
