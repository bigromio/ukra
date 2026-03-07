import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { createLeadAndDraftBooking, confirmDraftBooking, requestUnifiedOTP, verifyUnifiedOTP, fetchBookedSlots, fetchBusinessSettings } from '../services/apiService';
import { Loader2, Calendar, Clock, MapPin, Check, Phone, Mail, AlertCircle } from 'lucide-react';
import { BookingPayload } from '../types';

export const BookAppointment = () => {
  const { t, dir } = useLanguage();
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', service: 'Design', date: '', time: '', reason: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  // 1. حالة إعدادات العمل (ديناميكية وجاهزة للوحة التحكم)
  const [businessSettings, setBusinessSettings] = useState({
    workStartHour: 9,
    workEndHour: 17,
    holidays: [] as string[],
    workDaysText: 'من الأحد إلى الخميس، 9:00 ص - 5:00 م'
  });

  // جلب إعدادات العمل عند فتح الصفحة
  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetchBusinessSettings();
      if (res.success && res.settings) {
        setBusinessSettings(res.settings);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. التحقق من الإجازات وجلب المواعيد عند تغيير التاريخ
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    
    // التحقق مما إذا كان اليوم إجازة رسمية مغلقة من الإدارة
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

  const handleTimeSelect = (time: string) => {
    setFormData({ ...formData, time });
  };

  // 3. التوليد الديناميكي لأوقات العمل وحجب الأوقات المنقضية
  const generateAvailableTimeSlots = () => {
    if (!formData.date) return [];
    
    const slots = [];
    const now = new Date();
    // الحصول على التاريخ الحالي بصيغة YYYY-MM-DD محلياً
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const isToday = formData.date === todayStr;
    const currentHour = now.getHours();

    // حلقة تمر على ساعات العمل من البداية للنهاية
    for (let i = businessSettings.workStartHour; i <= businessSettings.workEndHour; i++) {
      // إذا كان الموعد اليوم، والساعة الحالية تخطت هذا الوقت، فتجاهله (لا تظهره)
      if (isToday && i <= currentHour) {
        continue;
      }
      // تنسيق الوقت بصيغة HH:00
      const formattedHour = `${i.toString().padStart(2, '0')}:00`;
      slots.push(formattedHour);
    }
    return slots;
  };

  const availableTimeSlots = generateAvailableTimeSlots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) return alert("الرجاء اختيار الوقت / Please select a time");
    
    setLoading(true);
    const payload: BookingPayload = { ...formData, timestamp: new Date().toISOString() };
    const draftRes = await createLeadAndDraftBooking(payload);
    
    if (draftRes.success && draftRes.appointmentId) {
       setDraftId(draftRes.appointmentId);
    }

    const otpSent = await requestUnifiedOTP(formData.phone, formData.email);
    setLoading(false);

    if (otpSent) {
      setShowOTP(true);
    } else {
      alert("فشل إرسال الرمز، يرجى التأكد من صحة البيانات.");
    }
  };

  const handleVerifyAndBook = async () => {
    if (!otpCode || otpCode.length < 4) return alert("الرجاء إدخال رمز صحيح");
    setLoading(true);
    
   const verifyRes = await verifyUnifiedOTP(formData.phone, otpCode);
    if (verifyRes.success) {
      if (draftId) {
         await confirmDraftBooking(draftId, formData.service, formData.name, formData.phone, formData.email, formData.date, formData.time);
      }
      setSuccess(true);
    } else {
      alert("الرمز غير صحيح أو منتهي الصلاحية.");
    }
    setLoading(false);
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

  // منع اختيار أيام ماضية في التقويم
  const todayMinDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <h1 className="text-4xl font-bold text-ukra-navy mb-2">{t('book_title')}</h1>
           <p className="text-gray-500">{t('book_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700 delay-100">
              <div className="bg-ukra-navy text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock className="w-32 h-32" />
                 </div>
                 <h3 className="text-2xl font-bold mb-6 text-ukra-gold">{t('book_location')}</h3>
                 <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                       <MapPin className="w-5 h-5 text-ukra-gold flex-shrink-0" />
                       <span>{t('address_full')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Phone className="w-5 h-5 text-ukra-gold flex-shrink-0" />
                       <span dir="ltr">+966 56 915 9938</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Mail className="w-5 h-5 text-ukra-gold flex-shrink-0" />
                       <span>sales@ukra.sa</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Clock className="w-5 h-5 text-ukra-gold flex-shrink-0" />
                       {/* 4. عرض أوقات العمل نصياً بشكل ديناميكي من الإعدادات */}
                       <span>{businessSettings.workDaysText}</span>
                    </div>
                 </div>
              </div>
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-md border-4 border-white relative">
                 <iframe 
                    src="https://maps.google.com/maps?q=Prince+Mohammad+Bin+Abdulaziz+St,+Alalia,+Madinah&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                    width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" title="UKRA Location"
                 ></iframe>
                 <a href="https://maps.app.goo.gl/DFDMbwSrfTkeawz98" target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
              </div>
           </div>

           <div className="bg-white p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right duration-700 delay-200">
              {!showOTP ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                         <label className="label-std">{t('book_name')}</label>
                         <input required name="name" className="input-std" onChange={handleChange} />
                      </div>
                      <div>
                         <label className="label-std">{t('book_phone')}</label>
                         <input required name="phone" className="input-std" onChange={handleChange} placeholder="05xxxxxxxx" />
                      </div>
                      <div>
                         <label className="label-std">{t('book_email')}</label>
                         <input required name="email" type="email" className="input-std" onChange={handleChange} placeholder="example@mail.com" />
                      </div>
                   </div>

                   <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <select name="service" className="input-std" onChange={handleChange}>
                            <option value="Design">{t('book_service_design')}</option>
                            <option value="Sales">{t('book_service_sales')}</option>
                         </select>
                         <input required type="date" name="date" className="input-std" min={todayMinDate} onChange={handleDateChange} />
                      </div>
                      
                      {formData.date && (
                        <>
                          <label className="label-std mb-2">{t('book_time')}</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 relative">
                             {loading && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                   <Loader2 className="animate-spin text-ukra-gold" />
                                </div>
                             )}
                             
                             {/* 5. عرض الأوقات الديناميكية فقط */}
                             {availableTimeSlots.length > 0 ? (
                               availableTimeSlots.map((time) => {
                                  const isBooked = bookedSlots.includes(time);
                                  return (
                                     <button 
                                        type="button" 
                                        key={time} 
                                        disabled={isBooked}
                                        onClick={() => handleTimeSelect(time)}
                                        className={`py-2 px-1 text-sm rounded border transition-all ${
                                           isBooked 
                                           ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60' 
                                           : formData.time === time 
                                              ? 'bg-ukra-navy text-white' 
                                              : 'bg-white text-gray-600 hover:border-ukra-gold'
                                        }`}
                                     >
                                        {time}
                                     </button>
                                  );
                               })
                             ) : (
                               <div className="col-span-full text-center py-4 text-red-500 text-sm font-bold bg-red-50 rounded-lg">
                                  لقد انتهت أوقات العمل الرسمية لهذا اليوم، نرجو اختيار يوم آخر.
                               </div>
                             )}
                          </div>
                        </>
                      )}
                      {!formData.date && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          الرجاء اختيار التاريخ لعرض الأوقات المتاحة
                        </div>
                      )}
                   </div>

                   <button type="submit" disabled={loading || !formData.date || availableTimeSlots.length === 0} className="btn-main w-full flex justify-center">
                      {loading ? <Loader2 className="animate-spin" /> : "إرسال رمز التحقق"}
                   </button>
                </form>
              ) : (
                <div className="space-y-6 text-center animate-in fade-in">
                   <h3 className="text-2xl font-bold text-ukra-navy">التحقق من الهوية</h3>
                   <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm flex gap-2 text-right">
                      <AlertCircle className="shrink-0" />
                      <p>تم إرسال رمز التحقق إلى الواتساب وإلى بريدك الإلكتروني. يمكنك إدخال الرمز من أي منهما.</p>
                   </div>
                   <input type="text" maxLength={4} className="input-std text-center text-2xl tracking-widest font-bold" placeholder="XXXX" onChange={(e) => setOtpCode(e.target.value)} />
                   <button onClick={handleVerifyAndBook} disabled={loading} className="btn-main w-full flex justify-center">
                      {loading ? <Loader2 className="animate-spin" /> : "تأكيد الحجز"}
                   </button>
                   <button type="button" onClick={() => setShowOTP(false)} className="text-sm text-gray-500 underline mt-4">تعديل البيانات وإعادة الإرسال</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};