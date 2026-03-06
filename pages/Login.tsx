
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { requestUnifiedOTP, verifyUnifiedOTP } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { Hexagon, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const Login = () => {
  const [identifier, setIdentifier] = useState(''); // الإيميل أو الجوال
  const [otpCode, setOtpCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

// 1. طلب الرمز (بإدخال وسيلة واحدة، وسحب الأخرى من الداتابيز)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // تنظيف المدخل لمعرفة ما إذا كان رقم جوال أم إيميل
      let cleanId = identifier.replace(/\D/g, '');
      if (cleanId.startsWith('05')) cleanId = '966' + cleanId.substring(1);
      const isPhone = cleanId.length >= 9 && /^\d+$/.test(cleanId);

      // البحث عن المستخدم لجلب بياناته الأخرى (الإيميل إذا أدخل جوال، والعكس)
      const { data: userProfile } = await supabase
        .from('customers')
        .select('phone, email, role')
        .or(`phone.eq.${isPhone ? cleanId : 'none'},email.eq.${identifier}`)
        .maybeSingle();

      if (!userProfile) {
        setError('المستخدم غير موجود في النظام. يرجى التحقق من البيانات.');
        setLoading(false);
        return;
      }

      // التحقق من الصلاحيات قبل إرسال الرمز (بما أنها صفحة الإدارة)
      if (userProfile.role !== UserRole.OWNER && userProfile.role !== UserRole.MANAGER && userProfile.role !== UserRole.EMPLOYEE && userProfile.role !== 'staff') {
         setError('عذراً، لا تملك صلاحيات الدخول للوحة التحكم.');
         setLoading(false);
         return;
      }

      // تجهيز الإيميل والجوال لإرسال الرمز لهما معاً
      const phoneToSend = userProfile.phone || (isPhone ? cleanId : '');
      const emailToSend = userProfile.email || (!isPhone ? identifier : '');

      const success = await requestUnifiedOTP(phoneToSend, emailToSend);
      
      if (success) {
        setShowOTP(true);
      } else {
        setError('فشل إرسال رمز التحقق، يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بقاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // 2. التحقق من الرمز وتسجيل الدخول الفعلي
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) return setError('الرجاء إدخال رمز صحيح من 4 أرقام');
    
    setError('');
    setLoading(true);

    try {
      const res = await verifyUnifiedOTP(identifier, otpCode);
      
      if (res.success && res.user) {
        const role = res.user.role;
        // التأكد النهائي من الصلاحيات بعد التوثيق
        if (role === UserRole.OWNER || role === UserRole.MANAGER || role === UserRole.EMPLOYEE || role === 'staff') {
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
        setError(res.message || 'الرمز غير صحيح أو منتهي الصلاحية.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق.');
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="min-h-screen bg-ukra-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-32 font-cairo" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-ukra-gold">
          <Hexagon className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          تسجيل دخول الإدارة
        </h2>
        <p className="text-center text-gray-400 text-sm mt-2">Staff & Management Access</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border-t-4 border-ukra-gold">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
               <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {!showOTP ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                   تسجيل الدخول بواسطة (الجوال أو الإيميل)
                </label>
                <input
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ukra-gold focus:border-ukra-gold font-bold text-left"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@ukra.sa  أو  05xxxxxxxx"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-ukra-navy bg-ukra-gold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ukra-gold disabled:opacity-70 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال رمز التحقق'}
              </button>
            </form>
          ) : (
            <form className="space-y-6 animate-in fade-in zoom-in duration-300" onSubmit={handleVerifyOtp}>
               <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-ukra-navy mb-2">التحقق من الهوية</h3>
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-800 text-xs font-bold mt-2">
                     تم إرسال رمز التحقق إلى حسابك (الواتساب والإيميل معاً). يرجى إدخال الرمز من أي منهما.
                  </div>
               </div>

               <div>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    className="appearance-none block w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-300 focus:outline-none focus:ring-ukra-gold focus:border-ukra-gold text-center text-3xl tracking-[1em] font-black"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="----"
                    dir="ltr"
                  />
               </div>

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-ukra-navy bg-ukra-gold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ukra-gold disabled:opacity-70 transition-all"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'الدخول للوحة التحكم'}
               </button>

               <button 
                 type="button"
                 onClick={() => setShowOTP(false)} 
                 className="w-full text-sm text-gray-500 underline mt-4 font-bold hover:text-ukra-navy transition-colors"
               >
                  تعديل البيانات وإعادة الإرسال
               </button>
            </form>
          )}
          
          <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
             <p>نظام التحقق الموحد (Unified OTP) - UKRA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
