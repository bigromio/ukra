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
import { Home } from './pages/Home';
import { DesignRequest } from './pages/DesignRequest';
import { FeasibilityStudy } from './pages/FeasibilityStudy';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
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
        <Route path="/furniture-quote" element={<Layout><FurnitureQuoteForm /></Layout>} />
        <Route path="/feasibility-study" element={<Layout><FeasibilityStudy /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/admin-login" element={<Login />} />
        
        {/* Private Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
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