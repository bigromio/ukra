import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { verifyClientOTP } from '../services/apiService'; // استدعاء الدالة الجديدة
import { supabase } from '../lib/supabase';
import { Phone, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export const ClientAuth = () => {
  const { t, lang, dir } = useLanguage();
  const { refreshCart } = useCart();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // التحقق من الجلسة الحالية
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (isAuth === 'true') {
      window.location.hash = '/dashboard';
    }
  }, []);

  // تنسيق رقم الهاتف
  const formatPhoneNumber = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('05')) clean = '966' + clean.substring(1);
    else if (clean.startsWith('5')) clean = '966' + clean;
    return clean;
  };

  // إرسال الرمز (محاكاة + تخزين في القاعدة للأمان)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      alert(lang === 'ar' ? 'رقم الجوال غير صحيح' : 'Invalid phone number');
      return;
    }
    setLoading(true);

    // محاكاة إرسال OTP (في الإنتاج نربط بـ Unifonic/Twilio)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    
    // تخزين الكود في جدول otp_codes للتحقق منه في الـ Backend
    const finalPhone = formatPhoneNumber(phone);
    await supabase.from('otp_codes').insert({
      phone: finalPhone,
      code: code,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString() // صالح لـ 10 دقائق
    });

    // عرض الكود للتجربة (يجب إزالته في الإنتاج)
    alert(`رمز التحقق المؤقت: ${code}`);
    
    setLoading(false);
    setStep('otp');
  };

  // التحقق من الرمز والدخول
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalPhone = formatPhoneNumber(phone);
    
    // استدعاء دالة التحقق المركزية من apiService
    const response = await verifyClientOTP(finalPhone, otp);

    if (response.success && response.user) {
      // تنظيف الجلسة القديمة
      localStorage.clear();
      
      // حفظ بيانات الجلسة الجديدة
      localStorage.setItem('ukra_client_id', response.user.id);
      localStorage.setItem('ukra_client_phone', response.user.phone);
      localStorage.setItem('isAuthenticated', 'true');
      
      // *** النقطة الأهم: حفظ الدور (Role) ***
      localStorage.setItem('userRole', response.user.role); 

      // تحديث السلة
      await refreshCart();

      // التوجيه للداشبورد
      window.location.hash = '/dashboard';
      window.location.reload();
    } else {
      alert(lang === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid OTP');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] px-4 font-tajawal" dir={dir}>
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1a2a3a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1a2a3a]/20">
             <ShieldCheck className="text-[#c5a059] w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#1a2a3a] mb-2">UKRA <span className="text-[#c5a059]">LOGIN</span></h1>
          <p className="text-gray-400 text-sm font-bold">
            {lang === 'ar' ? 'بوابة الدخول الموحدة' : 'Unified Access Portal'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'ar' ? 'رقم الجوال' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="absolute top-4 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-bold text-lg rtl:pr-12 rtl:pl-4"
                  dir="ltr"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {lang === 'ar' ? 'إرسال الرمز' : 'Send Code'} 
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {lang === 'ar' ? 'رمز التحقق المرسل' : 'Verification Code'}
              </label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="XXXX"
                className="w-full py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-black text-2xl text-center tracking-widest"
                maxLength={4}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#c5a059] text-white rounded-xl font-bold hover:bg-[#b08d4a] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : (lang === 'ar' ? 'دخول' : 'Verify & Login')}
            </button>
            <button 
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-gray-400 text-sm font-bold hover:text-[#1a2a3a]"
            >
              {lang === 'ar' ? 'تغيير الرقم' : 'Change Number'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};