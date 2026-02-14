import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchAllOrders, updateOrderStatus } from '../../services/apiService'; // سنحتاج لإضافة updateOrderStatus لاحقاً
import { FileText, Search, Filter, CheckCircle, Clock, Truck, XCircle, Eye, Loader2, Download } from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal'; // سنستخدم المودال الموجود أو نحدثه

export const OrdersManagement = () => {
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // حالة المودال للتفاصيل
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, searchTerm, orders]);

  const loadOrders = async () => {
    setLoading(true);
    const response = await fetchAllOrders();
    if (response.success) {
      setOrders(response.orders);
    }
    setLoading(false);
  };

  const filterOrders = () => {
    let result = orders;

    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // بحث بالاسم أو رقم الطلب
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.id.toString().includes(term) || 
        o.client?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );
    }

    setFilteredOrders(result);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('pending') || s === 'new') return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> {lang === 'ar' ? 'انتظار' : 'Pending'}</span>;
    if (s.includes('processing')) return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Loader2 size={12} className="animate-spin"/> {lang === 'ar' ? 'جاري التنفيذ' : 'Processing'}</span>;
    if (s.includes('shipped')) return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12}/> {lang === 'ar' ? 'تم الشحن' : 'Shipped'}</span>;
    if (s.includes('completed')) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> {lang === 'ar' ? 'مكتمل' : 'Completed'}</span>;
    if (s.includes('cancel')) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> {lang === 'ar' ? 'ملغي' : 'Cancelled'}</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // تحديث فوري (Optimistic)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // هنا سنستدعي API التحديث (سنضيفها لـ apiService لاحقاً)
    // await updateOrderStatus(orderId, newStatus);
    
    // محاكاة إشعار (مكان ربط الواتساب مستقبلاً)
    console.log(`Notification trigger: Order ${orderId} status changed to ${newStatus}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}</h2>
          <p className="text-gray-400 text-sm">{lang === 'ar' ? 'متابعة وتحديث حالات طلبات العملاء' : 'Track and manage client orders'}</p>
        </div>
        
        <div className="flex gap-2">
           <button onClick={loadOrders} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
             <Clock size={20} className={loading ? 'animate-spin' : ''} />
           </button>
           <button className="bg-[#1a2a3a] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-[#c5a059] transition-colors">
             <Download size={16} /> {lang === 'ar' ? 'تصدير التقرير' : 'Export Report'}
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-3.5 left-4 text-gray-400 w-5 h-5 rtl:right-4 rtl:left-auto" />
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'بحث برقم الطلب، اسم العميل، أو الجوال...' : 'Search order #, client name, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-medium rtl:pr-12 rtl:pl-4"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter size={20} className="text-gray-400 shrink-0" />
          {['all', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === st ? 'bg-[#1a2a3a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {lang === 'ar' && st === 'all' ? 'الكل' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c5a059]" /></div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-start font-bold text-gray-500 text-sm">#</th>
                  <th className="p-6 text-start font-bold text-gray-500 text-sm">{lang === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="p-6 text-start font-bold text-gray-500 text-sm">{lang === 'ar' ? 'النوع / التاريخ' : 'Type / Date'}</th>
                  <th className="p-6 text-start font-bold text-gray-500 text-sm">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-6 text-start font-bold text-gray-500 text-sm">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th className="p-6 text-end font-bold text-gray-500 text-sm">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6 font-bold text-gray-400 text-xs">#{order.id.toString().slice(-6)}</td>
                    <td className="p-6">
                      <div className="font-bold text-[#1a2a3a]">{order.client || 'Unknown'}</div>
                      <div className="text-xs text-gray-400 font-mono" dir="ltr">{order.phone}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-sm text-[#1a2a3a]">{order.type}</div>
                      <div className="text-xs text-gray-400">{order.date}</div>
                    </td>
                    <td className="p-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-6 font-bold text-[#c5a059]">{order.amount}</td>
                    <td className="p-6 text-end">
                      <div className="flex justify-end gap-2">
                         <button 
                           onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                           className="p-2 text-gray-400 hover:text-[#1a2a3a] hover:bg-gray-100 rounded-lg transition-all"
                           title="View Details"
                         >
                           <Eye size={18} />
                         </button>
                         
                         {/* Quick Actions for Status */}
                         <select 
                           value={order.status}
                           onChange={(e) => handleStatusChange(order.id, e.target.value)}
                           className="text-xs bg-gray-50 border-none rounded-lg py-1 px-2 font-bold text-gray-600 focus:ring-1 focus:ring-[#c5a059] cursor-pointer"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <option value="Pending">Pending</option>
                           <option value="Processing">Processing</option>
                           <option value="Shipped">Shipped</option>
                           <option value="Completed">Completed</option>
                           <option value="Cancelled">Cancelled</option>
                         </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-gray-400">
             <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p className="font-bold">{lang === 'ar' ? 'لا توجد طلبات مطابقة' : 'No orders found'}</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderDetailsModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          order={selectedOrder} 
        />
      )}
    </div>
  );
};