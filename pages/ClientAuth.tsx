import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext'; 
import { Phone, ArrowRight, ShieldCheck, Loader } from 'lucide-react';

export const ClientAuth = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart(); 

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // دالة مساعدة لتنسيق الرقم (توحيد الصيغة 966)
  const formatPhoneNumber = (rawPhone: string) => {
    let formatted = rawPhone.replace(/\D/g, ''); // حذف أي رموز
    if (formatted.startsWith('05')) {
      formatted = '966' + formatted.substring(1);
    } else if (formatted.startsWith('5')) {
      formatted = '966' + formatted;
    }
    return formatted;
  };

  // --- 1. إرسال الرمز ---
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      const finalPhone = formatPhoneNumber(phone);
      console.log("Sending OTP to:", finalPhone);

      const response = await fetch('http://167.86.73.97:8080/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: finalPhone,
          message: `رمز التحقق للدخول إلى أوكرة هو: *${code}*\nلا تشارك هذا الرمز مع أحد.`
        })
      });

      if (response.ok) {
        setStep('otp');
      } else {
        alert('فشل في إرسال الرمز، يرجى المحاولة لاحقاً.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. التحقق وتسجيل العميل ---
const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (otp === generatedOtp) {
      try {
        const finalPhone = formatPhoneNumber(phone);

        // 1. البحث عن العميل في Supabase
        let { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', finalPhone)
          .maybeSingle();

        if (error) throw error;

        // 2. إنشاء عميل جديد إذا لم يوجد
        if (!customer) {
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert([{ 
                phone: finalPhone, 
                full_name: 'عميل جديد',
                role: 'customer' // تعيين دور افتراضي للجدد
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          customer = newCustomer;
        }

        // --- التعديل الجوهري لقراءة الصلاحيات ---
        
        // 3. تنظيف البيانات القديمة
        localStorage.clear(); 
        
        // 4. حفظ البيانات الجديدة
        localStorage.setItem('ukra_client_id', customer.id);
        localStorage.setItem('ukra_client_phone', customer.phone);
        localStorage.setItem('isAuthenticated', 'true'); 
        
        // هنا السحر: نقرأ الدور من قاعدة البيانات. إذا كان فارغاً نعتبره عميل
        const userRole = customer.role || 'customer';
        localStorage.setItem('userRole', userRole);

        // 5. تحديث حالة السلة
        await refreshCart(); 

        // 6. التوجيه للداشبورد الموحد
        window.location.href = '#/dashboard'; 
        window.location.reload();

      } catch (err: any) {
        console.error('Login error:', err);
        alert('حدث خطأ أثناء الدخول، تأكد من اتصالك بالإنترنت');
      } finally {
        setLoading(false);
      }
    } else {
      alert('رمز التحقق غير صحيح');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center px-4 bg-gray-50" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1a2a3a] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#c5a059] opacity-10 transform -skew-y-6"></div>
          <h2 className="text-3xl font-bold text-white mb-2 relative z-10">تسجيل دخول العملاء</h2>
          <p className="text-blue-100 relative z-10 text-sm">أدخل رقم جوالك لمتابعة طلباتك وعروض الأسعار</p>
        </div>

        <div className="p-8">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#c5a059] transition-colors" />
                  <input
                    type="tel"
                    required
                    placeholder="05xxxxxxxx"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#c5a059] focus:ring-4 focus:ring-[#c5a059]/10 outline-none transition-all text-right font-num"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2a3a] text-white py-4 rounded-xl font-bold hover:bg-[#c5a059] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {loading ? <Loader className="animate-spin" /> : <>إرسال رمز التحقق <ArrowRight className="h-5 w-5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="text-center mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <ShieldCheck className="h-10 w-10 text-[#c5a059] mx-auto mb-2" />
                <p className="text-gray-600 text-sm">تم إرسال الرمز إلى <b dir="ltr">{formatPhoneNumber(phone)}</b></p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رمز التحقق</label>
                <input
                  type="text"
                  required
                  placeholder="------"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#c5a059] focus:ring-4 focus:ring-[#c5a059]/10 outline-none text-center text-3xl tracking-[1em] font-num"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2a3a] text-white py-4 rounded-xl font-bold hover:bg-[#c5a059] transition-all shadow-lg"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-400 text-sm hover:text-[#1a2a3a] transition-colors"
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