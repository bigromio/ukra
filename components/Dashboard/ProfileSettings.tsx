import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, Phone, MapPin, Save, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ProfileSettings = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [data, setData] = useState({
    fullName: '',
    email: '',
    phone: localStorage.getItem('ukra_client_phone') || '',
    address: ''
  });

  const clientId = localStorage.getItem('ukra_client_id');

  useEffect(() => {
    if (clientId) fetchProfile();
  }, [clientId]);

  const fetchProfile = async () => {
    const { data: profile } = await supabase
      .from('customers')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (profile) {
      setData({
        fullName: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // تحديث البيانات في Supabase
    const { error } = await supabase
      .from('customers')
      .update({
        full_name: data.fullName,
        email: data.email,
        address: data.address
      })
      .eq('id', clientId);

    if (!error) {
      setMsg(lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully');
      
      // إذا أضاف إيميل، يمكننا إرسال رابط تحقق هنا مستقبلاً
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-in fade-in">
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="w-16 h-16 bg-[#c5a059]/10 rounded-full flex items-center justify-center text-[#c5a059]"><User size={32} /></div>
        <div>
          <h2 className="text-2xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}</h2>
          <p className="text-gray-400 text-sm">{lang === 'ar' ? 'حدث بياناتك لتصلك الإشعارات' : 'Update info for better service'}</p>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle size={20} /> {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
          <div className="relative">
            <User className="absolute top-4 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
            <input 
              type="text" 
              value={data.fullName}
              onChange={(e) => setData({...data, fullName: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-bold rtl:pr-12 rtl:pl-4"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'رقم الجوال (للدخول)' : 'Phone (Login ID)'}</label>
            <div className="relative">
              <Phone className="absolute top-4 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
              <input 
                type="text" 
                value={data.phone}
                disabled
                className="w-full pl-12 pr-4 py-4 bg-gray-100 text-gray-500 rounded-xl border-none font-bold cursor-not-allowed rtl:pr-12 rtl:pl-4"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}</label>
            <div className="relative">
              <Mail className="absolute top-4 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
              <input 
                type="email" 
                value={data.email}
                onChange={(e) => setData({...data, email: e.target.value})}
                placeholder="email@example.com"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-bold rtl:pr-12 rtl:pl-4"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'العنوان' : 'Address'}</label>
          <div className="relative">
            <MapPin className="absolute top-4 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
            <textarea 
              value={data.address}
              onChange={(e) => setData({...data, address: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-bold h-32 resize-none rtl:pr-12 rtl:pl-4"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all shadow-lg">
          {loading ? '...' : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </button>
      </form>
    </div>
  );
};