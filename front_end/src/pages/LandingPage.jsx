import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '10k+', label: 'Clients actifs' },
  { value: '500+', label: 'Vendeurs partenaires' },
  { value: '200+', label: 'Livreurs' },
  { value: '98%', label: 'Livraisons réussies' },
];

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Livraison à Conakry',
    desc: 'Couverture complète des communes de Conakry avec suivi en temps réel.',
  },
  {
    icon: '💸',
    title: 'Paiement Mobile Money',
    desc: 'Orange Money et paiement en espèces acceptés pour chaque commande.',
  },
  {
    icon: '🏪',
    title: 'Marketplace locale',
    desc: 'Découvrez des centaines de vendeurs locaux vérifiés sur notre plateforme.',
  },
  {
    icon: '⚡',
    title: 'Livraison express',
    desc: 'Commandez et recevez vos articles en moins d\'une heure dans Conakry.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-2xl font-extrabold text-primary">🛵 SyliGo</span>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary px-6 py-2 text-sm"
        >
          Espace Admin
        </button>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <span className="text-6xl">🛵</span>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight max-w-2xl">
          La livraison rapide à{' '}
          <span className="text-primary">Conakry</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          SyliGo connecte clients, vendeurs et livreurs en un seul clic.
          Commandez local, recevez vite.
        </p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-8 py-3 text-base"
          >
            Accéder au portail admin
          </button>
          <a
            href="#features"
            className="px-8 py-3 text-base rounded-lg border border-gray-700 text-gray-300 hover:border-primary hover:text-primary transition"
          >
            En savoir plus
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 py-14">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="text-gray-400 mt-1 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi SyliGo ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-primary transition"
              >
                <span className="text-4xl">{f.icon}</span>
                <h3 className="font-semibold mt-4 mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/10 border-t border-primary/20 py-16 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">Prêt à gérer votre plateforme ?</h2>
        <p className="text-gray-400 mb-8">
          Accédez au tableau de bord administrateur pour superviser les commandes,
          les vendeurs et les livreurs.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary px-10 py-3 text-base"
        >
          Se connecter →
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SyliGo — Conakry, Guinée
      </footer>
    </div>
  );
}
