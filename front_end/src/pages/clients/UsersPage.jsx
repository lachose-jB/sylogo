import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LIST_USERS } from '../../graphql/queries/index.js';
import { UPDATE_USER_STATUS, DELETE_USER } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

const ROLES = ['', 'CLIENT', 'VENDOR', 'DELIVERY', 'ADMIN'];
const STATUSES = ['', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];

export default function UsersPage() {
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const { data, loading, refetch } = useQuery(LIST_USERS, {
    variables: { filters: { role: filters.role || undefined, status: filters.status || undefined, search: filters.search || undefined, limit: 100 } },
  });

  const [updateStatus] = useMutation(UPDATE_USER_STATUS, { onCompleted: () => refetch() });
  const [deleteUser] = useMutation(DELETE_USER, { onCompleted: () => refetch() });

  const handleStatusChange = (id, status) => {
    if (confirm(`Changer le statut en "${status}" ?`)) updateStatus({ variables: { id, status } });
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer cet utilisateur définitivement ?')) deleteUser({ variables: { id } });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Utilisateurs</h2>

      <div className="flex gap-3 flex-wrap">
        <input
          className="input w-56"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select className="input w-40" value={filters.role} onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}>
          {ROLES.map(r => <option key={r} value={r}>{r || 'Tous les rôles'}</option>)}
        </select>
        <select className="input w-44" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">Nom</th>
              <th className="pb-2">Téléphone</th>
              <th className="pb-2">Rôle</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-500">Chargement...</td></tr>
            )}
            {data?.users.map(user => (
              <tr key={user.id}>
                <td className="py-2 font-medium">{user.firstName} {user.lastName}</td>
                <td className="py-2 text-gray-300">{user.phone}</td>
                <td className="py-2"><span className="text-xs text-gray-400">{user.role}</span></td>
                <td className="py-2"><Badge status={user.status} /></td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {user.status !== 'ACTIVE' && (
                      <button onClick={() => handleStatusChange(user.id, 'ACTIVE')} className="text-xs text-green-400 hover:underline">Activer</button>
                    )}
                    {user.status !== 'SUSPENDED' && (
                      <button onClick={() => handleStatusChange(user.id, 'SUSPENDED')} className="text-xs text-yellow-400 hover:underline">Suspendre</button>
                    )}
                    <button onClick={() => handleDelete(user.id)} className="text-xs text-red-400 hover:underline">Supprimer</button>
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
