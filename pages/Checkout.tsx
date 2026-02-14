import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyClientOTP, createStoreOrder } from '../services/apiService';
import { supabase } from '../lib/supabase';
import { 
  ShoppingBag, MapPin, Phone, CheckCircle, ArrowRight, ArrowLeft, 
  Loader2, ShieldCheck, Truck, AlertCircle 
} from 'lucide-react';

export const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { t, lang, dir } = useLanguage();

  // الحالة العامة للصفحة
  const [step, setStep] = useState<'auth' | 'shipping' | 'success'>('auth');
  const [loading, setLoading] = useState(false);
  
  // بيانات المستخدم والتوثيق
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // بيانات الشحن
  const [address, setAddress] = useState({ city: '', district: '', street: '', notes: '' });

  // التحقق عند التحميل
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const storedPhone = localStorage.getItem('ukra_client_phone');
      const storedId = localStorage.getItem('ukra_client_id');

      if (isAuth && storedPhone) {
        setIsAuthenticated(true);
        setPhone(storedPhone);
        setUserId(storedId);
        setStep('shipping'); // تخطي خطوة التوثيق إذا كان مسجلاً
      }
    };
    checkAuth();
  }, []);

  // 1. التعامل مع التوثيق (WhatsApp First)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      alert(lang === 'ar' ? 'رقم الجوال غير صحيح' : 'Invalid phone');
      return;
    }
    setLoading(true);
    
    // محاكاة إرسال الرمز وتخزينه في القاعدة
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    // يجب تنسيق الرقم ليبدأ بـ 966
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);
    
    await supabase.from('otp_codes').insert({
        phone: formattedPhone,
        code: code,
        expires_at: new Date(Date.now() + 10 * 60000).toISOString()
    });

    // في الواقع، هنا يتم استدعاء API الواتساب
    alert(`OTP: ${code}`); // للتجربة فقط
    
    setShowOtpInput(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    const res = await verifyClientOTP(formattedPhone, otp);

    if (res.success && res.user) {
      // حفظ الجلسة
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('ukra_client_id', res.user.id);
      localStorage.setItem('ukra_client_phone', res.user.phone);
      
      setUserId(res.user.id);
      setIsAuthenticated(true);
      setStep('shipping');
    } else {
      alert(lang === 'ar' ? 'رمز التحقق خاطئ' : 'Invalid OTP');
    }
    setLoading(false);
  };

  // 2. إرسال الطلب النهائي
  const handleSubmitOrder = async () => {
    if (!address.city || !address.street) {
      alert(lang === 'ar' ? 'الرجاء تعبئة بيانات العنوان' : 'Address details required');
      return;
    }
    setLoading(true);

    const orderData = {
      clientId: userId,
      items: cart,
      total: total,
      address: address,
      notes: address.notes
    };

    const res = await createStoreOrder(orderData);

    if (res.success) {
      setStep('success');
      clearCart();
      // هنا سيتم إطلاق إشعار الواتساب في المرحلة القادمة
    } else {
      alert(lang === 'ar' ? 'حدث خطأ أثناء الطلب' : 'Error placing order');
    }
    setLoading(false);
  };

  // --- واجهة النجاح ---
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95" dir={dir}>
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-[#1a2a3a] mb-4">
          {lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}
        </h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">
          {lang === 'ar' 
            ? 'شكراً لثقتك بنا. تم إرسال تفاصيل الطلب والفاتورة إلى الواتساب الخاص بك. سيقوم فريق المبيعات بالتواصل معك قريباً لتأكيد الشحن.' 
            : 'Thank you. Order details have been sent to your WhatsApp. Our team will contact you shortly.'}
        </p>
        <a href="#/" className="px-8 py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all">
          {lang === 'ar' ? 'العودة للرئيسية' : 'Back Home'}
        </a>
      </div>
    );
  }

  // --- واجهة السلة الفارغة ---
  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
        <p className="text-gray-400 font-bold mb-6">{lang === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}</p>
        <a href="#/store" className="px-6 py-3 bg-[#1a2a3a] text-white rounded-xl font-bold">
          {lang === 'ar' ? 'تصفح المتجر' : 'Go to Store'}
        </a>
      </div>
    );
  }

  // --- الواجهة الرئيسية (Checkout Flow) ---
  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12 px-4 font-tajawal" dir={dir}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الأيمن: خطوات الطلب */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. التوثيق (Identity) */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'auth' ? 'border-[#c5a059] shadow-lg ring-1 ring-[#c5a059]/20' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isAuthenticated ? 'bg-green-500' : 'bg-[#1a2a3a]'}`}>
                 {isAuthenticated ? <CheckCircle size={20} /> : '1'}
               </div>
               <h3 className="text-xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'بيانات التواصل (واتساب)' : 'Contact Info (WhatsApp)'}</h3>
             </div>

             {!isAuthenticated ? (
               <div className="space-y-4 max-w-md">
                 <p className="text-sm text-gray-500 font-bold">
                   {lang === 'ar' ? 'رقمك هو هويتك. سنرسل لك الفاتورة وحالة الطلب عليه.' : 'Your number is your ID. We send invoice & updates there.'}
                 </p>
                 
                 {!showOtpInput ? (
                   <form onSubmit={handleRequestOtp} className="flex gap-4">
                     <input 
                       type="tel" 
                       value={phone}
                       onChange={e => setPhone(e.target.value)}
                       placeholder="05xxxxxxxx"
                       className="flex-1 p-4 bg-gray-50 rounded-xl font-bold text-lg focus:ring-2 focus:ring-[#c5a059] outline-none"
                       dir="ltr"
                     />
                     <button type="submit" disabled={loading} className="px-6 bg-[#1a2a3a] text-white rounded-xl font-bold">
                       {loading ? <Loader2 className="animate-spin" /> : <ArrowRight className="rtl:rotate-180" />}
                     </button>
                   </form>
                 ) : (
                   <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                      <div className="bg-yellow-50 p-3 rounded-xl text-xs text-yellow-700 font-bold flex gap-2">
                        <AlertCircle size={16} />
                        {lang === 'ar' ? 'تم إرسال الرمز (محاكاة: انظر التنبيه)' : 'Code sent (Simulation: Check alert)'}
                      </div>
                      <input 
                        type="text" 
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="XXXX"
                        className="w-full p-4 bg-gray-50 rounded-xl font-black text-center text-2xl tracking-widest focus:ring-2 focus:ring-[#c5a059] outline-none"
                        maxLength={4}
                      />
                      <button type="submit" disabled={loading} className="w-full py-4 bg-[#c5a059] text-white rounded-xl font-bold hover:bg-[#b08d4a] transition-all">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (lang === 'ar' ? 'تأكيد ومتابعة' : 'Verify & Continue')}
                      </button>
                   </form>
                 )}
               </div>
             ) : (
               <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl">
                 <div className="font-bold text-green-800 flex items-center gap-2">
                   <Phone size={16} /> <span dir="ltr">{phone}</span>
                 </div>
                 <button onClick={() => { setIsAuthenticated(false); setStep('auth'); localStorage.clear(); }} className="text-xs text-green-600 underline font-bold">
                   {lang === 'ar' ? 'تغيير' : 'Change'}
                 </button>
               </div>
             )}
          </div>

          {/* 2. العنوان والشحن (Shipping) */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'shipping' ? 'border-[#c5a059] shadow-lg ring-1 ring-[#c5a059]/20' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step === 'shipping' ? 'bg-[#1a2a3a]' : 'bg-gray-300'}`}>
                 2
               </div>
               <h3 className="text-xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}</h3>
             </div>

             {step === 'shipping' && (
               <div className="space-y-4 animate-in slide-in-from-top-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                      <input type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'ar' ? 'الحي' : 'District'}</label>
                      <input type="text" value={address.district} onChange={e => setAddress({...address, district: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'ar' ? 'اسم الشارع / وصف الموقع' : 'Street / Description'}</label>
                    <input type="text" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{lang === 'ar' ? 'ملاحظات إضافية' : 'Notes'}</label>
                    <textarea value={address.notes} onChange={e => setAddress({...address, notes: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#c5a059]" rows={2}></textarea>
                 </div>
               </div>
             )}
          </div>

        </div>

        {/* العمود الأيسر: ملخص الطلب */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-6">
             <h3 className="text-lg font-black text-[#1a2a3a] mb-6 border-b pb-4">{lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>
             
             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ShoppingBag className="m-auto text-gray-400 mt-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1a2a3a] line-clamp-1">{lang === 'ar' ? item.name_ar : item.name_en}</p>
                      <p className="text-xs text-gray-400">Qty: 1</p>
                    </div>
                    <div className="font-bold text-[#c5a059] text-sm">{item.price}</div>
                 </div>
               ))}
             </div>

             <div className="space-y-2 border-t pt-4 text-sm mb-6">
               <div className="flex justify-between text-gray-500">
                 <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                 <span>{total} SAR</span>
               </div>
               <div className="flex justify-between text-gray-500">
                 <span>{lang === 'ar' ? 'الشحن والتوصيل' : 'Shipping'}</span>
                 <span className="text-green-600 font-bold">{lang === 'ar' ? 'يحدد لاحقاً' : 'TBD'}</span>
               </div>
               <div className="flex justify-between text-xl font-black text-[#1a2a3a] pt-2">
                 <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                 <span>{total} SAR</span>
               </div>
             </div>

             <button 
               onClick={handleSubmitOrder}
               disabled={step !== 'shipping' || loading}
               className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
             >
               {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <ShieldCheck size={20} />
                    {lang === 'ar' ? 'اعتماد الطلب' : 'Confirm Order'}
                  </>
               )}
             </button>
             
             <p className="text-[10px] text-gray-400 text-center mt-4">
               {lang === 'ar' 
                 ? 'بالضغط على اعتماد، سيتم إرسال الفاتورة إلى الواتساب الخاص بك والموافقة على الشروط.' 
                 : 'By confirming, invoice will be sent to your WhatsApp & you agree to terms.'}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};