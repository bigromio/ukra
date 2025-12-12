import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { registerClient, verifyClientOTP, loginClient } from '../services/apiService';
import { Loader2, Mail, Lock, User as UserIcon, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';

export const ClientAuth = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLanguage();
  const { clientLoginContext } = useAuth();
  const navigate = useNavigate();

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    otp: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginClient(formData.email, formData.password);
    setLoading(false);
    
    if (res.success) {
      clientLoginContext({
        name: res.user.name,
        email: res.user.email,
        role: UserRole.CLIENT
      });
      navigate('/my-requests');
    } else {
      alert("Login failed. Please check your credentials.");
    }
  };

  // 2. Handle Register (Send OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await registerClient(formData.fullName, formData.email, formData.phone, formData.password);
    setLoading(false);

    if (res.success) {
      setMode('otp');
    } else {
      alert(res.message || "Registration failed.");
    }
  };

  // 3. Verify OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await verifyClientOTP(formData.email, formData.otp, formData);
    setLoading(false);

    if (res.success) {
      clientLoginContext({
        name: res.user.name,
        email: res.user.email,
        role: UserRole.CLIENT
      });
      navigate('/my-requests');
    } else {
      alert("Invalid OTP Code");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-24 font-cairo">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="bg-ukra-navy h-24 flex items-center justify-center">
            <h2 className="text-white text-2xl font-bold">
                {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Verification'}
            </h2>
        </div>

        <div className="p-8">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                 <label className="text-sm font-bold text-gray-700">Email Address</label>
                 <div className="relative mt-1">
                    <Mail className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">Password</label>
                 <div className="relative mt-1">
                    <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="password" type="password" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <button disabled={loading} className="btn-main w-full flex justify-center items-center mt-4">
                 {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
              </button>
              <div className="text-center mt-4 text-sm">
                Don't have an account? <span onClick={() => setMode('register')} className="text-ukra-gold font-bold cursor-pointer hover:underline">Register Now</span>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                 <label className="text-sm font-bold text-gray-700">Full Name</label>
                 <div className="relative mt-1">
                    <UserIcon className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="fullName" type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">Phone</label>
                 <div className="relative mt-1">
                    <Phone className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="phone" type="tel" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">Email</label>
                 <div className="relative mt-1">
                    <Mail className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">Password</label>
                 <div className="relative mt-1">
                    <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                    <input required name="password" type="password" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold" onChange={handleChange} />
                 </div>
              </div>
              <button disabled={loading} className="btn-main w-full flex justify-center items-center mt-4">
                 {loading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight className="ml-2 w-4 h-4" /></>}
              </button>
              <div className="text-center mt-4 text-sm">
                Already have an account? <span onClick={() => setMode('login')} className="text-ukra-gold font-bold cursor-pointer hover:underline">Login</span>
              </div>
            </form>
          )}

          {mode === 'otp' && (
             <form onSubmit={handleVerify} className="space-y-6 text-center">
                <div className="bg-green-50 p-4 rounded-lg text-green-700 text-sm">
                   We sent a verification code to <b>{formData.email}</b>
                </div>
                <div>
                   <label className="text-sm font-bold text-gray-700 mb-2 block">Enter Code</label>
                   <input required name="otp" type="text" placeholder="XXXX" className="w-full text-center text-3xl tracking-widest py-3 border-2 border-gray-200 rounded-xl focus:border-ukra-gold outline-none" onChange={handleChange} maxLength={4} />
                </div>
                <button disabled={loading} className="btn-main w-full flex justify-center items-center">
                   {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                </button>
                <div onClick={() => setMode('register')} className="text-xs text-gray-400 cursor-pointer mt-4">Wrong Email? Go Back</div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};