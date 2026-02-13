import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

// لاحظ: نستخدم export const بدلاً من export default ليتوافق مع App.tsx
export const ClientAuth = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // --- دالة إرسال الرمز ---
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. توليد رمز عشوائي
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      // 2. تنسيق الرقم (إزالة الصفر في البداية وإضافة 966)
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('05')) {
        formattedPhone = '966' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('5')) {
        formattedPhone = '966' + formattedPhone;
      }

      // 3. إرسال الرمز عبر بوت الواتساب
      const response = await fetch('http://167.86.73.97:8080/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedPhone,
          message: `رمز التحقق للدخول إلى أوكرة هو: *${code}*\nلا تشارك هذا الرمز مع أحد.`
        })
      });

      if (response.ok) {
        setStep('otp');
      } else {
        alert('فشل في إرسال الرمز، يرجى المحاولة لاحقاً');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // --- دالة التحقق من الرمز ---
  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (otp === generatedOtp) {
      // الرمز صحيح!
      
      // حفظ حالة الدخول (يمكنك تعديل هذا الجزء ليتوافق مع AuthContext لاحقاً)
      localStorage.setItem('ukra_user_phone', phone);
      localStorage.setItem('isAuthenticated', 'true');
      
      // التوجيه للوحة التحكم (Dashboard) لأنها المسار الموجود في App.tsx
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      alert('رمز التحقق غير صحيح');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#3A5A7B] p-8 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-2">مرحباً بك</h2>
          <p className="text-blue-100">سجل دخولك لمتابعة طلباتك ومشاريعك</p>
        </div>

        <div className="p-8">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="05xxxxxxxx"
                    className="w-full pr-10 pl-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none text-left"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3A5A7B] text-white py-3 rounded-xl font-bold hover:bg-[#2c445d] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <ShieldCheck className="h-12 w-12 text-[#BFA78A] mx-auto mb-2" />
                <p className="text-gray-600">تم إرسال رمز التحقق إلى {phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رمز التحقق</label>
                <input
                  type="text"
                  required
                  placeholder="******"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#BFA78A] focus:border-transparent outline-none text-center text-2xl tracking-widest"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3A5A7B] text-white py-3 rounded-xl font-bold hover:bg-[#2c445d] transition-colors"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-500 text-sm hover:text-[#3A5A7B]"
              >
                تغيير رقم الجوال
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};