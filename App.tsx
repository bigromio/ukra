import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { InstallModal } from './components/InstallModal';
import { useGeofence } from './hooks/useGeofence';
import { FurnitureQuoteForm } from './components/Forms/FurnitureQuoteForm';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ClientAuth } from './pages/ClientAuth';
import { Home } from './pages/Home';
import { DesignRequest } from './pages/DesignRequest';
import { FeasibilityStudy } from './pages/FeasibilityStudy';
import { WoodCatalog } from './pages/WoodCatalog';
import { BookAppointment } from './pages/BookAppointment';
import { HotelAdvisor } from './pages/HotelAdvisor';
import FurnitureStore from './pages/FurnitureStore';
import { CartProvider } from './context/CartContext';
import Checkout from './pages/Checkout';
import { ClientOrders } from './pages/ClientOrders';

// --- منطق الحماية الموحد ---
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated: isStaff } = useAuth();
  const isClient = localStorage.getItem('isAuthenticated') === 'true';

  // إذا لم يكن موظفاً ولا عميلاً، نوجهه لصفحة دخول العميل
  if (!isStaff && !isClient) {
    return <Navigate to="/client-login" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  useGeofence();
  return (
    <>
      <InstallModal />
      <Routes>
        {/* المسارات العامة مع Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/design-request" element={<Layout><DesignRequest /></Layout>} />
        <Route path="/store" element={<Layout><FurnitureStore /></Layout>} />
        <Route path="/furniture-quote" element={<Layout><FurnitureQuoteForm /></Layout>} />
        <Route path="/feasibility-study" element={<Layout><FeasibilityStudy /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        <Route path="/wood-catalog" element={<Layout><WoodCatalog /></Layout>} />
        <Route path="/book-appointment" element={<Layout><BookAppointment /></Layout>} />
        <Route path="/hotel-advisor" element={<Layout><HotelAdvisor /></Layout>} />
        
        {/* مسارات تسجيل الدخول */}
        <Route path="/admin-login" element={<Layout><Login /></Layout>} />
        <Route path="/client-login" element={<Layout><ClientAuth /></Layout>} />
        
        {/* مسار طلبات العميل - محمي */}
        <Route path="/client-orders" element={
          <ProtectedRoute>
            <Layout>
              <ClientOrders />
            </Layout>
          </ProtectedRoute>
        } />

        {/* مسار الداشبورد (للموظفين والأدمن) - محمي */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* التحويلات والمسارات الافتراضية */}
        <Route path="/my-requests" element={<Navigate to="/client-orders" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}