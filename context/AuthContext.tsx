import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  adminLogin: (username: string, pin: string) => boolean;
  clientLoginContext: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for persisted client session
    const stored = localStorage.getItem('ukra_client_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const adminLogin = (username: string, pin: string): boolean => {
    const foundUser = MOCK_USERS[username];
    if (foundUser && foundUser.pin === pin) {
      const adminUser = {
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
      };
      setUser(adminUser);
      // We don't persist admin login in this demo to keep security simple
      return true;
    }
    return false;
  };

  const clientLoginContext = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ukra_client_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ukra_client_user');
  };

  const isAdmin = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER || user?.role === UserRole.EMPLOYEE;

  return (
    <AuthContext.Provider value={{ user, adminLogin, clientLoginContext, logout, isAuthenticated: !!user, isAdmin }}>
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