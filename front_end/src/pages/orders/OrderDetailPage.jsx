import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_ORDER, LIST_USERS, ORDER_STATUS_CHANGED } from '../../graphql/queries/index.js';
import { UPDATE_ORDER_STATUS, ASSIGN_DELIVERY_MAN } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

const fmt = (n) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('');
  const { data, loading, refetch } = useQuery(GET_ORDER, { variables: { id } });
  const { data: deliveryMen } = useQuery(LIST_USERS, { variables: { filters: { role: 'DELIVERY', status: 'ACTIVE' } } });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS, { onCompleted: () => refetch() });
  const [assignDelivery] = useMutation(ASSIGN_DELIVERY_MAN, {
    onCompleted: () => { refetch(); setSelectedDeliveryMan(''); },
  });

  // Temps réel — mise à jour automatique du statut via WebSocket
  useSubscription(ORDER_STATUS_CHANGED, {
    variables: { orderId: id },
    onData: () => refetch(),
  });

  if (loading) return <div className="text-gray-400 py-10 text-center">Chargement...</div>;
  if (!data?.order) return <div className="text-red-400 py-10 text-center">Commande introuvable</div>;

  const { order } = data;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-200">← Retour</button>
        <h2 className="text-2xl font-bold">Commande #{order.id.slice(0, 8)}</h2>
        <Badge status={order.status} />
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Temps réel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client & Vendor */}
        <div className="card space-y-2">
          <h3 className="font-semibold text-gray-300">Client</h3>
          <p>{order.client.firstName} {order.client.lastName}</p>
          <p className="text-gray-400">{order.client.phone}</p>
          <p className="text-sm text-gray-400">Livraison: {order.deliveryAddress}</p>
        </div>
        <div className="card space-y-2">
          <h3 className="font-semibold text-gray-300">Vendeur</h3>
          <p>{order.vendor.businessName}</p>
          <p className="text-gray-400 text-sm">{order.vendor.address}</p>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h3 className="font-semibold text-gray-300 mb-3">Articles</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-2">Produit</th><th className="pb-2">Qté</th><th className="pb-2">PU</th><th className="pb-2">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-800">
            {order.items.map(item => (
              <tr key={item.id}>
                <td className="py-2">{item.product.name}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{fmt(item.unitPrice)}</td>
                <td className="py-2 font-medium">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-1 text-sm text-right">
          <p>Sous-total: <span className="font-medium">{fmt(order.subtotal)}</span></p>
          <p>Livraison: <span className="font-medium">{fmt(order.deliveryFee)}</span></p>
          <p className="text-base font-bold">Total: {fmt(order.total)}</p>
        </div>
      </div>

      {/* Payment & Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-2">
          <h3 className="font-semibold text-gray-300">Paiement</h3>
          <p>Méthode: <span className="text-gray-300">{order.paymentMethod}</span></p>
          <Badge status={order.paymentStatus} />
          {order.payment?.transactionId && <p className="text-xs text-gray-400">Réf: {order.payment.transactionId}</p>}
        </div>
        <div className="card space-y-2">
          <h3 className="font-semibold text-gray-300">Livraison</h3>
          {order.delivery?.deliveryMan ? (
            <p>{order.delivery.deliveryMan.user.firstName} {order.delivery.deliveryMan.user.lastName}</p>
          ) : (
            <div className="flex gap-2">
              <select className="input flex-1" value={selectedDeliveryMan} onChange={(e) => setSelectedDeliveryMan(e.target.value)}>
                <option value="">Assigner un livreur</option>
                {deliveryMen?.users.map(u => (
                  <option key={u.id} value={u.deliveryProfile?.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedDeliveryMan}
                onClick={() => assignDelivery({ variables: { orderId: id, deliveryManId: selectedDeliveryMan } })}
                className="btn-primary text-sm"
              >Assigner</button>
            </div>
          )}
        </div>
      </div>

      {/* Status actions */}
      {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
        <div className="card flex gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-300 w-full">Changer le statut</h3>
          {['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].map(s => (
            <button key={s} onClick={() => updateStatus({ variables: { id, status: s } })}
              className="btn-secondary text-sm">{s}</button>
          ))}
          <button onClick={() => updateStatus({ variables: { id, status: 'CANCELLED' } })}
            className="bg-red-900 text-red-300 px-4 py-2 rounded-lg text-sm hover:bg-red-800">Annuler</button>
        </div>
      )}
    </div>
  );
}
