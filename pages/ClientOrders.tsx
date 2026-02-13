import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Clock, CheckCircle, Loader2, Folder, User, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const ClientOrders = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');

  // جلب البيانات من localStorage
  const clientId = localStorage.getItem('ukra_client_id');
  const clientPhone = localStorage.getItem('ukra_client_phone');

  useEffect(() => {
    if (!clientId) {
      navigate('/client-login');
      return;
    }
    loadClientData();
    loadOrders();
  }, [clientId]);

  // جلب اسم العميل من جدول customers
  const loadClientData = async () => {
    const { data } = await supabase
      .from('customers')
      .select('full_name')
      .eq('id', clientId)
      .single();
    if (data) setClientName(data.full_name);
  };

  // جلب الطلبات المرتبطة بهذا العميل فقط
  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // مسح كل بيانات الجلسة
    window.location.href = '/'; // العودة للرئيسية
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed': 
      case 'delivered':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {lang === 'ar' ? 'مكتمل' : 'Completed'}</span>;
      case 'shipped':
      case 'processing':
      case 'pending':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {lang === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto">
        
        {/* Header الشخصي للعميل */}
        <div className="bg-[#1a2a3a] text-white rounded-2xl p-6 mb-6 shadow-lg flex justify-between items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059] opacity-10 rounded-full -mr-16 -mt-16"></div>
           <div className="relative z-10">
             <h1 className="text-2xl font-bold font-display">{lang === 'ar' ? 'طلباتي' : 'My Requests'}</h1>
             <p className="text-gray-300 text-sm mt-1">
                {lang === 'ar' ? 'أهلاً بك،' : 'Welcome,'} {clientName || clientPhone}
             </p>
           </div>
           <button 
             onClick={handleLogout} 
             className="bg-white/10 p-3 rounded-xl hover:bg-red-500/20 transition-all text-white flex items-center gap-2 text-sm border border-white/5"
             title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>

        {/* قائمة الطلبات */}
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#c5a059]" /></div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#1a2a3a] group-hover:bg-[#c5a059]/10 group-hover:text-[#c5a059] transition-colors">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">
                            {order.project_name || (lang === 'ar' ? 'طلب توريد أثاث' : 'Furniture Request')}
                        </h3>
                        <span className="text-xs text-gray-500 font-num">
                            #{order.id.toString().slice(-5)} • {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                   </div>
                   {getStatusBadge(order.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 px-2 line-clamp-2">
                  {order.details?.items?.map((i: any) => i.name_ar || i.name).join(', ') || (lang === 'ar' ? 'لا توجد تفاصيل إضافية' : 'No extra details')}
                </p>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                    {lang === 'ar' ? 'تفاصيل الطلب' : 'View Details'}
                  </button>
                  {order.drive_folder_url && (
                    <a 
                      href={order.drive_folder_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-[#c5a059] text-white text-sm font-bold hover:bg-[#b08d4a] flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <Folder className="w-4 h-4" /> {lang === 'ar' ? 'الملفات' : 'Files'}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
               <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <p className="text-lg">{lang === 'ar' ? 'لا توجد طلبات نشطة حالياً' : 'No active requests found.'}</p>
               <button 
                 onClick={() => navigate('/store')}
                 className="mt-4 text-[#c5a059] font-bold hover:underline"
               >
                 {lang === 'ar' ? 'تصفح المتجر الآن' : 'Browse Store Now'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};