import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { fetchUserRole } from '../services/apiService';

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
    const initAuth = async () => {
      // 1. Load from local storage first for speed
      const stored = localStorage.getItem('ukra_user_session');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);

        // 2. Background check: Sync role with server
        // Only if it's not a legacy mock admin (who has no email usually, or we skip for them)
        if (parsedUser.email && !MOCK_USERS[parsedUser.username]) {
           try {
             const res = await fetchUserRole(parsedUser.email);
             if (res && res.success) {
                // If role changed in sheet, update it here
                if (res.role !== parsedUser.role || res.name !== parsedUser.name) {
                  const updatedUser = { 
                    ...parsedUser, 
                    role: res.role as UserRole,
                    name: res.name || parsedUser.name,
                    phone: res.phone || parsedUser.phone
                  };
                  setUser(updatedUser);
                  localStorage.setItem('ukra_user_session', JSON.stringify(updatedUser));
                  console.log("User Profile Synced with Server:", updatedUser.role);
                }
             }
           } catch (e) {
             console.warn("Failed to sync user profile with server (offline?)");
           }
        }
      }
    };

    initAuth();
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