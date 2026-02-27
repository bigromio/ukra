import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  verifyClientOTP, 
  createStoreOrder, 
  requestClientOTP, 
  uploadOrderPDF, 
  sendWhatsAppPDF,
  fetchActiveCountries, // ✅ جديد
  fetchActiveCities,    // ✅ جديد
  getCustomerProfile,   // ✅ جديد
  saveCustomerAddress,   // ✅ جديد
  validateCoupon
} from '../services/apiService';
import { pdf } from '@react-pdf/renderer'; 
import { QuotationDocument } from '../components/PDF/QuotationDocument';
import { 
  ShoppingBag, Phone, CheckCircle, ArrowRight, 
  Loader2, ShieldCheck, AlertCircle, MapPin 
} from 'lucide-react';

const Checkout = () => {
  const { items: cart, totalAmount: total, clearCart } = useCart();
  const { t, lang, dir } = useLanguage();

  const [step, setStep] = useState<'auth' | 'shipping' | 'success'>('auth');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- States للمواقع ---
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // العنوان
  const [address, setAddress] = useState({ city: '', district: '', street: '', notes: '' });

  // --- متغيرات الكوبون ---
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount_type === 'percentage' 
      ? (total * appliedCoupon.discount_value) / 100 
      : appliedCoupon.discount_value;
  };

  const finalTotal = total - calculateDiscount();
  // 1. تحميل الدول عند فتح الصفحة
  useEffect(() => {
    const loadCountries = async () => {
      const data = await fetchActiveCountries();
      setCountries(data);
      // اختيار السعودية افتراضياً إذا وجدت
      const ksa = data.find((c: any) => c.code === 'SA');
      if (ksa) {
        setSelectedCountry(ksa.id);
        loadCities(ksa.id);
      }
    };
    loadCountries();
    checkAuth(); // التحقق من الدخول
  }, []);

  // 2. تحميل المدن عند تغيير الدولة
  const loadCities = async (countryId: string) => {
    const data = await fetchActiveCities(countryId);
    setCities(data);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setSelectedCountry(cId);
    loadCities(cId);
    setAddress({ ...address, city: '' }); // تصفير المدينة عند تغيير الدولة
  };

  // 3. التحقق من الدخول وجلب العنوان المحفوظ
  const checkAuth = async () => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedPhone = localStorage.getItem('ukra_client_phone');
    const storedId = localStorage.getItem('ukra_client_id');

    if (isAuth && storedPhone && storedId) {
      setIsAuthenticated(true);
      setPhone(storedPhone);
      setUserId(storedId);
      
      // ✅ جلب بيانات العميل وتعبئة العنوان تلقائياً
      const profile = await getCustomerProfile(storedId);
      if (profile) {
        setAddress(prev => ({
          ...prev,
          city: profile.default_city || '',
          district: profile.default_district || '',
          street: profile.default_street || ''
        }));
        // ملاحظة: إذا كانت المدينة المحفوظة موجودة في القائمة سيتم اختيارها،
        // ولكن يجب التأكد من تحميل مدن الدولة الافتراضية أولاً (تم ذلك في الـ Effect الأول)
      }
      
      setStep('shipping');
    }
  };

  // ... (دوال OTP و requestClientOTP و verifyClientOTP تبقى كما هي دون تغيير) ...
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) return alert('الرقم غير صحيح');
    setLoading(true);
    setLoadingText('جاري إرسال الرمز...');
    const success = await requestClientOTP(phone);
    if (success) setShowOtpInput(true);
    else alert('فشل الاتصال');
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('جاري التحقق...');
    const res = await verifyClientOTP(phone, otp);
    if (res.success && res.user) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('ukra_client_id', res.user.id);
      localStorage.setItem('ukra_client_phone', res.user.phone);
      localStorage.setItem('ukra_client_name', res.user.name); // حفظ الاسم
      setUserId(res.user.id);
      setIsAuthenticated(true);
      
      // ✅ جلب العنوان بعد تسجيل الدخول الجديد
      const profile = await getCustomerProfile(res.user.id);
      if (profile) {
         setAddress({
            city: profile.default_city || '',
            district: profile.default_district || '',
            street: profile.default_street || '',
            notes: ''
         });
      }
      
      setStep('shipping');
    } else {
      alert('الرمز خاطئ');
    }
    setLoading(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsVerifyingCoupon(true);
    setCouponError('');
    const res = await validateCoupon(couponCode);
    if (res.valid) {
      setAppliedCoupon(res.coupon);
      setCouponCode('');
    } else {
      setCouponError(res.message);
    }
    setIsVerifyingCoupon(false);
  };

  const handleSubmitOrder = async () => {
    if (!address.city || !address.street) return alert('يرجى اختيار المدينة وكتابة العنوان');
    setLoading(true);
    
    try {
      const orderData = {
        clientId: userId,
        items: cart,
        total: finalTotal, // 👈 غيرنا هذه من total إلى finalTotal
        address: address,
        notes: address.notes,
        coupon_code: appliedCoupon?.code || null // 👈 أضفنا هذه السطر اختيارياً
      };

      console.log('📦 Creating Order:', orderData);
      setLoadingText('جاري إنشاء الطلب...');
      
      const res = await createStoreOrder(orderData);

      if (!res.success || !res.orderId) {
        throw new Error('Failed to create order: ' + res.message);
      }

      // ✅ حفظ العنوان كعنوان افتراضي للعميل للمستقبل
      if (userId) {
         await saveCustomerAddress(userId, address);
      }

      // تحويل الـ ID إلى نص
      const orderIdString = String(res.orderId);

      // 2. تجهيز بيانات الفاتورة
      setLoadingText('جاري تجهيز الفاتورة...');
      
      const invoiceProps = {
        quotationNo: orderIdString.slice(0, 8),
        date: new Date().toLocaleDateString('en-GB'),
        clientName: localStorage.getItem('ukra_client_name') || 'Guest',
        clientPhone: phone,
        lang: lang,
        cartItems: cart.map(item => ({
            name_ar: item.name_ar,
            name_en: item.name_en || item.name_ar,
            quantity: item.quantity || 1, 
            price: Number(item.price),
            image_url: item.image_url,
            main_category: item.main_category
        }))
      };

      const MyDocument = <QuotationDocument {...invoiceProps} />;
      const blob = await pdf(MyDocument).toBlob();

      // 3. رفع وإرسال PDF
      setLoadingText('جاري الإرسال واتساب...');
      const publicUrl = await uploadOrderPDF(blob, orderIdString);

      if (publicUrl) {
        const caption = `✅ *تم استلام طلبك بنجاح!*\nرقم الطلب: #${orderIdString}\nالإجمالي: ${total} SAR\n\n📄 *مرفق الفاتورة.*`;
        await sendWhatsAppPDF(phone, publicUrl, caption);
      }

      setStep('success');
      clearCart();

    } catch (error) {
      console.error('Processing Error:', error);
      alert('حدث خطأ أثناء المعالجة، لكن تم تسجيل الطلب.');
    }
    setLoading(false);
  };

  // ... (أكواد Success و Empty Cart تبقى كما هي) ...
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95" dir={dir}>
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-[#1a2a3a] mb-4">تم استلام طلبك بنجاح!</h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">تم إرسال الفاتورة وتفاصيل الطلب إلى الواتساب الخاص بك.</p>
        <a href="/" className="px-8 py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all">العودة للرئيسية</a>
      </div>
    );
  }

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
        <p className="text-gray-400 font-bold mb-6">سلتك فارغة</p>
        <a href="#/store" className="px-6 py-3 bg-[#1a2a3a] text-white rounded-xl font-bold">تصفح المتجر</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12 px-4 font-tajawal" dir={dir}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Auth Section (كما هي) */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'auth' ? 'border-[#c5a059] shadow-lg' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isAuthenticated ? 'bg-green-500' : 'bg-[#1a2a3a]'}`}>{isAuthenticated ? <CheckCircle size={20} /> : '1'}</div>
               <h3 className="text-xl font-black text-[#1a2a3a]">التوثيق عبر واتساب</h3>
             </div>
             {!isAuthenticated ? (
               <div className="space-y-4 max-w-md">
                 {!showOtpInput ? (
                   <form onSubmit={handleRequestOtp} className="flex gap-4">
                     <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xxxxxxxx" className="flex-1 p-4 bg-gray-50 rounded-xl font-bold text-lg outline-none border focus:border-[#c5a059]" dir="ltr" />
                     <button type="submit" disabled={loading} className="px-6 bg-[#1a2a3a] text-white rounded-xl font-bold">{loading ? <Loader2 className="animate-spin" /> : <ArrowRight className="rtl:rotate-180" />}</button>
                   </form>
                 ) : (
                   <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                      <div className="bg-yellow-50 p-3 rounded-xl text-xs text-yellow-700 font-bold flex gap-2"><AlertCircle size={16} /> تم إرسال الرمز</div>
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="XXXX" className="w-full p-4 bg-gray-50 rounded-xl font-black text-center text-2xl tracking-widest outline-none border focus:border-[#c5a059]" maxLength={4} />
                      <button type="submit" disabled={loading} className="w-full py-4 bg-[#c5a059] text-white rounded-xl font-bold hover:bg-[#b08d4a] transition-all">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'تأكيد'}</button>
                   </form>
                 )}
               </div>
             ) : (
               <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl">
                 <div className="font-bold text-green-800 flex items-center gap-2"><Phone size={16} /> <span dir="ltr">{phone}</span></div>
                 <button onClick={() => { setIsAuthenticated(false); setStep('auth'); localStorage.clear(); }} className="text-xs text-green-600 underline font-bold">تغيير</button>
               </div>
             )}
          </div>

          {/* Shipping Section (محدثة مع القوائم) */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'shipping' ? 'border-[#c5a059] shadow-lg' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step === 'shipping' ? 'bg-[#1a2a3a]' : 'bg-gray-300'}`}>2</div>
               <h3 className="text-xl font-black text-[#1a2a3a]">بيانات التوصيل</h3>
             </div>
             {step === 'shipping' && (
               <div className="space-y-4 animate-in slide-in-from-top-4">
                 
                 {/* ✅ اختيار الدولة والمدينة */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select 
                        value={selectedCountry} 
                        onChange={handleCountryChange}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059] appearance-none"
                      >
                        <option value="" disabled>اختر الدولة</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>
                        ))}
                      </select>
                      <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select 
                        value={address.city} 
                        onChange={e => setAddress({...address, city: e.target.value})}
                        className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059] appearance-none"
                        disabled={!selectedCountry}
                      >
                        <option value="" disabled>اختر المدينة</option>
                        {cities.map(c => (
                          <option key={c.id} value={lang === 'ar' ? c.name_ar : c.name_en}>
                            {lang === 'ar' ? c.name_ar : c.name_en}
                          </option>
                        ))}
                      </select>
                       <MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                 </div>
                 {/* --------------------------- */}

                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="الحي" value={address.district} onChange={e => setAddress({...address, district: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" />
                    <input type="text" placeholder="اسم الشارع / أقرب معلم" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" />
                 </div>
                 
                 <textarea placeholder="ملاحظات إضافية (اختياري)" value={address.notes} onChange={e => setAddress({...address, notes: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" rows={2}></textarea>
               </div>
             )}
          </div>
        </div>

        {/* ملخص الطلب (كما هو) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-6">
             <h3 className="text-lg font-black text-[#1a2a3a] mb-6 border-b pb-4">ملخص الطلب</h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <ShoppingBag className="m-auto text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1a2a3a] line-clamp-1">{lang === 'ar' ? item.name_ar : item.name_en}</p>
                      <p className="font-bold text-[#c5a059] text-sm">{item.price} SAR</p>
                    </div>
                 </div>
               ))}
             </div>
             {/* --- بداية إضافة قسم الكوبون --- */}
             <div className="mt-4 mb-4">
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="كود الخصم" 
                   value={couponCode}
                   onChange={(e) => setCouponCode(e.target.value)}
                   className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#c5a059]"
                 />
                 <button 
                   onClick={handleApplyCoupon}
                   disabled={isVerifyingCoupon || !couponCode}
                   className="px-4 bg-[#1a2a3a] text-white rounded-lg text-sm font-bold hover:bg-[#c5a059] transition-colors disabled:opacity-50"
                 >
                   {isVerifyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
                 </button>
               </div>
               {couponError && <p className="text-red-500 text-xs mt-1 font-bold">{couponError}</p>}
               {appliedCoupon && (
                 <div className="flex justify-between items-center mt-2 bg-green-50 p-2 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
                   <span className="text-green-700 text-xs font-bold">تم تطبيق كود: {appliedCoupon.code}</span>
                   <button onClick={() => setAppliedCoupon(null)} className="text-red-500 text-xs font-black">إلغاء</button>
                 </div>
               )}
             </div>
             {/* --- نهاية إضافة قسم الكوبون --- */}

             <div className="space-y-2 border-t pt-4 text-sm mb-6">
               <div className="flex justify-between text-gray-500">
                 <span>المجموع الفرعي</span>
                 <span>{total} SAR</span>
               </div>
               
               {appliedCoupon && (
                 <div className="flex justify-between text-green-600 font-bold">
                   <span>الخصم ({appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percentage' ? '%' : ' SAR'})</span>
                   <span>-{calculateDiscount()} SAR</span>
                 </div>
               )}

               <div className="flex justify-between text-xl font-black text-[#1a2a3a] pt-2 border-t border-dashed">
                 <span>الإجمالي النهائي</span>
                 <span>{finalTotal} SAR</span>
               </div>
             </div>
             <button 
               onClick={handleSubmitOrder}
               disabled={step !== 'shipping' || loading}
               className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
             >
               {loading ? (
                 <><Loader2 className="animate-spin" /><span>{loadingText}</span></>
               ) : (
                  <><ShieldCheck size={20} /> اعتماد وإرسال الفاتورة</>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;