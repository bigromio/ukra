import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
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
import Checkout from './pages/Checkout';

// حماية المسار: يسمح للموظفين (AuthContext) والعملاء (LocalStorage)
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated: isStaff } = useAuth();
  const isClient = localStorage.getItem('isAuthenticated') === 'true';

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
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/store" element={<Layout><FurnitureStore /></Layout>} />
        <Route path="/wood-catalog" element={<Layout><WoodCatalog /></Layout>} />
        <Route path="/hotel-advisor" element={<Layout><HotelAdvisor /></Layout>} />
        <Route path="/design-request" element={<Layout><DesignRequest /></Layout>} />
        <Route path="/furniture-quote" element={<Layout><FurnitureQuoteForm /></Layout>} />
        <Route path="/feasibility-study" element={<Layout><FeasibilityStudy /></Layout>} />
        <Route path="/book-appointment" element={<Layout><BookAppointment /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/client-login" element={<Layout><ClientAuth /></Layout>} />
        <Route path="/admin-login" element={<Layout><Login /></Layout>} />
        
        {/* Unified Dashboard Route (The Smart Hub) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Redirects */}
        <Route path="/client-orders" element={<Navigate to="/dashboard" replace />} />
        <Route path="/my-requests" element={<Navigate to="/dashboard" replace />} />
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