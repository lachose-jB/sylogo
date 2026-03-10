// Notifications push via Firebase FCM supprimées.
// Les notifications temps réel sont gérées par les GraphQL Subscriptions (WebSockets).
// Ce service conserve les mêmes signatures de fonctions pour éviter de casser les imports.

import { getPrisma } from '../utils/prisma.js';

const prisma = getPrisma();

const ORDER_STATUS_LABELS = {
  PENDING: 'Commande reçue',
  CONFIRMED: 'Commande confirmée',
  PREPARING: 'Préparation en cours',
  READY: 'Commande prête',
  PICKED_UP: 'Livreur en route',
  IN_TRANSIT: 'Livraison en cours',
  DELIVERED: 'Commande livrée !',
  CANCELLED: 'Commande annulée',
  REFUNDED: 'Commande remboursée',
};

/**
 * Notifie le client d'un changement de statut de sa commande.
 * (Push FCM désactivé — les clients reçoivent les mises à jour via GraphQL Subscriptions)
 */
export async function notifyOrderStatusChange(orderId, status) {
  const label = ORDER_STATUS_LABELS[status] ?? status;
  console.log(`[Notification] Commande ${orderId} → ${label}`);
}

/**
 * Notifie le vendeur d'une nouvelle commande.
 */
export async function notifyNewOrder(orderId) {
  console.log(`[Notification] Nouvelle commande : ${orderId}`);
}

/**
 * Notifie le livreur qu'une livraison lui est assignée.
 */
export async function notifyDeliveryAssigned(orderId, deliveryManUserId) {
  console.log(`[Notification] Livraison ${orderId} assignée au livreur ${deliveryManUserId}`);
}
