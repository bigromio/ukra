import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { registerClient, verifyClientOTP, loginClient } from '../services/apiService';
import { Loader2, Mail, Lock, User as UserIcon, Phone, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const ClientAuth = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const { t, lang, dir } = useLanguage();
  const { login } = useAuth();
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
      login({
        name: res.user.name,
        email: res.user.email,
        role: UserRole.CLIENT,
        phone: res.user.phone
      });
      // Redirect to the unified dashboard
      navigate('/dashboard');
    } else {
      alert(res.message || (lang === 'ar' ? "فشل تسجيل الدخول" : "Login failed"));
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await registerClient(formData.fullName, formData.email, formData.phone, formData.password);
    setLoading(false);

    if (res.success) {
      setMode('otp');
    } else {
      alert(res.message || (lang === 'ar' ? "فشل التسجيل" : "Registration failed."));
    }
  };

  // 3. Verify OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await verifyClientOTP(formData.email, formData.otp, formData);
    setLoading(false);

    if (res.success) {
      login({
        name: res.user.name,
        email: res.user.email,
        role: UserRole.CLIENT,
        phone: formData.phone
      });
      navigate('/dashboard');
    } else {
      alert(res.message || (lang === 'ar' ? "رمز التحقق غير صحيح" : "Invalid OTP Code"));
    }
  };

  const iconPos = dir === 'rtl' ? 'right-3' : 'left-3';
  const inputPad = dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-24 font-cairo" dir={dir}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="bg-ukra-navy h-24 flex items-center justify-center">
            <h2 className="text-white text-2xl font-bold">
                {mode === 'login' ? t('auth_welcome') : mode === 'register' ? t('auth_create') : t('auth_verify')}
            </h2>
        </div>

        <div className="p-8">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_email')}</label>
                 <div className="relative mt-1">
                    <Mail className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="email" type="email" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_pass')}</label>
                 <div className="relative mt-1">
                    <Lock className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="password" type="password" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <button disabled={loading} className="btn-main w-full flex justify-center items-center mt-4">
                 {loading ? <Loader2 className="animate-spin" /> : t('auth_signin')}
              </button>
              <div className="text-center mt-4 text-sm">
                {t('auth_no_account')} <span onClick={() => setMode('register')} className="text-ukra-gold font-bold cursor-pointer hover:underline">{t('auth_reg_now')}</span>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_name')}</label>
                 <div className="relative mt-1">
                    <UserIcon className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="fullName" type="text" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_phone')}</label>
                 <div className="relative mt-1">
                    <Phone className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="phone" type="tel" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_email')}</label>
                 <div className="relative mt-1">
                    <Mail className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="email" type="email" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">{t('auth_pass')}</label>
                 <div className="relative mt-1">
                    <Lock className={`absolute top-3 ${iconPos} w-5 h-5 text-gray-400`} />
                    <input required name="password" type="password" className={`w-full ${inputPad} py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-ukra-gold focus:border-ukra-gold`} onChange={handleChange} />
                 </div>
              </div>
              <button disabled={loading} className="btn-main w-full flex justify-center items-center mt-4">
                 {loading ? <Loader2 className="animate-spin" /> : <>{t('auth_next')} {dir === 'rtl' ? <ArrowRight className="mr-2 w-4 h-4 rotate-180" /> : <ArrowRight className="ml-2 w-4 h-4" />}</>}
              </button>
              <div className="text-center mt-4 text-sm">
                {t('auth_have_account')} <span onClick={() => setMode('login')} className="text-ukra-gold font-bold cursor-pointer hover:underline">{t('auth_login_link')}</span>
              </div>
            </form>
          )}

          {mode === 'otp' && (
             <form onSubmit={handleVerify} className="space-y-6 text-center">
                <div className="bg-green-50 p-4 rounded-lg text-green-700 text-sm">
                   {t('auth_code_sent')} <b>{formData.email}</b>
                </div>
                <div>
                   <label className="text-sm font-bold text-gray-700 mb-2 block">{t('auth_enter_code')}</label>
                   <input required name="otp" type="text" placeholder="XXXX" className="w-full text-center text-3xl tracking-widest py-3 border-2 border-gray-200 rounded-xl focus:border-ukra-gold outline-none" onChange={handleChange} maxLength={4} />
                </div>
                <button disabled={loading} className="btn-main w-full flex justify-center items-center">
                   {loading ? <Loader2 className="animate-spin" /> : t('auth_verify_btn')}
                </button>
                <div onClick={() => setMode('register')} className="text-xs text-gray-400 cursor-pointer mt-4">{t('auth_wrong_email')}</div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};