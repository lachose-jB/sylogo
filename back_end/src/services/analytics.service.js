import { getPrisma } from '../utils/prisma.js';

const prisma = getPrisma();

export async function getPlatformStats() {
  const [totalUsers, totalOrders, totalRevenue, activeVendors, pendingOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.vendorProfile.count({ where: { user: { status: 'ACTIVE' } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
  ]);

  return {
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    activeVendors,
    pendingOrders,
  };
}

export async function getOrdersOverTime(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, total: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {};
  for (const order of orders) {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = { date, count: 0, revenue: 0 };
    grouped[date].count++;
    if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      grouped[date].revenue += order.total;
    }
  }

  return Object.values(grouped);
}

export async function getTopVendors(limit = 10) {
  const results = await prisma.order.groupBy({
    by: ['vendorId'],
    where: { status: { in: ['DELIVERED'] } },
    _count: { id: true },
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
  });

  const vendorIds = results.map(r => r.vendorId);
  const vendors = await prisma.vendorProfile.findMany({
    where: { id: { in: vendorIds } },
    include: { user: true },
  });

  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  return results.map(r => ({
    vendor: vendorMap.get(r.vendorId),
    totalOrders: r._count.id,
    totalRevenue: r._sum.total ?? 0,
  }));
}
