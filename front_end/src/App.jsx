import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UsersPage from './pages/clients/UsersPage.jsx';
import VendorsPage from './pages/vendors/VendorsPage.jsx';
import OrdersPage from './pages/orders/OrdersPage.jsx';
import OrderDetailPage from './pages/orders/OrderDetailPage.jsx';
import ProductsPage from './pages/products/ProductsPage.jsx';
import AnalyticsPage from './pages/analytics/AnalyticsPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import AuditPage from './pages/audit/AuditPage.jsx';
import DeliveryPage from './pages/delivery/DeliveryPage.jsx';
import DeliveryDetailPage from './pages/delivery/DeliveryDetailPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Chargement...</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/accueil" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/accueil" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="livreurs" element={<DeliveryPage />} />
        <Route path="livreurs/:id" element={<DeliveryDetailPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
