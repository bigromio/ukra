import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  verifyUnifiedOTP, 
  requestLoginOTP, 
  requestRegisterOTP,
  createStoreOrder,
  uploadOrderPDF, 
  sendWhatsAppPDF,
  fetchActiveCountries, 
  fetchActiveCities,    
  getCustomerProfile,   
  saveCustomerAddress,   
  validateCoupon
} from '../services/apiService';
import { pdf } from '@react-pdf/renderer'; 
import { QuotationDocument } from '../components/PDF/QuotationDocument';
import { 
  ShoppingBag, Phone, CheckCircle, ArrowRight, 
  Loader2, ShieldCheck, AlertCircle, MapPin, Mail, User as UserIcon 
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { items: cart, totalAmount: total, clearCart } = useCart();
  const { t, lang, dir } = useLanguage();
  const { user, login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'auth' | 'shipping' | 'success'>('auth');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // --- حالات التوثيق الذكي (Auth) ---
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [authStep, setAuthStep] = useState<'input' | 'otp'>('input');
  const [authError, setAuthError] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '' });

  // --- States للمواقع والعنوان ---
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
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
      const ksa = data.find((c: any) => c.code === 'SA');
      if (ksa) {
        setSelectedCountry(ksa.id);
        loadCities(ksa.id);
      }
    };
    loadCountries();
  }, []);

  // 2. التحقق من الدخول وجلب العنوان المحفوظ
  useEffect(() => {
    if (isAuthenticated && user) {
      setStep('shipping');
      loadUserProfile(user.id);
    }
  }, [isAuthenticated, user]);

  const loadUserProfile = async (userId: string) => {
    const profile = await getCustomerProfile(userId);
    if (profile) {
      setAddress(prev => ({
        ...prev,
        city: profile.default_city || '',
        district: profile.default_district || '',
        street: profile.default_street || ''
      }));
    }
  };

  const loadCities = async (countryId: string) => {
    const data = await fetchActiveCities(countryId);
    setCities(data);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setSelectedCountry(cId);
    loadCities(cId);
    setAddress({ ...address, city: '' });
  };

  // ==========================================
  // دوال التوثيق الذكي
  // ==========================================
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    let res;
    if (authMode === 'login') {
      res = await requestLoginOTP(loginIdentifier, loginMethod);
    } else {
      res = await requestRegisterOTP(registerData.name, registerData.phone, registerData.email);
    }

    if (res.success) {
      setAuthStep('otp');
    } else {
      setAuthError(res.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const identifierToVerify = authMode === 'login' ? loginIdentifier : registerData.phone;
    const regData = authMode === 'register' ? registerData : undefined;

    const res = await verifyUnifiedOTP(identifierToVerify, otpCode, regData);
    
    if (res.success && res.user) {
      login(res.user); 
      // التوافق مع نظامك السابق (لحفظ الجلسة كما كنت تفعل)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('ukra_client_id', res.user.id);
      localStorage.setItem('ukra_client_phone', res.user.phone);
      localStorage.setItem('ukra_client_name', res.user.name);
      
      setStep('shipping');
    } else {
      setAuthError(res.message || 'الرمز خاطئ أو منتهي الصلاحية');
    }
    setLoading(false);
  };

  // ==========================================
  // دوال الكوبون وإتمام الطلب
  // ==========================================
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
    if (!address.city || !address.street) return alert('يرجى اختيار المدينة وكتابة العنوان (الشارع/المبنى)');
    if (!user) return alert('الرجاء تسجيل الدخول أولاً');
    
    setLoading(true);
    try {
      const orderData = {
        clientId: user.id,
        items: cart,
        total: finalTotal,
        address: address,
        notes: address.notes,
        coupon_code: appliedCoupon?.code || null 
      };

      setLoadingText('جاري إنشاء الطلب...');
      const res = await createStoreOrder(orderData);

      if (!res.success || !res.orderId) throw new Error('Failed to create order: ' + res.message);

      // حفظ العنوان للمستقبل
      await saveCustomerAddress(user.id, address);

      const orderIdString = String(res.orderId);

      // تجهيز الفاتورة PDF
      setLoadingText('جاري تجهيز الفاتورة...');
      const invoiceProps = {
        quotationNo: orderIdString.slice(0, 8),
        date: new Date().toLocaleDateString('en-GB'),
        clientName: user.name || 'عميل',
        clientPhone: user.phone || '',
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

      // رفع وإرسال الواتساب
      setLoadingText('جاري الإرسال واتساب...');
      const publicUrl = await uploadOrderPDF(blob, orderIdString);

      if (publicUrl) {
        const caption = `✅ *تم استلام طلبك بنجاح!*\nرقم الطلب: #${orderIdString}\nالإجمالي: ${finalTotal} SAR\n\n📄 *مرفق الفاتورة.*`;
        await sendWhatsAppPDF(user.phone || '', publicUrl, caption);
      }

      setStep('success');
      clearCart();

    } catch (error) {
      alert('حدث خطأ أثناء المعالجة، لكن تم تسجيل الطلب.');
    }
    setLoading(false);
  };

  // --- شاشات فارغة ونجاح ---
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95" dir={dir}>
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-green-600" /></div>
        <h2 className="text-3xl font-black text-[#1a2a3a] mb-4">تم استلام طلبك بنجاح!</h2>
        <p className="text-gray-500 max-w-md mb-8 text-lg">تم إرسال الفاتورة وتفاصيل الطلب إلى الواتساب الخاص بك.</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all">العودة للرئيسية</button>
      </div>
    );
  }

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
        <p className="text-gray-400 font-bold mb-6">سلتك فارغة</p>
        <button onClick={() => navigate('/store')} className="px-6 py-3 bg-[#1a2a3a] text-white rounded-xl font-bold">تصفح المتجر</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-24 px-4 font-tajawal" dir={dir}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          
          {/* ========================================== */}
          {/* قسم التوثيق الذكي (Auth Section) */}
          {/* ========================================== */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'auth' ? 'border-[#c5a059] shadow-lg' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isAuthenticated ? 'bg-green-500' : 'bg-[#1a2a3a]'}`}>{isAuthenticated ? <CheckCircle size={20} /> : '1'}</div>
               <h3 className="text-xl font-black text-[#1a2a3a]">التحقق من الهوية</h3>
             </div>
             
             {!isAuthenticated ? (
               <div className="space-y-4 max-w-md">
                 {authError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold">{authError}</div>}
                 
                 {authStep === 'input' ? (
                   <div className="animate-in fade-in">
                     <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                       <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'login' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500'}`}>عميل مسجل</button>
                       <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'register' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500'}`}>عميل جديد</button>
                     </div>

                     <form onSubmit={handleRequestOtp} className="space-y-4">
                       {authMode === 'login' ? (
                         <>
                           <div className="flex gap-4 mb-4">
                             <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'phone' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200'}`}>
                               <input type="radio" checked={loginMethod === 'phone'} onChange={() => setLoginMethod('phone')} className="hidden" />
                               <Phone size={18} className={loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-400'} /><span className={`font-bold text-sm ${loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-500'}`}>رسالة جوال</span>
                             </label>
                             <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'email' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200'}`}>
                               <input type="radio" checked={loginMethod === 'email'} onChange={() => setLoginMethod('email')} className="hidden" />
                               <Mail size={18} className={loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-400'} /><span className={`font-bold text-sm ${loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-500'}`}>بريد إلكتروني</span>
                             </label>
                           </div>
                           <div className="relative">
                             {loginMethod === 'phone' ? <Phone className="absolute right-3 top-3 text-gray-400" /> : <Mail className="absolute right-3 top-3 text-gray-400" />}
                             <input required type={loginMethod === 'phone' ? 'tel' : 'email'} placeholder={loginMethod === 'phone' ? '05XXXXXXXX' : 'البريد الإلكتروني'} className="w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] font-num text-right" dir="ltr" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} />
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="relative"><UserIcon className="absolute right-3 top-3 text-gray-400" /><input required type="text" placeholder="الاسم الكامل" className="w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059]" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} /></div>
                           <div className="relative"><Phone className="absolute right-3 top-3 text-gray-400" /><input required type="tel" placeholder="رقم الجوال 05XXXXXXXX" className="w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] font-num text-right" dir="ltr" value={registerData.phone} onChange={(e) => setRegisterData({...registerData, phone: e.target.value})} /></div>
                           <div className="relative"><Mail className="absolute right-3 top-3 text-gray-400" /><input required type="email" placeholder="البريد الإلكتروني" className="w-full bg-gray-50 border rounded-xl py-3 pl-4 pr-10 outline-none focus:border-[#c5a059] font-num text-right" dir="ltr" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} /></div>
                         </>
                       )}
                       <button type="submit" disabled={loading} className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold mt-2">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'المتابعة للتحقق'}</button>
                     </form>
                   </div>
                 ) : (
                   <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in text-center">
                      <div className="bg-yellow-50 p-3 rounded-xl text-xs text-yellow-700 font-bold flex gap-2 text-right"><AlertCircle size={16} className="shrink-0"/> {authMode === 'register' ? 'تم إرسال الرمز للواتساب والإيميل معاً لضمان الأمان.' : `تم إرسال الرمز إلى ${loginMethod === 'phone' ? 'جوالك' : 'بريدك'}.`}</div>
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="XXXX" className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 rounded-xl font-black text-center text-2xl tracking-widest outline-none border focus:border-[#c5a059]" maxLength={4} />
                      <button type="submit" disabled={loading || otpCode.length !== 4} className="w-full py-4 bg-[#c5a059] text-white rounded-xl font-bold hover:bg-[#b08d4a] transition-all disabled:opacity-50">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'تأكيد الرمز'}</button>
                      <button type="button" onClick={() => { setAuthStep('input'); setOtpCode(''); }} className="text-sm text-gray-500 hover:text-[#1a2a3a] underline font-bold mt-2">تعديل البيانات</button>
                   </form>
                 )}
               </div>
             ) : (
               <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-100">
                 <div className="font-bold text-green-800 flex items-center gap-2"><CheckCircle size={18} className="text-green-600"/> تم تسجيل الدخول كـ: {user?.name}</div>
               </div>
             )}
          </div>

          {/* ========================================== */}
          {/* قسم بيانات التوصيل (Shipping Section) */}
          {/* ========================================== */}
          <div className={`bg-white p-8 rounded-3xl border transition-all ${step === 'shipping' ? 'border-[#c5a059] shadow-lg' : 'border-gray-100 opacity-60'}`}>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step === 'shipping' ? 'bg-[#1a2a3a]' : 'bg-gray-300'}`}>2</div>
               <h3 className="text-xl font-black text-[#1a2a3a]">بيانات التوصيل</h3>
             </div>
             
             {step === 'shipping' && (
               <div className="space-y-4 animate-in slide-in-from-top-4">
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select value={selectedCountry} onChange={handleCountryChange} className="w-full p-3 pl-10 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059] appearance-none">
                        <option value="" disabled>اختر الدولة</option>
                        {countries.map(c => (<option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>))}
                      </select>
                      <MapPin className="absolute right-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full p-3 pl-10 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059] appearance-none" disabled={!selectedCountry}>
                        <option value="" disabled>اختر المدينة</option>
                        {cities.map(c => (<option key={c.id} value={lang === 'ar' ? c.name_ar : c.name_en}>{lang === 'ar' ? c.name_ar : c.name_en}</option>))}
                      </select>
                       <MapPin className="absolute right-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="الحي" value={address.district} onChange={e => setAddress({...address, district: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" />
                    <input type="text" placeholder="اسم الشارع / رقم المبنى" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" />
                 </div>
                 
                 <textarea placeholder="ملاحظات إضافية للمندوب (اختياري)" value={address.notes} onChange={e => setAddress({...address, notes: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none border focus:border-[#c5a059]" rows={2}></textarea>
               </div>
             )}
          </div>
        </div>

        {/* ========================================== */}
        {/* العمود الأيسر: ملخص الطلب والكوبون */}
        {/* ========================================== */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-28">
             <h3 className="text-lg font-black text-[#1a2a3a] mb-6 border-b pb-4">ملخص الطلب</h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="m-auto mt-4 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1a2a3a] line-clamp-1">{lang === 'ar' ? item.name_ar : item.name_en}</p>
                      <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      <p className="font-bold text-[#c5a059] text-sm">{item.price} SAR</p>
                    </div>
                 </div>
               ))}
             </div>

             {/* قسم الكوبون (نفسه تماماً) */}
             <div className="mt-4 mb-4">
               <div className="flex gap-2">
                 <input type="text" placeholder="كود الخصم" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#c5a059]" />
                 <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponCode} className="px-4 bg-[#1a2a3a] text-white rounded-lg text-sm font-bold hover:bg-[#c5a059] transition-colors disabled:opacity-50">
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

             <div className="space-y-2 border-t pt-4 text-sm mb-6">
               <div className="flex justify-between text-gray-500"><span>المجموع الفرعي</span><span className="font-num">{total} SAR</span></div>
               
               {appliedCoupon && (
                 <div className="flex justify-between text-green-600 font-bold">
                   <span>الخصم ({appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percentage' ? '%' : ' SAR'})</span>
                   <span className="font-num">-{calculateDiscount()} SAR</span>
                 </div>
               )}

               <div className="flex justify-between text-xl font-black text-[#1a2a3a] pt-4 border-t border-dashed">
                 <span>الإجمالي النهائي</span>
                 <span className="font-num">{finalTotal} SAR</span>
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
             {step !== 'shipping' && <p className="text-xs text-center text-red-500 font-bold mt-2">يجب التحقق من الهوية لإتمام الطلب</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;