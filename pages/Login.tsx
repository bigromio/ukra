import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestLoginOTP, requestRegisterOTP, verifyUnifiedOTP } from '../services/apiService';
import { Phone, Mail, User as UserIcon, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { dir } = useLanguage();

  const returnUrl = location.state?.from || '/';

  // حالات الشاشة
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone'); // اختيار وسيلة تسجيل الدخول
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // بيانات النموذج
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loginIdentifier, setLoginIdentifier] = useState(''); // للجوال أو الإيميل في حالة الدخول
  const [otpCode, setOtpCode] = useState('');

  // 1. طلب الرمز
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (authMode === 'login') {
      res = await requestLoginOTP(loginIdentifier, loginMethod);
    } else {
      res = await requestRegisterOTP(formData.name, formData.phone, formData.email);
    }

    if (res.success) {
      setStep('otp');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  // 2. التحقق من الرمز
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const identifierToVerify = authMode === 'login' ? loginIdentifier : formData.phone;
    const registerData = authMode === 'register' ? formData : undefined;

    const res = await verifyUnifiedOTP(identifierToVerify, otpCode, registerData);

    if (res.success && res.user) {
      login(res.user);
      navigate(returnUrl, { replace: true });
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-cairo" dir={dir}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        <div className="bg-[#1a2a3a] p-6 text-center relative">
          <button onClick={() => navigate(-1)} className="absolute right-4 top-6 text-gray-400 hover:text-white transition-colors">
            <ArrowRight size={24} />
          </button>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-[#c5a059]" />
          </div>
          <h2 className="text-2xl font-black text-white">UKRA Secure Access</h2>
          <p className="text-gray-400 text-sm mt-1">بوابة الدخول الموحدة</p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg mb-6 text-red-700 text-sm font-bold animate-in fade-in">
              {error}
            </div>
          )}

          {step === 'input' ? (
            <div className="animate-in slide-in-from-right duration-300">
              
              {/* تبويبات التبديل الأساسية (عميل حالي / عميل جديد) */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                <button
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'login' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  عميل مسجل
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'register' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  عميل جديد
                </button>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-4">
                
                {authMode === 'login' ? (
                  <>
                    {/* خيارات تسجيل الدخول للعميل المسجل */}
                    <div className="flex gap-4 mb-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'phone' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="loginMethod" checked={loginMethod === 'phone'} onChange={() => setLoginMethod('phone')} className="hidden" />
                        <Phone size={18} className={loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-400'} />
                        <span className={`font-bold text-sm ${loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-500'}`}>رسالة نصية</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'email' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="loginMethod" checked={loginMethod === 'email'} onChange={() => setLoginMethod('email')} className="hidden" />
                        <Mail size={18} className={loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-400'} />
                        <span className={`font-bold text-sm ${loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-500'}`}>بريد إلكتروني</span>
                      </label>
                    </div>

                    <div>
                      <div className="relative">
                        {loginMethod === 'phone' ? <Phone className="absolute right-3 top-3 text-gray-400" size={20} /> : <Mail className="absolute right-3 top-3 text-gray-400" size={20} />}
                        <input 
                          required 
                          type={loginMethod === 'phone' ? 'tel' : 'email'} 
                          placeholder={loginMethod === 'phone' ? 'أدخل رقم جوالك 05XXXXXXXX' : 'أدخل بريدك الإلكتروني'} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] transition-all font-num text-right" 
                          dir="ltr" 
                          value={loginIdentifier} 
                          onChange={(e) => setLoginIdentifier(e.target.value)} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* حقول تسجيل العميل الجديد */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                      <div className="relative">
                        <UserIcon className="absolute right-3 top-3 text-gray-400" size={20} />
                        <input required type="text" placeholder="الاسم الرباعي" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">رقم الجوال *</label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 text-gray-400" size={20} />
                        <input required type="tel" placeholder="05XXXXXXXX" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] transition-all font-num text-right" dir="ltr" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني *</label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 text-gray-400" size={20} />
                        <input required type="email" placeholder="example@email.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] transition-all font-num text-right" dir="ltr" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">سيتم إرسال رمز التفعيل للوسيلتين معاً لضمان أمان حسابك.</p>
                  </>
                )}

                <button type="submit" disabled={loading} className="w-full bg-[#1a2a3a] hover:bg-opacity-90 text-white font-bold py-4 rounded-xl mt-6 transition-all flex justify-center items-center shadow-md">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (authMode === 'login' ? 'إرسال الرمز' : 'إنشاء حساب جديد')}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-left duration-300 text-center">
              <h3 className="text-xl font-bold text-[#1a2a3a] mb-2">أدخل رمز التحقق</h3>
              <p className="text-gray-500 text-sm mb-6">
                قمنا بإرسال رمز من 4 أرقام إليك، يرجى إدخاله لتأكيد الدخول.
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <input 
                  required 
                  autoFocus
                  type="text" 
                  maxLength={4}
                  placeholder="••••" 
                  className="w-full max-w-[200px] mx-auto bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-4 text-center text-3xl tracking-[1em] font-num outline-none focus:border-[#c5a059] transition-all" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                />

                <button type="submit" disabled={loading || otpCode.length !== 4} className="w-full bg-[#c5a059] hover:bg-yellow-600 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center shadow-md disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'تأكيد الدخول'}
                </button>

                <button type="button" onClick={() => { setStep('input'); setOtpCode(''); }} className="text-sm text-gray-500 hover:text-[#1a2a3a] font-bold underline decoration-dashed underline-offset-4">
                  تعديل البيانات
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};