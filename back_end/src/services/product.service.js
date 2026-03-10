import { getPrisma } from '../utils/prisma.js';

const prisma = getPrisma();

export async function createProduct(data) {
  return prisma.product.create({
    data: {
      vendorId: data.vendorId,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      imageUrls: data.imageUrls ?? [],
      category: data.category,
      // Les vendeurs ACTIFS (validés) ont leurs produits auto-approuvés
      status: data.autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
    },
    include: { vendor: true },
  });
}

export async function listProducts(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.category) where.category = filters.category;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return prisma.product.findMany({
    where,
    include: { vendor: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

export async function moderateProduct(id, status, rejectionNote, adminId) {
  const product = await prisma.product.update({
    where: { id },
    data: { status, rejectionNote: status === 'REJECTED' ? rejectionNote : null },
  });

  await prisma.auditLog.create({
    data: {
      adminId,
      action: `PRODUCT_${status}`,
      entity: 'Product',
      entityId: id,
      details: { rejectionNote },
    },
  });

  return product;
}

export async function updateProduct(id, data) {
  // Ne pas toucher au statut lors d'une mise à jour — l'admin l'a déjà évalué
  const { status, ...fields } = data;
  return prisma.product.update({
    where: { id },
    data: fields,
    include: { vendor: true },
  });
}

export async function deleteProduct(id) {
  return prisma.product.delete({ where: { id } });
}
