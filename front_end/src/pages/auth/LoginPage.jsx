import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(phone, password);
      if (user.role !== 'ADMIN') {
        setError('Accès réservé aux administrateurs.');
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.message ?? 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary hover:opacity-80 transition">
            🛵 SyliGo
          </Link>
          <p className="text-gray-400 mt-2">Portail Administrateur</p>
        </div>

        {/* Identifiants de démonstration */}
        <div className="mb-4 p-3 rounded-lg bg-blue-950/60 border border-blue-700/50 text-sm text-blue-300">
          <p className="font-semibold mb-1 text-blue-200">Identifiants admin</p>
          <p>Téléphone : <span className="font-mono">+224600000000</span></p>
          <p>Mot de passe : <span className="font-mono">admin123</span></p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+224 XXX XXX XXX"
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
