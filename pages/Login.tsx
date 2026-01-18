
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { loginClient } from '../services/apiService';
import { Hexagon, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Try Legacy PIN Login (Mock Data)
    if (adminLogin(username, password)) {
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // 2. Try Supabase Auth (Email/Password)
    try {
      // Treat 'username' input as email for Supabase
      const res = await loginClient(username, password);
      
      if (res.success) {
        // Check if user has admin privileges
        const role = res.user.role;
        if (role === UserRole.OWNER || role === UserRole.MANAGER || role === UserRole.EMPLOYEE) {
           login({
             id: res.user.id,
             name: res.user.name,
             email: res.user.email,
             role: role,
             phone: res.user.phone,
             avatar_url: res.user.avatar_url
           });
           navigate('/dashboard');
        } else {
           setError('Access Denied: You do not have administrative privileges.');
        }
      } else {
        setError(res.message || t('login_error'));
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ukra-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-32">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-ukra-gold">
          <Hexagon className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Admin Login
        </h2>
        <p className="text-center text-gray-400 text-sm mt-2">Staff & Management Access</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email or Username</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ukra-gold focus:border-ukra-gold sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@ukra.sa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password or PIN</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ukra-gold focus:border-ukra-gold sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-ukra-navy bg-ukra-gold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ukra-gold disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Dashboard'}
              </button>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-500">
               <p>{t('login_demo')}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
