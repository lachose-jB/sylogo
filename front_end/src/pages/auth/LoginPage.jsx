import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// URL de santé : dérivée de VITE_GRAPHQL_URL ou fallback proxy local
const HEALTH_URL = import.meta.env.VITE_GRAPHQL_URL
  ? import.meta.env.VITE_GRAPHQL_URL.replace('/graphql', '') + '/health'
  : '/health';

// ─── Toast ────────────────────────────────────────────────────────────────────
function LoginToast({ type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    error:   'bg-red-900/90 border-red-500 text-red-200',
    warning: 'bg-yellow-900/90 border-yellow-500 text-yellow-200',
    info:    'bg-blue-900/90 border-blue-500 text-blue-200',
  };
  const icons = { error: '🚫', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3
      rounded-xl border shadow-2xl max-w-sm w-full ${styles[type]} animate-slide-in`}>
      <span className="text-xl shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button onClick={onClose}
        className="shrink-0 opacity-60 hover:opacity-100 transition text-lg leading-none">×</button>
    </div>
  );
}

// ─── Indicateur de statut serveur ─────────────────────────────────────────────
function ServerStatus({ status }) {
  const map = {
    checking: {
      dot: 'bg-yellow-400 animate-pulse',
      text: 'text-yellow-400',
      label: 'Vérification du serveur…',
    },
    online: {
      dot: 'bg-green-400',
      text: 'text-green-400',
      label: 'Serveur en ligne',
    },
    waking: {
      dot: 'bg-orange-400 animate-pulse',
      text: 'text-orange-400',
      label: 'Serveur en démarrage, patientez…',
    },
    offline: {
      dot: 'bg-red-500',
      text: 'text-red-400',
      label: 'Serveur inaccessible',
    },
  };
  const s = map[status] ?? map.checking;
  return (
    <div className="flex items-center gap-2 justify-center mb-4">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      <span className={`text-xs ${s.text}`}>{s.label}</span>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [serverStatus, setStatus] = useState('checking'); // checking | online | waking | offline
  const [attempts, setAttempts]   = useState(0);          // nombre de tentatives de ping
  const { login } = useAuth();
  const navigate  = useNavigate();

  const showToast  = (type, message) => setToast({ type, message });
  const closeToast = () => setToast(null);

  // ── Health check ────────────────────────────────────────────────────────────
  const checkServer = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        setStatus('online');
        setAttempts(0);
      } else {
        setStatus('offline');
      }
    } catch {
      setAttempts(prev => {
        const next = prev + 1;
        setStatus(next <= 6 ? 'waking' : 'offline');
        return next;
      });
    }
  }, []);

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  // Réessai automatique tant que le serveur n'est pas en ligne
  useEffect(() => {
    if (serverStatus === 'online') return;
    const interval = setInterval(checkServer, serverStatus === 'waking' ? 8000 : 15000);
    return () => clearInterval(interval);
  }, [serverStatus, checkServer]);

  // Toast automatique si le serveur met trop de temps
  useEffect(() => {
    if (attempts === 2) {
      showToast('info',
        'Le serveur se réveille (mode veille Render). Patientez 20–40 secondes avant de vous connecter.'
      );
    }
    if (attempts >= 7) {
      showToast('warning', 'Le serveur semble inaccessible. Contactez l\'administrateur.');
    }
  }, [attempts]);

  // ── Gestion erreurs login ───────────────────────────────────────────────────
  const getErrorMessage = (raw) => {
    const msg = (raw ?? '').toLowerCase();
    if (msg.includes('invalid') || msg.includes('invalide') || msg.includes('incorrect') || msg.includes('wrong'))
      return { type: 'error', text: 'Téléphone ou mot de passe incorrect.' };
    if (msg.includes('not found') || msg.includes('introuvable') || msg.includes('existe pas'))
      return { type: 'error', text: 'Aucun compte trouvé avec ce numéro.' };
    if (msg.includes('suspended') || msg.includes('suspendu'))
      return { type: 'warning', text: 'Votre compte est suspendu. Contactez le support.' };
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect') || msg.includes('timeout'))
      return { type: 'info', text: 'Impossible de contacter le serveur. Réessayez dans quelques secondes.' };
    return { type: 'error', text: raw || 'Identifiants invalides. Réessayez.' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serverStatus !== 'online') {
      showToast('info', 'Le serveur n\'est pas encore prêt. Patientez quelques secondes.');
      return;
    }
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

  const btnDisabled = loading || serverStatus !== 'online';
  const btnLabel = loading
    ? 'Connexion en cours…'
    : serverStatus === 'checking' ? 'Vérification…'
    : serverStatus === 'waking'   ? 'Serveur en démarrage…'
    : serverStatus === 'offline'  ? 'Serveur inaccessible'
    : 'Se connecter';

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

        <ServerStatus status={serverStatus} />

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

          <button type="submit" disabled={btnDisabled} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {btnLabel}
          </button>

          {serverStatus === 'waking' && (
            <p className="text-xs text-center text-orange-400/80">
              Le serveur est en mode veille. Il sera prêt dans quelques secondes…
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
