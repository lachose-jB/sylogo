import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function LoginToast({ type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    error:   'bg-red-900/90 border-red-500 text-red-200',
    warning: 'bg-yellow-900/90 border-yellow-500 text-yellow-200',
    info:    'bg-blue-900/90 border-blue-500 text-blue-200',
  };

  const icons = {
    error:   '🚫',
    warning: '⚠️',
    info:    'ℹ️',
  };

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm w-full
        ${styles[type]} animate-slide-in`}
    >
      <span className="text-xl shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 opacity-60 hover:opacity-100 transition text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null); // { type, message }
  const { login } = useAuth();
  const navigate  = useNavigate();

  const showToast = (type, message) => setToast({ type, message });
  const closeToast = () => setToast(null);

  const getErrorMessage = (raw) => {
    const msg = (raw ?? '').toLowerCase();
    if (msg.includes('invalid') || msg.includes('invalide') || msg.includes('incorrect') || msg.includes('wrong'))
      return { type: 'error', text: 'Téléphone ou mot de passe incorrect.' };
    if (msg.includes('not found') || msg.includes('introuvable') || msg.includes('existe pas'))
      return { type: 'error', text: 'Aucun compte trouvé avec ce numéro.' };
    if (msg.includes('suspended') || msg.includes('suspendu'))
      return { type: 'warning', text: 'Votre compte est suspendu. Contactez le support.' };
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect') || msg.includes('timeout'))
      return { type: 'info', text: 'Impossible de contacter le serveur. Vérifiez votre connexion.' };
    return { type: 'error', text: raw || 'Identifiants invalides. Réessayez.' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    closeToast();
    setLoading(true);
    try {
      const user = await login(phone, password);
      if (user.role !== 'ADMIN') {
        showToast('warning', 'Accès refusé. Ce portail est réservé aux administrateurs.');
        return;
      }
      navigate('/');
    } catch (err) {
      const { type, text } = getErrorMessage(err.message);
      showToast(type, text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      {toast && (
        <LoginToast type={toast.type} message={toast.message} onClose={closeToast} />
      )}

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary hover:opacity-80 transition">
            🛵 SyliGo
          </Link>
          <p className="text-gray-400 mt-2">Portail Administrateur</p>
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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
