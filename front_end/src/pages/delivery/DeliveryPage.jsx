import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { LIST_DELIVERY_USERS } from '../../graphql/queries/index.js';
import { UPDATE_USER_STATUS } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

const STATUSES = ['', 'PENDING', 'ACTIVE', 'SUSPENDED'];

const VEHICLE_LABELS = {
  MOTO: '🛵 Moto',
  BICYCLETTE: '🚲 Vélo',
  VOITURE: '🚗 Voiture',
  TRICYCLE: '🛺 Tricycle',
};

function Stars({ rating }) {
  const r = Math.round(rating ?? 0);
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(r)}{'☆'.repeat(5 - r)} <span className="text-gray-400">({(rating ?? 0).toFixed(1)})</span>
    </span>
  );
}

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, refetch } = useQuery(LIST_DELIVERY_USERS, {
    variables: { filters: { role: 'DELIVERY', status: statusFilter || undefined, limit: 100 } },
  });

  const [updateStatus] = useMutation(UPDATE_USER_STATUS, { onCompleted: () => refetch() });

  const handle = (id, status) => {
    if (confirm(`Confirmer le changement de statut en "${status}" ?`))
      updateStatus({ variables: { id, status } });
  };

  const drivers = data?.users ?? [];
  const active = drivers.filter(d => d.status === 'ACTIVE').length;
  const available = drivers.filter(d => d.deliveryProfile?.isAvailable).length;
  const totalDeliveries = drivers.reduce((s, d) => s + (d.deliveryProfile?.totalDeliveries ?? 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Flotte de Livreurs</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary">{drivers.length}</p>
          <p className="text-sm text-gray-400 mt-1">Total livreurs</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-400">{active}</p>
          <p className="text-sm text-gray-400 mt-1">Actifs</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-400">{available}</p>
          <p className="text-sm text-gray-400 mt-1">Disponibles</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-400">{totalDeliveries}</p>
          <p className="text-sm text-gray-400 mt-1">Livraisons totales</p>
        </div>
      </div>

      {/* Filtre */}
      <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        {STATUSES.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
      </select>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2 pr-4">Livreur</th>
              <th className="pb-2 pr-4">Téléphone</th>
              <th className="pb-2 pr-4">Véhicule</th>
              <th className="pb-2 pr-4">Permis</th>
              <th className="pb-2 pr-4">Note</th>
              <th className="pb-2 pr-4">Livraisons</th>
              <th className="pb-2 pr-4">Dispo</th>
              <th className="pb-2 pr-4">Statut</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr><td colSpan={9} className="py-6 text-center text-gray-500">Chargement...</td></tr>
            )}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center text-gray-500">Aucun livreur trouvé</td></tr>
            )}
            {drivers.map(driver => (
              <tr key={driver.id}>
                <td className="py-2 pr-4 font-medium">{driver.firstName} {driver.lastName}</td>
                <td className="py-2 pr-4 text-gray-300">{driver.phone}</td>
                <td className="py-2 pr-4">
                  {driver.deliveryProfile
                    ? (VEHICLE_LABELS[driver.deliveryProfile.vehicleType] ?? driver.deliveryProfile.vehicleType)
                    : <span className="text-gray-600">—</span>
                  }
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-400">
                  {driver.deliveryProfile?.licenseNumber ?? '—'}
                </td>
                <td className="py-2 pr-4">
                  {driver.deliveryProfile
                    ? <Stars rating={driver.deliveryProfile.averageRating} />
                    : '—'}
                </td>
                <td className="py-2 pr-4 text-center font-semibold">
                  {driver.deliveryProfile?.totalDeliveries ?? '—'}
                </td>
                <td className="py-2 pr-4">
                  {driver.deliveryProfile != null ? (
                    driver.deliveryProfile.isAvailable
                      ? <span className="text-green-400 text-xs font-medium">● Oui</span>
                      : <span className="text-gray-500 text-xs">○ Non</span>
                  ) : '—'}
                </td>
                <td className="py-2 pr-4"><Badge status={driver.status} /></td>
                <td className="py-2">
                  <div className="flex gap-2 flex-wrap items-center">
                    <Link to={`/livreurs/${driver.id}`}
                      className="text-xs text-primary hover:underline">Voir</Link>
                    {driver.status !== 'ACTIVE' && (
                      <button onClick={() => handle(driver.id, 'ACTIVE')}
                        className="text-xs text-green-400 hover:underline">Activer</button>
                    )}
                    {driver.status === 'ACTIVE' && (
                      <button onClick={() => handle(driver.id, 'SUSPENDED')}
                        className="text-xs text-yellow-400 hover:underline">Suspendre</button>
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
