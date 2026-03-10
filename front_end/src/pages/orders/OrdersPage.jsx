import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { LIST_ORDERS } from '../../graphql/queries/index.js';
import { UPDATE_ORDER_STATUS } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const fmt = (n) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const { data, loading, refetch } = useQuery(LIST_ORDERS, {
    variables: { filters: { status: status || undefined, limit: 100 } },
  });
  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS, { onCompleted: () => refetch() });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Commandes</h2>

      <select className="input w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
      </select>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">ID</th>
              <th className="pb-2">Client</th>
              <th className="pb-2">Vendeur</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Paiement</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && <tr><td colSpan={7} className="py-6 text-center text-gray-500">Chargement...</td></tr>}
            {data?.orders.map(order => (
              <tr key={order.id}>
                <td className="py-2">
                  <Link to={`/orders/${order.id}`} className="text-primary hover:underline font-mono text-xs">
                    {order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-2">{order.client.firstName} {order.client.lastName}</td>
                <td className="py-2 text-gray-300">{order.vendor.businessName}</td>
                <td className="py-2 font-medium">{fmt(order.total)}</td>
                <td className="py-2"><Badge status={order.paymentStatus} /></td>
                <td className="py-2"><Badge status={order.status} /></td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button onClick={() => updateStatus({ variables: { id: order.id, status: 'CONFIRMED' } })}
                        className="text-xs text-blue-400 hover:underline">Confirmer</button>
                    )}
                    {!['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status) && (
                      <button onClick={() => updateStatus({ variables: { id: order.id, status: 'CANCELLED' } })}
                        className="text-xs text-red-400 hover:underline">Annuler</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
