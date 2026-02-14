import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, MapPin, Phone, User, Calendar, FileText, Package, DollarSign } from 'lucide-react';
import { addOrderNote } from '../../services/apiService'; // سنحتاج للتأكد من وجود هذه الدالة

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const OrderDetailsModal = ({ isOpen, onClose, order }: OrderDetailsModalProps) => {
  const { t, lang, dir } = useLanguage();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // تحليل تفاصيل الطلب (لأنها تأتي كـ JSON)
  const details = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;
  const items = details.items || [];

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsSubmitting(true);
    // استدعاء دالة إضافة ملاحظة (للتواصل الداخلي)
    await addOrderNote(order.id, note, 'Admin'); 
    setNote('');
    setIsSubmitting(false);
    alert(lang === 'ar' ? 'تم إضافة الملاحظة' : 'Note added');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col" dir={dir}>
        
        {/* Header */}
        <div className="bg-[#1a2a3a] p-6 flex justify-between items-center text-white">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <FileText className="text-[#c5a059]" />
              {lang === 'ar' ? `تفاصيل الطلب #${order.id.toString().slice(-6)}` : `Order #${order.id.toString().slice(-6)} Details`}
            </h3>
            <p className="text-gray-400 text-xs mt-1">{order.date} • {order.status}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* القسم الأيمن: بيانات العميل والمنتجات */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2">
                  <User size={18} /> {lang === 'ar' ? 'بيانات العميل' : 'Customer Info'}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span>
                    <span className="font-bold">{order.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'ar' ? 'الجوال:' : 'Phone:'}</span>
                    <span className="font-bold font-mono" dir="ltr">{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{lang === 'ar' ? 'العنوان:' : 'Address:'}</span>
                    <span className="font-bold">{details.address || (lang === 'ar' ? 'غير محدد' : 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2">
                  <Package size={18} /> {lang === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'}
                </h4>
                <div className="space-y-3">
                  {items.length > 0 ? items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[#1a2a3a]">{item.name_ar || item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-bold text-[#c5a059]">{item.price} SAR</div>
                    </div>
                  )) : (
                    <p className="text-gray-400 text-sm italic">
                      {lang === 'ar' ? 'لا توجد منتجات (قد يكون طلب خدمة)' : 'No items (Service request)'}
                    </p>
                  )}
                </div>
                
                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-black text-lg">{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="font-black text-xl text-[#1a2a3a]">{order.amount}</span>
                </div>
              </div>
            </div>

            {/* القسم الأيسر: الملاحظات والسجلات */}
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 h-fit">
              <h4 className="font-bold text-[#1a2a3a] mb-4 flex items-center gap-2">
                <FileText size={18} /> {lang === 'ar' ? 'سجل الملاحظات' : 'Order Logs & Notes'}
              </h4>
              
              {/* Logs List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {details.logs && details.logs.length > 0 ? (
                  details.logs.map((log: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 text-sm">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="font-bold text-[#1a2a3a]">{log.author || 'System'}</span>
                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600">{log.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 text-sm py-4">{lang === 'ar' ? 'لا توجد ملاحظات سابقة' : 'No logs yet'}</p>
                )}
              </div>

              {/* Add Note */}
              <div className="mt-auto">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'أضف ملاحظة إدارية...' : 'Add admin note...'}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm mb-2 focus:ring-2 focus:ring-[#c5a059] outline-none"
                  rows={3}
                ></textarea>
                <button 
                  onClick={handleAddNote}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#1a2a3a] text-white rounded-xl font-bold text-sm hover:bg-[#c5a059] transition-all"
                >
                  {isSubmitting ? '...' : (lang === 'ar' ? 'إضافة الملاحظة' : 'Add Note')}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};