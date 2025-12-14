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
import { FurnitureRequest } from './pages/FurnitureRequest';

// Unified Protected Route
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  // Redirect to login if not authenticated
  // We default to client-login for general access, admin-login is specific
  return isAuthenticated ? <>{children}</> : <Navigate to="/client-login" replace />;
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
        {/* Updated: Use new FurnitureRequest page instead of basic form if preferred, keeping old route name for compatibility or adding new one */}
        <Route element={<Layout><FurnitureRequest /></Layout>} path="/furniture-request" />
        <Route element={<Layout><FurnitureQuoteForm /></Layout>} path="/furniture-quote" />
        <Route element={<Layout><FeasibilityStudy /></Layout>} path="/feasibility-study" />
        
        <Route element={<Layout><Login /></Layout>} path="/admin-login" />
        <Route element={<Layout><ClientAuth /></Layout>} path="/client-login" />
        
        {/* Unified Dashboard (Admin & Client) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Redirect legacy /my-requests to dashboard */}
        <Route path="/my-requests" element={<Navigate to="/dashboard" replace />} />
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