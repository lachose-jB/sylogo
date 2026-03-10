import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊', end: true },
  { to: '/users', label: 'Utilisateurs', icon: '👥' },
  { to: '/vendors', label: 'Vendeurs', icon: '🏪' },
  { to: '/livreurs', label: 'Livreurs', icon: '🛵' },
  { to: '/orders', label: 'Commandes', icon: '📦' },
  { to: '/products', label: 'Produits', icon: '🛍️' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' },
  { to: '/audit', label: 'Audit', icon: '🔍' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-primary">🛵 SyliGo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-300 mb-2">
            {user?.firstName} {user?.lastName}
          </div>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
        <Outlet />
      </main>
    </div>
  );
}
