import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ORDERS_OVER_TIME, TOP_VENDORS, PLATFORM_STATS } from '../../graphql/queries/index.js';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../../components/ui/StatCard.jsx';

const fmt = (n) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

function exportCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: stats } = useQuery(PLATFORM_STATS);
  const { data: chart } = useQuery(ORDERS_OVER_TIME, { variables: { days } });
  const { data: vendors } = useQuery(TOP_VENDORS, { variables: { limit: 10 } });

  const chartData = chart?.ordersOverTime ?? [];
  const vendorData = vendors?.topVendors ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total utilisateurs" value={stats?.platformStats.totalUsers ?? '—'} icon="👤" />
        <StatCard label="Total commandes" value={stats?.platformStats.totalOrders ?? '—'} icon="📦" color="text-blue-400" />
        <StatCard label="Total revenus" value={fmt(stats?.platformStats.totalRevenue ?? 0)} icon="💰" color="text-green-400" />
        <StatCard label="Vendeurs actifs" value={stats?.platformStats.activeVendors ?? '—'} icon="🏪" color="text-purple-400" />
      </div>

      {/* Activité par jour */}
      <div className="card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="font-semibold">Activité par jour</h3>
          <div className="flex gap-2">
            <select className="input w-36 text-sm" value={days} onChange={(e) => setDays(+e.target.value)}>
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <button
              onClick={() => exportCSV(chartData, `syligogo-activite-${days}j.csv`)}
              disabled={!chartData.length}
              className="btn-secondary text-sm px-3 py-1"
            >
              ↓ CSV
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#E85D04" fill="#E85D04" fillOpacity={0.15} name="Commandes" />
            <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Revenus (GNF)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Vendeurs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Top Vendeurs — Revenus</h3>
          <button
            onClick={() => exportCSV(
              vendorData.map(v => ({
                commerce: v.vendor.businessName,
                commandes: v.totalOrders,
                revenus_GNF: v.totalRevenue,
              })),
              'syligogo-top-vendeurs.csv'
            )}
            disabled={!vendorData.length}
            className="btn-secondary text-sm px-3 py-1"
          >
            ↓ CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={vendorData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
            <YAxis type="category" dataKey="vendor.businessName" tick={{ fill: '#9ca3af', fontSize: 10 }} width={120} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              formatter={(v) => fmt(v)}
            />
            <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenus" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
