const statusColors = {
  // User / Order / Product status
  ACTIVE: 'bg-green-900 text-green-300',
  PENDING: 'bg-yellow-900 text-yellow-300',
  PENDING_REVIEW: 'bg-yellow-900 text-yellow-300',
  SUSPENDED: 'bg-red-900 text-red-300',
  REJECTED: 'bg-red-900 text-red-300',
  CONFIRMED: 'bg-blue-900 text-blue-300',
  PREPARING: 'bg-purple-900 text-purple-300',
  READY: 'bg-teal-900 text-teal-300',
  PICKED_UP: 'bg-indigo-900 text-indigo-300',
  IN_TRANSIT: 'bg-cyan-900 text-cyan-300',
  DELIVERED: 'bg-green-900 text-green-300',
  CANCELLED: 'bg-gray-700 text-gray-400',
  REFUNDED: 'bg-orange-900 text-orange-300',
  APPROVED: 'bg-green-900 text-green-300',
  PAID: 'bg-green-900 text-green-300',
  FAILED: 'bg-red-900 text-red-300',
};

const statusLabels = {
  PENDING_REVIEW: 'En révision',
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  SUSPENDED: 'Suspendu',
  REJECTED: 'Rejeté',
  CONFIRMED: 'Confirmé',
  PREPARING: 'Préparation',
  READY: 'Prête',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
  APPROVED: 'Approuvé',
  PAID: 'Payé',
  FAILED: 'Échoué',
};

export default function Badge({ status }) {
  const color = statusColors[status] ?? 'bg-gray-700 text-gray-300';
  return (
    <span className={`badge ${color}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
