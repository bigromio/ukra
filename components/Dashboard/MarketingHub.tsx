import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchAllUsers } from '../../services/apiService'; // سنستخدم الدالة لجلب العملاء
import { Send, Mail, MessageSquare, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const MarketingHub = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // تحميل العملاء
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const res = await fetchAllUsers();
    if (res.success) {
      // تصفية العملاء فقط (استبعاد الموظفين)
      const clients = res.users.filter((u: any) => u.role === 'customer');
      setUsers(clients);
    }
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) setSelectedUsers([]);
    else setSelectedUsers(users.map(u => u.id));
  };

  const toggleUser = (id: string) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(u => u !== id));
    else setSelectedUsers([...selectedUsers, id]);
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0 || !message) return;
    setSending(true);

    // محاكاة الإرسال (هنا سنربط بـ API الواتساب/الإيميل لاحقاً)
    // في الواقع سنقوم باستدعاء دالة Backend loop
    await new Promise(resolve => setTimeout(resolve, 2000));

    alert(lang === 'ar' 
      ? `تم جدولة الحملة لـ ${selectedUsers.length} عميل بنجاح!` 
      : `Campaign scheduled for ${selectedUsers.length} clients!`);
    
    setSending(false);
    setMessage('');
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1a2a3a]">{lang === 'ar' ? 'مركز التسويق' : 'Marketing Hub'}</h2>
          <p className="text-gray-400 text-sm">{lang === 'ar' ? 'إطلاق حملات واتساب وبريد إلكتروني' : 'Launch WhatsApp & Email campaigns'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيمن: إعداد الرسالة */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'whatsapp' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-50 text-gray-400'}`}
              >
                <MessageSquare size={20} /> WhatsApp
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'email' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-400'}`}
              >
                <Mail size={20} /> Email
              </button>
            </div>

            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'نص الرسالة' : 'Message Content'}</label>
                 <textarea 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   className="w-full h-40 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#c5a059] font-medium resize-none"
                   placeholder={lang === 'ar' ? 'اكتب نص الحملة هنا...' : 'Type campaign message here...'}
                 />
                 <p className="text-xs text-gray-400 mt-2 text-end">{message.length} chars</p>
               </div>
               
               {activeTab === 'whatsapp' && (
                 <div className="bg-yellow-50 p-4 rounded-xl flex gap-3 text-xs text-yellow-700">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" />
                   <p>{lang === 'ar' ? 'تنبيه: تأكد من مراعاة شروط واتساب لتجنب حظر الرقم. يفضل استخدام القوالب المعتمدة.' : 'Warning: Adhere to WhatsApp policies to avoid banning. Use approved templates.'}</p>
                 </div>
               )}

               <button 
                 onClick={handleSend}
                 disabled={sending || selectedUsers.length === 0 || !message}
                 className="w-full py-4 bg-[#1a2a3a] text-white rounded-xl font-bold hover:bg-[#c5a059] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                 {lang === 'ar' ? 'إرسال الحملة الآن' : 'Launch Campaign'}
               </button>
            </div>
          </div>
        </div>

        {/* العمود الأيسر: اختيار الجمهور */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[600px]">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-[#1a2a3a] flex items-center gap-2">
               <Users size={18} /> {lang === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
             </h3>
             <span className="text-xs font-bold bg-[#c5a059] text-white px-2 py-1 rounded-lg">{selectedUsers.length}</span>
           </div>

           <div className="mb-4">
             <button onClick={toggleSelectAll} className="text-xs font-bold text-[#c5a059] hover:underline">
               {selectedUsers.length === users.length ? (lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All') : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
             </button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
             {loading ? <Loader2 className="animate-spin mx-auto mt-10" /> : users.map(user => (
               <div 
                 key={user.id} 
                 onClick={() => toggleUser(user.id)}
                 className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedUsers.includes(user.id) ? 'border-[#c5a059] bg-[#c5a059]/5' : 'border-gray-100 hover:bg-gray-50'}`}
               >
                 <div className="flex items-center gap-3 overflow-hidden">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedUsers.includes(user.id) ? 'bg-[#c5a059] text-white' : 'bg-gray-100 text-gray-500'}`}>
                     {user.name?.charAt(0)}
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-[#1a2a3a] truncate">{user.name}</p>
                     <p className="text-xs text-gray-400 truncate" dir="ltr">{user.phone}</p>
                   </div>
                 </div>
                 {selectedUsers.includes(user.id) && <CheckCircle size={16} className="text-[#c5a059]" />}
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};