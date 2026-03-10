import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  createLeadAndDraftBooking, 
  confirmDraftBooking, 
  requestLoginOTP, 
  requestRegisterOTP, 
  verifyUnifiedOTP, 
  fetchBookedSlots, 
  fetchBusinessSettings 
} from '../services/apiService';
import { Loader2, Calendar, Clock, MapPin, Check, Phone, Mail, AlertCircle, User as UserIcon, ShieldCheck } from 'lucide-react';

export const BookAppointment = () => {
  const { t, dir } = useLanguage();
  const { user, login, isAuthenticated } = useAuth(); // جلب حالة تسجيل الدخول

  // 1. حالات الحجز الأساسية
  const [formData, setFormData] = useState({ service: 'Design', date: '', time: '', notes: '' });
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 2. حالات التوثيق (Auth)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');

  // 3. حالة إعدادات العمل
  const [businessSettings, setBusinessSettings] = useState({
    workStartHour: 9,
    workEndHour: 17,
    holidays: [] as string[],
    workDaysText: 'من الأحد إلى الخميس، 9:00 ص - 5:00 م'
  });

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetchBusinessSettings();
      if (res.success && res.settings) setBusinessSettings(res.settings);
    };
    loadSettings();
  }, []);

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (businessSettings.holidays.includes(selectedDate)) {
      alert("عذراً، هذا اليوم يصادف إجازة رسمية. الرجاء اختيار يوم آخر.");
      setFormData({ ...formData, date: '', time: '' });
      return;
    }
    setFormData({ ...formData, date: selectedDate, time: '' });
    if (selectedDate) {
      setLoading(true);
      const slots = await fetchBookedSlots(selectedDate);
      setBookedSlots(slots);
      setLoading(false);
    }
  };

  const generateAvailableTimeSlots = () => {
    if (!formData.date) return [];
    const slots = [];
    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const isToday = formData.date === todayStr;
    const currentHour = now.getHours();

    for (let i = businessSettings.workStartHour; i <= businessSettings.workEndHour; i++) {
      if (isToday && i <= currentHour) continue;
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const availableTimeSlots = generateAvailableTimeSlots();

  // ==========================================
  // دوال تقديم الطلب والتوثيق
  // ==========================================

  // أ. إذا لم يكن مسجلاً (طلب الرمز)
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) return alert("الرجاء اختيار الوقت / Please select a time");
    
    setLoading(true);
    setAuthError('');

    let res;
    if (authMode === 'login') {
      res = await requestLoginOTP(loginIdentifier, loginMethod);
    } else {
      res = await requestRegisterOTP(registerData.name, registerData.phone, registerData.email);
    }

    if (res.success) {
      setShowOTP(true);
    } else {
      setAuthError(res.message);
    }
    setLoading(false);
  };

  // ب. التحقق من الرمز وإنشاء الحجز
  const handleVerifyAndBook = async () => {
    if (!otpCode || otpCode.length < 4) return alert("الرجاء إدخال رمز صحيح");
    setLoading(true);
    setAuthError('');
    
    const identifierToVerify = authMode === 'login' ? loginIdentifier : registerData.phone;
    const regData = authMode === 'register' ? registerData : undefined;

    const verifyRes = await verifyUnifiedOTP(identifierToVerify, otpCode, regData);
    
    if (verifyRes.success && verifyRes.user) {
      login(verifyRes.user); // تسجيل الدخول في النظام
      
      // إنشاء الحجز ببيانات العميل الموثقة
      await executeBooking(verifyRes.user.name, verifyRes.user.phone, verifyRes.user.email);
    } else {
      setAuthError(verifyRes.message || "الرمز غير صحيح أو منتهي الصلاحية.");
    }
    setLoading(false);
  };

  // ج. إذا كان مسجلاً مسبقاً (حجز مباشر بدون OTP)
  const handleDirectBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) return alert("الرجاء اختيار الوقت");
    if (!user) return;

    setLoading(true);
    await executeBooking(user.name, user.phone || '', user.email || '');
    setLoading(false);
  };

  // دالة الحجز المشتركة
  const executeBooking = async (name: string, phone: string, email: string) => {
    const payload = { ...formData, name, phone, email, timestamp: new Date().toISOString() };
    const draftRes = await createLeadAndDraftBooking(payload);
    
    if (draftRes.success && draftRes.appointmentId) {
      const confirmed = await confirmDraftBooking(draftRes.appointmentId, formData.service, name, phone, email, formData.date, formData.time);
      if (confirmed) setSuccess(true);
      else alert("حدث خطأ أثناء تأكيد الموعد النهائي.");
    } else {
      alert("حدث خطأ أثناء إنشاء الحجز المبدئي.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">تم تأكيد الحجز وإصدار التذكرة</h2>
           <p className="text-gray-600 mb-6">لقد أرسلنا تذكرة الموعد إلى الواتساب وبريدك الإلكتروني.</p>
           <button onClick={() => window.location.reload()} className="btn-main w-full">{t('nav_home')}</button>
        </div>
      </div>
    );
  }

  const todayMinDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <h1 className="text-4xl font-bold text-ukra-navy mb-2">{t('book_title')}</h1>
           <p className="text-gray-500">{t('book_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           
           {/* معلومات الموقع */}
           <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <div className="bg-ukra-navy text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-32 h-32" /></div>
                 <h3 className="text-2xl font-bold mb-6 text-ukra-gold">{t('book_location')}</h3>
                 <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-ukra-gold flex-shrink-0" /><span>{t('address_full')}</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-ukra-gold flex-shrink-0" /><span dir="ltr">+966 56 915 9938</span></div>
                    <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-ukra-gold flex-shrink-0" /><span>sales@ukra.sa</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-ukra-gold flex-shrink-0" /><span>{businessSettings.workDaysText}</span></div>
                 </div>
              </div>
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-md border-4 border-white relative">
                 <iframe src="https://maps.google.com/maps?q=Prince+Mohammad+Bin+Abdulaziz+St,+Alalia,+Madinah&t=&z=14&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" title="UKRA Location"></iframe>
              </div>
           </div>

           {/* نموذج الحجز والمصادقة */}
           <div className="bg-white p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right duration-700 delay-200">
              
              {/* قسم تفاصيل الموعد */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <select name="service" className="input-std" value={formData.service} onChange={handleBookingChange}>
                       <option value="Design">{t('book_service_design')}</option>
                       <option value="Sales">{t('book_service_sales')}</option>
                    </select>
                    <input required type="date" name="date" className="input-std" min={todayMinDate} value={formData.date} onChange={handleDateChange} />
                 </div>
                 
                 {formData.date && (
                    <>
                      <label className="label-std mb-2">{t('book_time')}</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 relative">
                         {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="animate-spin text-ukra-gold" /></div>}
                         {availableTimeSlots.length > 0 ? (
                           availableTimeSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              return (
                                 <button type="button" key={time} disabled={isBooked} onClick={() => setFormData({...formData, time})}
                                    className={`py-2 px-1 text-sm rounded border transition-all ${
                                       isBooked ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60' 
                                       : formData.time === time ? 'bg-ukra-navy text-white' : 'bg-white text-gray-600 hover:border-ukra-gold'
                                    }`}
                                 >{time}</button>
                              );
                           })
                         ) : (
                           <div className="col-span-full text-center py-4 text-red-500 text-sm font-bold bg-red-50 rounded-lg">لقد انتهت أوقات العمل الرسمية لهذا اليوم، نرجو اختيار يوم آخر.</div>
                         )}
                      </div>
                    </>
                 )}
                 {!formData.date && <div className="text-center py-4 text-gray-400 text-sm">الرجاء اختيار التاريخ لعرض الأوقات المتاحة</div>}
              </div>

              {/* قسم التوثيق */}
              {!isAuthenticated ? (
                !showOTP ? (
                  <form onSubmit={handleRequestOTP} className="space-y-6">
                    <h3 className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2 border-b pb-2"><ShieldCheck className="text-[#c5a059]" /> بيانات العميل</h3>
                    {authError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold">{authError}</div>}
                    
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                      <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'login' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500'}`}>عميل مسجل</button>
                      <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${authMode === 'register' ? 'bg-white text-[#1a2a3a] shadow-sm' : 'text-gray-500'}`}>عميل جديد</button>
                    </div>

                    {authMode === 'login' ? (
                      <>
                        <div className="flex gap-4 mb-4">
                          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'phone' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" checked={loginMethod === 'phone'} onChange={() => setLoginMethod('phone')} className="hidden" />
                            <Phone size={18} className={loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-400'} />
                            <span className={`font-bold text-sm ${loginMethod === 'phone' ? 'text-[#c5a059]' : 'text-gray-500'}`}>جوال</span>
                          </label>
                          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${loginMethod === 'email' ? 'border-[#c5a059] bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="radio" checked={loginMethod === 'email'} onChange={() => setLoginMethod('email')} className="hidden" />
                            <Mail size={18} className={loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-400'} />
                            <span className={`font-bold text-sm ${loginMethod === 'email' ? 'text-[#c5a059]' : 'text-gray-500'}`}>بريد</span>
                          </label>
                        </div>
                        <div className="relative">
                          {loginMethod === 'phone' ? <Phone className="absolute right-3 top-3 text-gray-400" /> : <Mail className="absolute right-3 top-3 text-gray-400" />}
                          <input required type={loginMethod === 'phone' ? 'tel' : 'email'} placeholder={loginMethod === 'phone' ? '05XXXXXXXX' : 'البريد الإلكتروني'} className="input-std text-right pl-4 pr-10" dir="ltr" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative"><UserIcon className="absolute right-3 top-3 text-gray-400" /><input required type="text" placeholder="الاسم الكامل" className="input-std pl-4 pr-10" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} /></div>
                        <div className="relative"><Phone className="absolute right-3 top-3 text-gray-400" /><input required type="tel" placeholder="05XXXXXXXX" className="input-std pl-4 pr-10 text-right" dir="ltr" value={registerData.phone} onChange={(e) => setRegisterData({...registerData, phone: e.target.value})} /></div>
                        <div className="relative"><Mail className="absolute right-3 top-3 text-gray-400" /><input required type="email" placeholder="البريد الإلكتروني" className="input-std pl-4 pr-10 text-right" dir="ltr" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} /></div>
                      </div>
                    )}

                    <button type="submit" disabled={loading || !formData.date || !formData.time} className="btn-main w-full flex justify-center mt-6">
                       {loading ? <Loader2 className="animate-spin" /> : "إرسال رمز التحقق"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 text-center animate-in fade-in">
                     <h3 className="text-2xl font-bold text-ukra-navy">التحقق من الهوية</h3>
                     {authError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold">{authError}</div>}
                     <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm flex gap-2 text-right">
                        <AlertCircle className="shrink-0" />
                        <p>{authMode === 'register' ? 'تم إرسال الرمز للواتساب والإيميل لضمان الأمان.' : `تم إرسال الرمز إلى ${loginMethod === 'phone' ? 'جوالك' : 'بريدك'}`}</p>
                     </div>
                     <input type="text" maxLength={4} className="input-std text-center text-2xl tracking-widest font-bold" placeholder="XXXX" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} />
                     <button onClick={handleVerifyAndBook} disabled={loading || otpCode.length !== 4} className="btn-main w-full flex justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : "تأكيد الحجز النهائي"}
                     </button>
                     <button type="button" onClick={() => { setShowOTP(false); setOtpCode(''); }} className="text-sm text-gray-500 underline mt-4">تعديل البيانات وإعادة الإرسال</button>
                  </div>
                )
              ) : (
                <form onSubmit={handleDirectBook} className="space-y-6 animate-in fade-in">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
                    <Check className="text-green-600" size={28} />
                    <div>
                      <p className="text-sm text-green-800 font-bold">حجز مباشر للعميل:</p>
                      <p className="text-lg font-black text-green-900">{user.name} <span className="text-sm font-normal">({user.phone})</span></p>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !formData.date || !formData.time} className="btn-main w-full flex justify-center mt-6">
                     {loading ? <Loader2 className="animate-spin" /> : "تأكيد الحجز النهائي"}
                  </button>
                </form>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};