import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DELIVERY_PROFILE, GET_DRIVER_ORDERS } from '../../graphql/queries/index.js';
import { UPDATE_USER_STATUS, CONFIRM_PICKUP, CONFIRM_DELIVERY } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

const VEHICLE_LABELS = {
  MOTO: '🛵 Moto',
  BICYCLETTE: '🚲 Vélo',
  VOITURE: '🚗 Voiture',
  TRICYCLE: '🛺 Tricycle',
};

const ORDER_STATUS_LABELS = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'Préparation',
  READY: 'Prête',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const ORDER_STATUS_COLORS = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-blue-400',
  PREPARING: 'text-orange-400',
  READY: 'text-cyan-400',
  PICKED_UP: 'text-purple-400',
  IN_TRANSIT: 'text-indigo-400',
  DELIVERED: 'text-green-400',
  CANCELLED: 'text-red-400',
  REFUNDED: 'text-gray-400',
};

function Stars({ rating }) {
  const r = Math.round(rating ?? 0);
  return (
    <span className="text-yellow-400">
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      <span className="text-gray-400 text-sm ml-1">({(rating ?? 0).toFixed(1)})</span>
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function duration(start, end) {
  if (!start || !end) return '—';
  const ms = new Date(end) - new Date(start);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
}

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState(null); // { type, orderId }

  const { data: profileData, loading: profileLoading, refetch: refetchProfile } = useQuery(GET_DELIVERY_PROFILE, {
    variables: { id },
  });

  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_DRIVER_ORDERS, {
    variables: { deliveryManId: profileData?.user?.deliveryProfile?.id },
    skip: !profileData?.user?.deliveryProfile?.id,
  });

  const [updateStatus] = useMutation(UPDATE_USER_STATUS, {
    onCompleted: () => refetchProfile(),
  });

  const [confirmPickup] = useMutation(CONFIRM_PICKUP, {
    onCompleted: () => { refetchOrders(); setConfirmAction(null); },
  });

  const [confirmDelivery] = useMutation(CONFIRM_DELIVERY, {
    onCompleted: () => { refetchOrders(); setConfirmAction(null); },
  });

  const user = profileData?.user;
  const profile = user?.deliveryProfile;
  const orders = ordersData?.orders ?? [];

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED');

  const handleStatusChange = (newStatus) => {
    if (confirm(`Confirmer le changement de statut en "${newStatus}" ?`))
      updateStatus({ variables: { id: user.id, status: newStatus } });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'pickup') {
      confirmPickup({ variables: { orderId: confirmAction.orderId } });
    } else if (confirmAction.type === 'delivery') {
      confirmDelivery({ variables: { orderId: confirmAction.orderId } });
    }
  };

  if (profileLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Livreur introuvable.</p>
        <Link to="/livreurs" className="text-primary hover:underline mt-2 inline-block">← Retour à la flotte</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">
              {confirmAction.type === 'pickup' ? 'Confirmer la récupération' : 'Confirmer la livraison'}
            </h3>
            <p className="text-gray-400 text-sm">
              {confirmAction.type === 'pickup'
                ? 'Marquer la commande comme récupérée par le livreur ?'
                : 'Marquer la commande comme livrée au client ?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleConfirmAction} className="btn-primary text-sm">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/livreurs')} className="text-gray-400 hover:text-white transition">
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-400 text-sm">{user.phone}</p>
          </div>
          <Badge status={user.status} />
        </div>
        <div className="flex gap-2">
          {user.status !== 'ACTIVE' && (
            <button onClick={() => handleStatusChange('ACTIVE')}
              className="btn-primary text-sm">Activer</button>
          )}
          {user.status === 'ACTIVE' && (
            <button onClick={() => handleStatusChange('SUSPENDED')}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm transition">
              Suspendre
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl mb-1"><Stars rating={profile?.averageRating ?? 0} /></div>
          <p className="text-sm text-gray-400">Note moyenne</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary">{profile?.totalDeliveries ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">Total livraisons</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-400">{activeOrders.length}</p>
          <p className="text-sm text-gray-400 mt-1">Courses actives</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${profile?.isAvailable ? 'text-green-400' : 'text-gray-500'}`}>
            {profile?.isAvailable ? '● Disponible' : '○ Indispo'}
          </p>
          <p className="text-sm text-gray-400 mt-1">Disponibilité</p>
        </div>
      </div>

      {/* Profil véhicule */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-200">Informations du livreur</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Véhicule</p>
            <p className="font-medium">{profile ? (VEHICLE_LABELS[profile.vehicleType] ?? profile.vehicleType) : '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">N° Permis</p>
            <p className="font-mono font-medium">{profile?.licenseNumber ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Inscrit le</p>
            <p className="font-medium">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Dernière position</p>
            {profile?.currentLat && profile?.currentLng ? (
              <a
                href={`https://maps.google.com/?q=${profile.currentLat},${profile.currentLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs"
              >
                {profile.currentLat.toFixed(4)}, {profile.currentLng.toFixed(4)} ↗
              </a>
            ) : (
              <p className="text-gray-600">Non disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Courses actives */}
      {activeOrders.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-200">Courses en cours ({activeOrders.length})</h3>
          <div className="space-y-2">
            {activeOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm text-gray-300">
                    {order.client.firstName} {order.client.lastName} · {order.vendor.businessName}
                  </span>
                  <span className="text-xs text-gray-500">{(order.total).toLocaleString()} GNF</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === 'READY' && !order.delivery?.pickedUpAt && (
                    <button
                      onClick={() => setConfirmAction({ type: 'pickup', orderId: order.id })}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition"
                    >
                      Récupéré
                    </button>
                  )}
                  {['PICKED_UP', 'IN_TRANSIT'].includes(order.status) && !order.delivery?.deliveredAt && (
                    <button
                      onClick={() => setConfirmAction({ type: 'delivery', orderId: order.id })}
                      className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition"
                    >
                      Livré
                    </button>
                  )}
                  <Link to={`/orders/${order.id}`}
                    className="text-xs text-primary hover:underline">Détail →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique livraisons */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-200">Historique des livraisons</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="pb-2 pr-4">Commande</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Vendeur</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Montant</th>
                <th className="pb-2 pr-4">Récupérée</th>
                <th className="pb-2 pr-4">Livrée</th>
                <th className="pb-2">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {ordersLoading && (
                <tr><td colSpan={8} className="py-6 text-center text-gray-500">Chargement...</td></tr>
              )}
              {!ordersLoading && orders.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-gray-500">Aucune livraison trouvée</td></tr>
              )}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-800/30 transition">
                  <td className="py-2 pr-4">
                    <Link to={`/orders/${order.id}`} className="text-primary hover:underline font-mono text-xs">
                      #{order.id.slice(-6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-gray-300">
                    {order.client.firstName} {order.client.lastName}
                  </td>
                  <td className="py-2 pr-4 text-gray-300">{order.vendor.businessName}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-medium">{order.total.toLocaleString()} GNF</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{formatDate(order.delivery?.pickedUpAt)}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">{formatDate(order.delivery?.deliveredAt)}</td>
                  <td className="py-2 text-gray-400 text-xs">
                    {duration(order.delivery?.pickedUpAt, order.delivery?.deliveredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {completedOrders.length > 0 && (
          <div className="pt-2 border-t border-gray-800 flex gap-6 text-sm text-gray-400">
            <span>Livrées : <span className="text-green-400 font-semibold">{completedOrders.length}</span></span>
            <span>CA total : <span className="text-white font-semibold">
              {completedOrders.reduce((s, o) => s + o.total, 0).toLocaleString()} GNF
            </span></span>
          </div>
        )}
      </div>
    </div>
  );
}
