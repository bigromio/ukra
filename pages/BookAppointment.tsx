
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { submitBooking } from '../services/apiService';
import { Loader2, Calendar, Clock, MapPin, Check, Phone, Mail } from 'lucide-react';
import { BookingPayload } from '../types';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const BookAppointment = () => {
  const { t, dir } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Design',
    date: '',
    time: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeSelect = (time: string) => {
    setFormData({ ...formData, time });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      alert("Please select a time slot / الرجاء اختيار الوقت");
      return;
    }
    
    setLoading(true);

    const payload: BookingPayload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      service: formData.service,
      date: formData.date,
      time: formData.time,
      reason: formData.reason,
      timestamp: new Date().toISOString()
    };

    const res = await submitBooking(payload);
    setLoading(false);

    if (res && res.success) {
      setSuccess(true);
    } else {
      // The script should return { success: false, message: "Slot not available" }
      alert(res?.message || "Booking Failed / فشل الحجز");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ukra-navy flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('book_success')}</h2>
           <p className="text-gray-600 mb-6">
              {formData.date} - {formData.time}
           </p>
           <button onClick={() => window.location.reload()} className="btn-main w-full">
             {t('nav_home')}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 font-cairo" dir={dir}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <h1 className="text-4xl font-bold text-ukra-navy mb-2">{t('book_title')}</h1>
           <p className="text-gray-500">{t('book_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           
           {/* Left: Map & Info */}
           <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700 delay-100">
              
              {/* Info Card */}
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
                       <span>{t('work_hours')}</span>
                    </div>
                 </div>
              </div>

              {/* Map (Color) */}
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-md border-4 border-white relative">
                 <iframe 
                    src="https://maps.google.com/maps?q=Prince+Mohammad+Bin+Abdulaziz+St,+Alalia,+Madinah&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="100%" 
                    style={{border:0}} 
                    allowFullScreen 
                    loading="lazy"
                    title="UKRA Location"
                 ></iframe>
                 <a href="https://maps.app.goo.gl/DFDMbwSrfTkeawz98" target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
              </div>
           </div>

           {/* Right: Booking Form */}
           <div className="bg-white p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right duration-700 delay-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="label-std">{t('book_name')}</label>
                       <input required name="name" className="input-std" onChange={handleChange} />
                    </div>
                    <div>
                       <label className="label-std">{t('book_phone')}</label>
                       <input required name="phone" className="input-std" onChange={handleChange} />
                    </div>
                    <div className="md:col-span-2">
                       <label className="label-std">{t('book_email')}</label>
                       <input required name="email" type="email" className="input-std" onChange={handleChange} />
                    </div>
                 </div>

                 <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <label className="label-std mb-4 flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-ukra-gold" /> {t('book_service')} & {t('book_date')}
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <select name="service" className="input-std" onChange={handleChange}>
                          <option value="Design">{t('book_service_design')}</option>
                          <option value="Sales">{t('book_service_sales')}</option>
                       </select>
                       <input 
                         required 
                         type="date" 
                         name="date" 
                         className="input-std" 
                         min={new Date().toISOString().split('T')[0]}
                         onChange={handleChange} 
                       />
                    </div>

                    <label className="label-std mb-2">{t('book_time')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                       {TIME_SLOTS.map((time) => (
                          <button
                            type="button"
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`py-2 px-1 text-sm rounded border transition-all duration-200 ${
                               formData.time === time 
                               ? 'bg-ukra-navy text-white border-ukra-navy transform scale-105 shadow-md' 
                               : 'bg-white text-gray-600 border-gray-200 hover:border-ukra-gold hover:text-ukra-navy'
                            }`}
                          >
                             {time}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="label-std">{t('book_reason')}</label>
                    <textarea name="reason" className="input-std h-24" onChange={handleChange} placeholder="Briefly describe your project..." />
                 </div>

                 <button 
                   type="submit" 
                   disabled={loading}
                   className="btn-main w-full flex items-center justify-center gap-2"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : t('book_btn')}
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};
