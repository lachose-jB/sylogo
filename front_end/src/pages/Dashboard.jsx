import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { PLATFORM_STATS, ORDERS_OVER_TIME, TOP_VENDORS, RECENT_ORDERS } from '../graphql/queries/index.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useQuery(PLATFORM_STATS);
  const { data: chart } = useQuery(ORDERS_OVER_TIME, { variables: { days: 30 } });
  const { data: vendors } = useQuery(TOP_VENDORS, { variables: { limit: 5 } });
  const { data: recent } = useQuery(RECENT_ORDERS);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tableau de bord</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs" value={statsLoading ? '—' : stats?.platformStats.totalUsers} icon="👤" />
        <StatCard label="Commandes" value={statsLoading ? '—' : stats?.platformStats.totalOrders} icon="📦" color="text-blue-400" />
        <StatCard label="Revenus" value={statsLoading ? '—' : fmt(stats?.platformStats.totalRevenue ?? 0)} icon="💰" color="text-green-400" />
        <StatCard label="En attente" value={statsLoading ? '—' : stats?.platformStats.pendingOrders} icon="⏳" color="text-yellow-400" />
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Commandes (30 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chart?.ordersOverTime ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#E85D04" fill="#E85D04" fillOpacity={0.1} name="Commandes" />
            <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Revenus (GNF)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Vendors */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Top Vendeurs</h3>
        <div className="space-y-3">
          {vendors?.topVendors.map(({ vendor, totalOrders, totalRevenue }, i) => (
            <div key={vendor.id} className="flex items-center gap-3">
              <span className="text-gray-500 text-sm w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{vendor.businessName}</p>
                <p className="text-xs text-gray-400">{totalOrders} commandes</p>
              </div>
              <span className="text-green-400 text-xs font-medium">{fmt(totalRevenue)}</span>
            </div>
          ))}
          {!vendors && <p className="text-gray-500 text-sm">Chargement...</p>}
        </div>
      </div>

      {/* Commandes récentes */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Commandes récentes</h3>
          <Link to="/orders" className="text-sm text-primary hover:underline">Voir toutes →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Commerce</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {!recent && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Chargement...</td></tr>
              )}
              {recent?.orders.map(order => (
                <tr key={order.id}>
                  <td className="py-2 pr-4">
                    <Link to={`/orders/${order.id}`} className="text-primary hover:underline font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{order.client.firstName} {order.client.lastName}</td>
                  <td className="py-2 pr-4 text-gray-300">{order.vendor.businessName}</td>
                  <td className="py-2 pr-4 font-medium">{fmt(order.total)}</td>
                  <td className="py-2 pr-4"><Badge status={order.status} /></td>
                  <td className="py-2 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
