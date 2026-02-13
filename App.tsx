
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
import { HotelAdvisor } from './pages/HotelAdvisor'; // Imported
import FurnitureStore from './pages/FurnitureStore';
import { CartProvider } from './context/CartContext';
import Checkout from './pages/Checkout';
import { ClientOrders } from './pages/ClientOrders';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated: isStaffAuthenticated } = useAuth();
  
  // التحقق من وجود جلسة عميل (WhatsApp Login) أو جلسة موظف
  const isClientAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const hasClientId = !!localStorage.getItem('ukra_client_id');

  if (!isStaffAuthenticated && !(isClientAuthenticated && hasClientId)) {
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
        {/* Public Routes with Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/design-request" element={<Layout><DesignRequest /></Layout>} />
        <Route path="/store" element={<Layout><FurnitureStore /></Layout>} />
        {/* Updated: Use new FurnitureRequest page instead of basic form if preferred */}
        <Route path="/furniture-quote" element={<Layout><FurnitureQuoteForm /></Layout>} />
        <Route path="/feasibility-study" element={<Layout><FeasibilityStudy /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
        
        {/* New Wood Catalog Page */}
        <Route path="/wood-catalog" element={<Layout><WoodCatalog /></Layout>} />
        
        {/* New Book Appointment Page */}
        <Route path="/book-appointment" element={<Layout><BookAppointment /></Layout>} />

        {/* New Hotel Advisor Wizard */}
        <Route path="/hotel-advisor" element={<Layout><HotelAdvisor /></Layout>} />
        
        <Route path="/admin-login" element={<Layout><Login /></Layout>} />
        <Route path="/client-login" element={<Layout><ClientAuth /></Layout>} />
        
        <Route path="/client-orders" element={
        <ProtectedRoute>
          <Layout>
            <ClientOrders />
          </Layout>
        </ProtectedRoute>
      } />

      {/* تحديث مسار الداشبورد العام (للموظفين والأدمن) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
        {/* Unified Dashboard (Admin & Client) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Redirect legacy /my-requests to dashboard */}
        <Route path="/my-requests" element={<Navigate to="/dashboard" replace />} />
        
        {/* Fallback */}
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
