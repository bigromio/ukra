import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Clock, CheckCircle, Loader2, Folder, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

// تعريف نوع البيانات لتجنب استخدام any
interface Order {
  id: number;
  created_at: string;
  status: string;
  project_name?: string;
  details?: {
    items?: Array<{ name: string; name_ar?: string }>;
  };
  drive_folder_url?: string;
}

export const ClientOrders = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات من localStorage
  const clientId = localStorage.getItem('ukra_client_id');

  useEffect(() => {
    if (clientId) {
      loadOrders();
    }
  }, [clientId]);

  // دالة جلب الطلبات
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

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed': 
      case 'delivered':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {lang === 'ar' ? 'مكتمل' : 'Completed'}</span>;
      case 'shipped':
      case 'processing':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {lang === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* عنوان القسم وزر التحديث */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'سجل الطلبات' : 'Order History'}</h2>
           <p className="text-sm text-gray-400">{lang === 'ar' ? 'تتبع حالة طلباتك الحالية والسابقة' : 'Track your current and past orders'}</p>
        </div>
        <button 
          onClick={loadOrders} 
          disabled={loading}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all active:scale-95"
          title={lang === 'ar' ? 'تحديث القائمة' : 'Refresh List'}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* قائمة الطلبات */}
      <div className="grid gap-4">
        {loading ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c5a059] mb-4" />
             <p className="text-gray-400 font-bold">{lang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...'}</p>
           </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-[#c5a059] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#1a2a3a]/5 flex items-center justify-center text-[#1a2a3a] group-hover:bg-[#c5a059] group-hover:text-white transition-colors">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#1a2a3a]">
                          {order.project_name || (lang === 'ar' ? 'طلب توريد أثاث' : 'Furniture Request')}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{order.id}</span>
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    </div>
                 </div>
                 {getStatusBadge(order.status)}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  {order.details?.items?.map((i: any) => i.name_ar || i.name).join('، ') || (lang === 'ar' ? 'لا توجد تفاصيل إضافية للعناصر.' : 'No item details available.')}
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3.5 rounded-xl border-2 border-gray-100 text-sm font-bold text-gray-600 hover:border-[#c5a059] hover:text-[#c5a059] transition-all">
                  {lang === 'ar' ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                </button>
                {order.drive_folder_url && (
                  <a 
                    href={order.drive_folder_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 rounded-xl bg-[#1a2a3a] text-white text-sm font-bold hover:bg-[#c5a059] flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1a2a3a]/10"
                  >
                    <Folder className="w-4 h-4" /> {lang === 'ar' ? 'ملفات ومخططات المشروع' : 'Project Files'}
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <FileText className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="text-xl font-bold text-[#1a2a3a] mb-2">{lang === 'ar' ? 'لا توجد طلبات سابقة' : 'No Order History'}</h3>
             <p className="text-gray-400 mb-8 max-w-xs mx-auto">{lang === 'ar' ? 'لم تقم بإنشاء أي طلبات توريد أو تصميم حتى الآن.' : 'You haven\'t made any requests yet.'}</p>
             <button 
               onClick={() => navigate('/store')}
               className="bg-[#c5a059] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08d4a] transition-all shadow-lg shadow-[#c5a059]/20"
             >
               {lang === 'ar' ? 'تصفح الكتالوج' : 'Browse Catalog'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};