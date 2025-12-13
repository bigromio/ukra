import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  adminLogin: (username: string, pin: string) => boolean; // Keep for legacy PIN login compatibility
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for persisted session
    const stored = localStorage.getItem('ukra_user_session');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Unified Login Function
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ukra_user_session', JSON.stringify(userData));
  };

  // Legacy Admin Login (Mock)
  const adminLogin = (username: string, pin: string): boolean => {
    const foundUser = MOCK_USERS[username];
    if (foundUser && foundUser.pin === pin) {
      const adminUser: User = {
        email: username + '@ukra.sa', // Fake email for admin
        role: foundUser.role,
        name: foundUser.name,
        username: foundUser.username
      };
      login(adminUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ukra_user_session');
  };

  const isAdmin = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER || user?.role === UserRole.EMPLOYEE;
  const isClient = user?.role === UserRole.CLIENT;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin, 
      logout, 
      isAuthenticated: !!user, 
      isAdmin,
      isClient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};