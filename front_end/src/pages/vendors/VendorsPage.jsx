import { useQuery, useMutation } from '@apollo/client';
import { LIST_USERS } from '../../graphql/queries/index.js';
import { UPDATE_USER_STATUS } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';

export default function VendorsPage() {
  const { data, loading, refetch } = useQuery(LIST_USERS, {
    variables: { filters: { role: 'VENDOR', limit: 100 } },
  });

  const [updateStatus] = useMutation(UPDATE_USER_STATUS, { onCompleted: () => refetch() });

  const handle = (id, status) => {
    if (confirm(`Confirmer le changement de statut en "${status}" ?`))
      updateStatus({ variables: { id, status } });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Vendeurs</h2>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2">Commerce</th>
              <th className="pb-2">Contact</th>
              <th className="pb-2">Téléphone</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Chargement...</td></tr>}
            {data?.users.map(user => (
              <tr key={user.id}>
                <td className="py-2 font-medium">{user.vendorProfile?.businessName ?? '—'}</td>
                <td className="py-2">{user.firstName} {user.lastName}</td>
                <td className="py-2 text-gray-300">{user.phone}</td>
                <td className="py-2"><Badge status={user.status} /></td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {user.status === 'PENDING' && (
                      <>
                        <button onClick={() => handle(user.id, 'ACTIVE')} className="text-xs text-green-400 hover:underline">Valider</button>
                        <button onClick={() => handle(user.id, 'REJECTED')} className="text-xs text-red-400 hover:underline">Rejeter</button>
                      </>
                    )}
                    {user.status === 'ACTIVE' && (
                      <button onClick={() => handle(user.id, 'SUSPENDED')} className="text-xs text-yellow-400 hover:underline">Suspendre</button>
                    )}
                    {user.status === 'SUSPENDED' && (
                      <button onClick={() => handle(user.id, 'ACTIVE')} className="text-xs text-green-400 hover:underline">Réactiver</button>
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
