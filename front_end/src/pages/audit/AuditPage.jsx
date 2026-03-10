import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { AUDIT_LOGS } from '../../graphql/queries/index.js';

const PAGE_SIZE = 50;

export default function AuditPage() {
  const [offset, setOffset] = useState(0);
  const [allLogs, setAllLogs] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { loading, fetchMore } = useQuery(AUDIT_LOGS, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    onCompleted: (data) => {
      const logs = data.auditLogs ?? [];
      setAllLogs(logs);
      setHasMore(logs.length === PAGE_SIZE);
      setOffset(logs.length);
    },
  });

  const loadMore = () => {
    fetchMore({ variables: { limit: PAGE_SIZE, offset } }).then(({ data }) => {
      const newLogs = data.auditLogs ?? [];
      setAllLogs(prev => [...prev, ...newLogs]);
      setHasMore(newLogs.length === PAGE_SIZE);
      setOffset(prev => prev + newLogs.length);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Journal d'audit</h2>
        <span className="text-sm text-gray-400">{allLogs.length} entrée{allLogs.length !== 1 ? 's' : ''} chargée{allLogs.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Admin</th>
              <th className="pb-2 pr-4">Action</th>
              <th className="pb-2 pr-4">Entité</th>
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && allLogs.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-500">Chargement...</td></tr>
            )}
            {!loading && allLogs.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-gray-500">Aucune entrée d'audit</td></tr>
            )}
            {allLogs.map(log => (
              <tr key={log.id}>
                <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {log.admin.firstName} {log.admin.lastName}
                </td>
                <td className="py-2 pr-4">
                  <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">{log.action}</span>
                </td>
                <td className="py-2 pr-4 text-gray-300">{log.entity}</td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-400">{log.entityId.slice(0, 8)}</td>
                <td className="py-2 text-xs text-gray-400 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center">
          <button onClick={loadMore} disabled={loading} className="btn-secondary px-8">
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
      {!hasMore && allLogs.length > 0 && (
        <p className="text-center text-sm text-gray-600">Tous les logs sont affichés</p>
      )}
    </div>
  );
}
