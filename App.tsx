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
import { ClientOrders } from './pages/ClientOrders';
import { Home } from './pages/Home';
import { DesignRequest } from './pages/DesignRequest';
import { FeasibilityStudy } from './pages/FeasibilityStudy';

// Protected Route Wrapper for Admin
const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? children : <Navigate to="/admin-login" replace />;
};

// Protected Route for Client
const ClientRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/client-login" replace />;
};

const AppContent = () => {
  useGeofence();
  return (
    <>
      <InstallModal />
      <Routes>
        {/* Public Routes with Layout */}
        <Route element={<Layout><Home /></Layout>} path="/" />
        <Route element={<Layout><DesignRequest /></Layout>} path="/design-request" />
        <Route element={<Layout><FurnitureQuoteForm /></Layout>} path="/furniture-quote" />
        <Route element={<Layout><FeasibilityStudy /></Layout>} path="/feasibility-study" />
        <Route element={<Layout><Login /></Layout>} path="/admin-login" />
        
        {/* Client Auth Routes */}
        <Route element={<Layout><ClientAuth /></Layout>} path="/client-login" />
        <Route element={<Layout><ClientRoute><ClientOrders /></ClientRoute></Layout>} path="/my-requests" />
        
        {/* Admin Dashboard (No Layout) */}
        <Route path="/dashboard" element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        } />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}