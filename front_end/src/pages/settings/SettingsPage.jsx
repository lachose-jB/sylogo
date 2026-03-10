import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { PLATFORM_SETTINGS } from '../../graphql/queries/index.js';
import { UPDATE_PLATFORM_SETTINGS } from '../../graphql/mutations/index.js';

export default function SettingsPage() {
  const { data, loading } = useQuery(PLATFORM_SETTINGS);
  const [form, setForm] = useState({ baseDeliveryFee: 0, pricePerKm: 0, defaultCommission: 0, maintenanceMode: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.platformSettings) {
      const s = data.platformSettings;
      setForm({ baseDeliveryFee: s.baseDeliveryFee, pricePerKm: s.pricePerKm, defaultCommission: s.defaultCommission, maintenanceMode: s.maintenanceMode });
    }
  }, [data]);

  const [update, { loading: saving }] = useMutation(UPDATE_PLATFORM_SETTINGS, {
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    update({ variables: { input: { baseDeliveryFee: +form.baseDeliveryFee, pricePerKm: +form.pricePerKm, defaultCommission: +form.defaultCommission, maintenanceMode: form.maintenanceMode } } });
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">Chargement...</div>;

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-2xl font-bold">Paramètres de la plateforme</h2>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Frais de base (GNF)</label>
          <input type="number" className="input" value={form.baseDeliveryFee}
            onChange={(e) => setForm(f => ({ ...f, baseDeliveryFee: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Prix par km (GNF)</label>
          <input type="number" className="input" value={form.pricePerKm}
            onChange={(e) => setForm(f => ({ ...f, pricePerKm: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Commission par défaut (ex: 0.10 = 10%)</label>
          <input type="number" step="0.01" min="0" max="1" className="input" value={form.defaultCommission}
            onChange={(e) => setForm(f => ({ ...f, defaultCommission: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="maintenance" checked={form.maintenanceMode}
            onChange={(e) => setForm(f => ({ ...f, maintenanceMode: e.target.checked }))}
            className="w-4 h-4 accent-primary" />
          <label htmlFor="maintenance" className="text-sm text-gray-300">Mode maintenance</label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
          {saved && <span className="text-green-400 text-sm">Sauvegardé ✓</span>}
        </div>
      </form>
    </div>
  );
}
