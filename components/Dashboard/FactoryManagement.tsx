import React, { useState, useEffect } from 'react';
import { 
  fetchWorkTickets, bulkCreateWorkTickets, deleteWorkTicket, updateWorkTicket, settleTickets, 
  fetchPurchases, createPurchase, 
  uploadReceiptImage, createPettyCash, fetchPettyCash, approvePettyCash, fetchActiveProjects 
} from '../../services/apiService';
import { 
  Factory, Users, Plus, Loader2, X, MapPin, CheckCircle, Clock, CalendarRange, Trash2, 
  Edit, Search, ArrowUpDown, Bell, FileText, ShoppingCart, Calculator, Receipt, DollarSign, 
  Wallet, ShieldCheck, UploadCloud, Download
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext'; // تأكد من إضافتها فوق مع الـ imports

export const FactoryManagement = () => {
  const { user } = useAuth(); // جلب بيانات الموظف
  const isOwner = user?.role === 'owner';
  const allowedTabs = user?.allowed_tabs || [];

  // تحديد ما يملكه الموظف من صلاحيات
  const hasManagerAccess = isOwner || allowedTabs.includes('factory_manager');
  const hasAccountantAccess = isOwner || allowedTabs.includes('factory_accountant');

  // استبدال حالة الـ userRole القديمة لتصبح متغيرة ديناميكياً
  const [userRole, setUserRole] = useState<'factory_manager' | 'accountant'>(() => {
    if (hasManagerAccess) return 'factory_manager';
    if (hasAccountantAccess) return 'accountant';
    return 'factory_manager'; 
  });
  
  // ==========================================
  // 2. الحالات والتبويبات
  // ==========================================
  const [activeTab, setActiveTab] = useState<'workers' | 'purchases' | 'petty_cash'>('workers');
  
  // قوائم البيانات من قاعدة البيانات
  const [tickets, setTickets] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [pettyCashList, setPettyCashList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // المشاريع المفتوحة
  const [loading, setLoading] = useState(true);

  // حالات الفلاتر والتسوية (العمال)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedForSettlement, setSelectedForSettlement] = useState<number[]>([]);

  // ==========================================
  // 3. حالات النوافذ المنبثقة (Modals) والملفات
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);

  // حالات النماذج (Forms)
  const [newTicket, setNewTicket] = useState({ worker_name: '', phone: '', daily_wage: '', start_date: '', end_date: '', start_time: '08:00', end_time: '17:00' });
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [deductionTicket, setDeductionTicket] = useState<any>(null);
  const [newPurchase, setNewPurchase] = useState({ item_name: '', category: 'مواد خام', amount: '', project_id: '' });
  const [newPettyCash, setNewPettyCash] = useState({ amount: '' });

  // حالات رفع الملفات والتحميل
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  // ==========================================
  // 4. جلب البيانات (Data Fetching)
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // جلب العمال (فقط للمدير)
    const ticketsData = await fetchWorkTickets();
    const activeTickets = ticketsData?.filter((t: any) => !t.is_archived) || [];
    setTickets(activeTickets);

    // جلب المشتريات
    const purchasesData = await fetchPurchases();
    setPurchases(purchasesData || []);

    // جلب العهد المالية
    const cashData = await fetchPettyCash();
    setPettyCashList(cashData || []);

    // جلب المشاريع المفتوحة (لربط الخامات بها)
    const projectsData = await fetchActiveProjects();
    setProjects(projectsData || []);
    
    setLoading(false);
  };



  // ==========================================
  // 5. الإحصائيات والفلاتر
  // ==========================================
  const filteredAndSortedTickets = tickets
    .filter(t => t.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.work_date.includes(searchQuery))
    .sort((a, b) => {
      const dateA = new Date(a.work_date).getTime();
      const dateB = new Date(b.work_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const completedTickets = tickets.filter(t => t.status === 'completed' || t.status === 'checked_in');
  const totalActualDays = completedTickets.length;
  const totalActualCost = completedTickets.reduce((sum, t) => sum + (parseFloat(t.daily_wage) || 0) - (parseFloat(t.deductions) || 0), 0);
  const totalPurchasesCost = purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const isLate = (workDate: string, status: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(workDate);
    return date < today && status === 'pending';
  };

  // ============== نهاية الجزء الأول ==============

  // ==========================================
  // 6. دوال معالجة العمال (إضافة، تعديل، إلغاء، تسوية)
  // ==========================================

  const handleCreateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    let formattedPhone = newTicket.phone.trim().replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) formattedPhone = '966' + formattedPhone.substring(1);

    const start = new Date(newTicket.start_date);
    const end = new Date(newTicket.end_date);
    const ticketsToInsert = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      ticketsToInsert.push({
        worker_name: newTicket.worker_name,
        phone: formattedPhone,
        daily_wage: parseFloat(newTicket.daily_wage) || 0,
        work_date: d.toLocaleDateString('en-CA'),
        start_time: newTicket.start_time,
        end_time: newTicket.end_time,
        deductions: 0,
        is_archived: false
      });
    }

    if (ticketsToInsert.length === 0) {
      alert('تاريخ النهاية يجب أن يكون مساوياً أو بعد تاريخ البداية.');
      setAddLoading(false); return;
    }

    const success = await bulkCreateWorkTickets(ticketsToInsert);
    if (success) {
      const attendanceLink = `https://ukra.sa/attendance/${formattedPhone}`;
      const message = `أهلاً بك يا ${newTicket.worker_name} 👋\n\nتم تسجيل جدول عمل لك في مصنع UKRA للفترة من ${newTicket.start_date} إلى ${newTicket.end_date}\n⏰ وقت الدوام: من ${newTicket.start_time} إلى ${newTicket.end_time}\n📍 *رابط الحضور للانصراف:*\n${attendanceLink}`;
      try { await fetch('https://api.ukra.sa/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: formattedPhone, message: message }) }); } catch (err) {}
      
      setIsModalOpen(false);
      setNewTicket({ worker_name: '', phone: '', daily_wage: '', start_date: '', end_date: '', start_time: '08:00', end_time: '17:00' });
      loadData();
    } else {
      alert('حدث خطأ أثناء الجدولة.');
    }
    setAddLoading(false);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const updates = { work_date: editingTicket.work_date, start_time: editingTicket.start_time, end_time: editingTicket.end_time };
    const success = await updateWorkTicket(editingTicket.id, updates);
    if (success) {
      const message = `مرحباً ${editingTicket.worker_name} ✏️\n\nتم تعديل بيانات يوم العمل الخاص بك لتصبح:\n📅 التاريخ: ${updates.work_date}\n⏰ الوقت: ${updates.start_time} - ${updates.end_time}`;
      try { await fetch('https://api.ukra.sa/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: editingTicket.phone, message: message }) }); } catch (err) {}
      setIsEditModalOpen(false); loadData();
    } else { alert('خطأ في التعديل.'); }
    setAddLoading(false);
  };

  const handleSaveDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const updates = { deductions: parseFloat(deductionTicket.deductions) || 0 };
    const success = await updateWorkTicket(deductionTicket.id, updates);
    if (success) { setIsDeductionModalOpen(false); loadData(); } else { alert('خطأ في حفظ الخصم.'); }
    setAddLoading(false);
  };

  const handleCancelTicket = async (ticket: any) => {
    if (!window.confirm(`تأكيد إلغاء يوم العمل للعامل ${ticket.worker_name}؟\nسيتم إرسال إشعار اعتذار له.`)) return;
    setCancelLoading(ticket.id);
    const message = `مرحباً ${ticket.worker_name}،\n\nنود إعلامك بأنه تم **إلغاء** يوم العمل المقرر لك بتاريخ ${ticket.work_date}.\nنعتذر عن الإزعاج.`;
    try { await fetch('https://api.ukra.sa/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: ticket.phone, message: message }) }); } catch (e) {}
    const success = await deleteWorkTicket(ticket.id);
    if (success) loadData();
    setCancelLoading(null);
  };

  const handleSettlement = async () => {
    if(selectedForSettlement.length === 0) return alert('يرجى تحديد أيام عمل أولاً للتسوية.');
    if(window.confirm(`تأكيد تسوية وأرشفة ${selectedForSettlement.length} أيام عمل؟`)){
      const success = await settleTickets(selectedForSettlement);
      if (success) { alert('تمت التسوية بنجاح وتمت أرشفة الأيام.'); setSelectedForSettlement([]); loadData(); }
      else { alert('حدث خطأ أثناء التسوية.'); }
    }
  };

  // ==========================================
  // 7. دوال معالجة المشتريات والعهد المالية
  // ==========================================

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 💡 التحقق المحاسبي الإجباري:
    if (newPurchase.category === 'مواد خام' && !newPurchase.project_id) {
      return alert('⚠️ إجراء مرفوض محاسبياً: لا يمكن شراء "مواد خام" بدون ربطها بمشروع أو طلب مفتوح!');
    }

    if (!selectedFile) {
      return alert('⚠️ يرجى إرفاق صورة الفاتورة أو الإيصال أولاً للحفظ في المستودع!');
    }

    setAddLoading(true);

    // 1. رفع الملف إلى مستودع Supabase
    const receiptUrl = await uploadReceiptImage(selectedFile);

    if (receiptUrl) {
      // 2. حفظ البيانات في قاعدة البيانات
      const purchaseData = {
        item_name: newPurchase.item_name,
        category: newPurchase.category,
        amount: parseFloat(newPurchase.amount) || 0,
        project_id: newPurchase.project_id || null,
        receipt_url: receiptUrl
      };

      const success = await createPurchase(purchaseData);
      if (success) {
        setIsPurchaseModalOpen(false);
        setNewPurchase({ item_name: '', category: 'مواد خام', amount: '', project_id: '' });
        setSelectedFile(null); 
        loadData();
      } else {
        alert('حدث خطأ أثناء حفظ الفاتورة.');
      }
    } else {
      alert('حدث خطأ أثناء رفع الفاتورة للمستودع، تأكد من اتصالك.');
    }
    
    setAddLoading(false);
  };

  const handleAddPettyCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert('⚠️ يرجى إرفاق صورة إيصال التحويل البنكي للعهدة!');
    
    setAddLoading(true);
    const receiptUrl = await uploadReceiptImage(selectedFile);
    
    if (receiptUrl) {
      const success = await createPettyCash({ 
        amount: parseFloat(newPettyCash.amount), 
        receipt_url: receiptUrl 
      });
      if (success) {
        setIsPettyCashModalOpen(false);
        setNewPettyCash({ amount: '' });
        setSelectedFile(null);
        loadData();
        alert('تم رفع العهدة بنجاح وهي بانتظار اعتماد مدير المصنع.');
      }
    }
    setAddLoading(false);
  };

  const handleApproveCash = async (id: string | number) => {
    if(window.confirm('هل تؤكد استلام هذه العهدة وإضافتها لرصيد المصنع الفعلي؟')) {
      const success = await approvePettyCash(id);
      if(success) loadData();
    }
  };

  // ============== نهاية الجزء الثاني ==============

  // ==========================================
  // 8. واجهة المستخدم (الريندر النهائي)
  // ==========================================
// ==========================================
  // دالة تصدير البيانات إلى ملف Excel (CSV)
  // ==========================================
  const exportToCSV = (type: 'workers' | 'purchases') => {
    let csvContent = ""; 
    
    if (type === 'workers') {
      csvContent += "اسم العامل,رقم الجوال,تاريخ العمل,وقت البدء,وقت الانصراف,الأجر اليومي,الخصم,الحالة\n";
      filteredAndSortedTickets.forEach(ticket => {
        const statusText = ticket.status === 'completed' ? 'مكتمل' : ticket.status === 'checked_in' ? 'متواجد' : 'انتظار';
        csvContent += `"${ticket.worker_name}","${ticket.phone}","${ticket.work_date}","${ticket.start_time}","${ticket.end_time}","${ticket.daily_wage}","${ticket.deductions}","${statusText}"\n`;
      });
    } else if (type === 'purchases') {
      csvContent += "رقم المرجع,تاريخ الفاتورة,البيان,التصنيف,المبلغ,ارتباط المشروع\n";
      purchases.forEach(p => {
        const date = p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');
        const refId = p.id ? String(p.id).substring(0,8) : '-';
        // علامة # موجودة هنا ولن تسبب أي مشكلة بعد الآن
        const project = p.project_id ? `الطلب #${String(p.project_id).substring(0,6)}` : 'مصروف عام';
        
        csvContent += `"${refId}","${date}","${p.item_name}","${p.category}","${p.amount}","${project}"\n`;
      });
    }

    // 💡 استخدام تقنية Blob لحل مشكلة الرموز (مثل #) ودعم الملفات الكبيرة
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_${type === 'workers' ? 'العمالة' : 'المشتريات'}_${new Date().toLocaleDateString('en-CA')}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // تنظيف الذاكرة بعد التحميل
  };

  // 4. الحماية: إذا لم يكن يمتلك أي صلاحية للمصنع إطلاقاً
  if (!hasManagerAccess && !hasAccountantAccess) {
    return (
       <div className="flex flex-col items-center justify-center h-screen">
         <ShieldCheck className="w-16 h-16 text-red-400 mb-4" />
         <h2 className="text-xl font-bold text-gray-800">صلاحية غير متوفرة</h2>
         <p className="text-gray-500 mt-2">عذراً، ليس لديك صلاحية لعرض لوحة إدارة المصنع.</p>
       </div>
    );
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c5a059]" /></div>;

  return (
    <div className="bg-gray-50/50 min-h-screen p-4 md:p-6 font-tajawal" dir="rtl">
      
    {/* عرض أزرار التبديل فقط إذا كان المستخدم يملك الصلاحيتين معاً (أو المالك) */}
      {(isOwner || (hasManagerAccess && hasAccountantAccess)) && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#c5a059]" />
            <span className="font-bold text-[#1a2a3a]">تبديل شاشة العرض (صلاحية إدارية)</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => {setUserRole('factory_manager'); setActiveTab('workers');}} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${userRole === 'factory_manager' ? 'bg-[#1a2a3a] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>مدير المصنع</button>
            <button onClick={() => {setUserRole('accountant'); setActiveTab('petty_cash');}} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${userRole === 'accountant' ? 'bg-[#1a2a3a] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>المحاسب المالي</button>
          </div>
        </div>
      )}

      {/* التبويبات العلوية (تتغير حسب الصلاحية) */}
{/* التبويبات العلوية (تظهر للجميع، ولكن الصلاحيات بالداخل تختلف) */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('workers')} className={`pb-3 font-bold text-base md:text-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'workers' ? 'text-[#c5a059] border-b-2 border-[#c5a059]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Users size={20} /> إدارة العمالة والتسويات
        </button>
        <button onClick={() => setActiveTab('purchases')} className={`pb-3 font-bold text-base md:text-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'purchases' ? 'text-[#c5a059] border-b-2 border-[#c5a059]' : 'text-gray-400 hover:text-gray-600'}`}>
          <ShoppingCart size={20} /> سجل المشتريات والمصروفات
        </button>
        <button onClick={() => setActiveTab('petty_cash')} className={`pb-3 font-bold text-base md:text-lg flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'petty_cash' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <Wallet size={20} /> إدارة العهد المالية
        </button>
      </div>

      {/* ==================== تبويب العمالة (للمدير فقط) ==================== */}
      {activeTab === 'workers' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calculator size={24} /></div>
              <div><p className="text-sm text-gray-500 font-bold">إجمالي أيام العمل الفعلية</p><p className="text-2xl font-black font-num text-[#1a2a3a]">{totalActualDays} <span className="text-sm font-normal">يوم</span></p></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><FileText size={24} /></div>
              <div><p className="text-sm text-gray-500 font-bold">التكلفة الإجمالية الفعلية (بعد الخصومات)</p><p className="text-2xl font-black font-num text-[#1a2a3a]">{totalActualCost.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64"><Search className="absolute right-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="بحث باسم العامل أو التاريخ..." className="w-full pl-3 pr-10 py-2 border rounded-xl outline-none focus:border-[#c5a059] text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600"><ArrowUpDown size={20} /></button>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {/* 👁️ زر التصدير يظهر للجميع (المدير والمحاسب) */}
                <button onClick={() => exportToCSV('workers')} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Download size={16} /> تقرير Excel
                </button>

                {/* 🔒 تظهر أزرار الإضافة والتسوية للمدير فقط */}
                {userRole === 'factory_manager' && (
                  <>
                    {selectedForSettlement.length > 0 && <button onClick={handleSettlement} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-2"><FileText size={16} /> تسوية ({selectedForSettlement.length}) أيام</button>}
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-[#1a2a3a] text-white px-4 py-2 rounded-xl hover:bg-opacity-90 font-bold text-sm flex items-center justify-center gap-2"><CalendarRange size={16} /> جدولة عمل</button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <tr>
                    {userRole === 'factory_manager' && <th className="p-4 rounded-r-lg w-10"><input type="checkbox" onChange={(e) => setSelectedForSettlement(e.target.checked ? tickets.map(t => t.id) : [])} checked={selectedForSettlement.length === tickets.length && tickets.length > 0} className="w-4 h-4 accent-[#c5a059] rounded" /></th>}
                    <th className="p-4">الاسم</th><th className="p-4">تاريخ العمل</th><th className="p-4">المالية</th><th className="p-4 text-center">الحالة</th>
                    {userRole === 'factory_manager' && <th className="p-4 rounded-l-lg text-center">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAndSortedTickets.map(ticket => {
                    const late = isLate(ticket.work_date, ticket.status);
                    const canEditAdmin = ticket.status === 'pending';
                    return (
                      <tr key={ticket.id} className={`transition-colors ${late ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                        {userRole === 'factory_manager' && <td className="p-4 text-center"><input type="checkbox" checked={selectedForSettlement.includes(ticket.id)} onChange={(e) => { if(e.target.checked) setSelectedForSettlement([...selectedForSettlement, ticket.id]); else setSelectedForSettlement(selectedForSettlement.filter(id => id !== ticket.id)); }} className="w-4 h-4 accent-[#c5a059] rounded" /></td>}
                        
                        <td className="p-4 font-bold text-[#1a2a3a]"><div className="flex items-center gap-2">{late && <Bell className="text-red-500 animate-pulse" size={16} />}{ticket.worker_name}</div><span className="text-xs text-gray-400 font-num" dir="ltr">{ticket.phone}</span></td>
                        <td className="p-4 text-sm"><span className={`font-num font-bold ${late ? 'text-red-600' : 'text-[#c5a059]'}`}>{ticket.work_date}</span><br/><span className="text-xs text-gray-500 font-num">{ticket.start_time} - {ticket.end_time}</span></td>
                        <td className="p-4 text-sm font-num"><div className="text-[#1a2a3a] font-bold">أجر: {ticket.daily_wage}</div>{ticket.deductions > 0 && <div className="text-red-500 text-xs">خصم: -{ticket.deductions}</div>}</td>
                        <td className="p-4 text-center">
                          {ticket.status === 'pending' && <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${late ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}><Clock size={12}/> {late ? 'متأخر' : 'انتظار'}</span>}
                          {ticket.status === 'checked_in' && <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"><MapPin size={12}/> متواجد الآن</span>}
                          {ticket.status === 'completed' && <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={12}/> مكتمل</span>}
                        </td>
                        
                        {/* 🔒 تظهر أزرار الخصم والتعديل للمدير فقط */}
                        {userRole === 'factory_manager' && (
                          <td className="p-4 flex items-center justify-center gap-1">
                            <button title="خصم/سلفة" className="text-green-600 hover:bg-green-50 p-2 rounded-lg" onClick={() => { setDeductionTicket(ticket); setIsDeductionModalOpen(true); }}><DollarSign size={16} /></button>
                            <button disabled={!canEditAdmin} title="تعديل إداري" className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg disabled:opacity-30" onClick={() => { setEditingTicket(ticket); setIsEditModalOpen(true); }}><Edit size={16} /></button>
                            <button disabled={!canEditAdmin || cancelLoading === ticket.id} title="إلغاء" className="text-red-500 hover:bg-red-50 p-2 rounded-lg disabled:opacity-30" onClick={() => handleCancelTicket(ticket)}>{cancelLoading === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}</button>
                          </td>
                        )}
                      </tr>
                  )})}
                  {tickets.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">لا توجد عمالة مجدولة حالياً.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== تبويب المشتريات (للمدير فقط) ==================== */}
      {activeTab === 'purchases' &&  (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 w-full md:w-1/3">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><ShoppingCart size={24} /></div>
            <div><p className="text-sm text-gray-500 font-bold">إجمالي المصروفات المسجلة</p><p className="text-2xl font-black font-num text-[#1a2a3a]">{totalPurchasesCost.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[#1a2a3a]">سجل المشتريات والمصروفات</h3>
              
              <div className="flex items-center gap-2">
                {/* 👁️ زر التصدير يظهر للجميع */}
                <button onClick={() => exportToCSV('purchases')} className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 font-bold text-sm flex items-center gap-2 transition-colors">
                  <Download size={16} /> تقرير Excel
                </button>

                {/* 🔒 يظهر زر الإضافة للمدير فقط */}
                {userRole === 'factory_manager' && (
                  <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-[#c5a059] text-white px-4 py-2 rounded-xl hover:bg-yellow-600 font-bold text-sm flex items-center gap-2"><Plus size={16} /> إضافة فاتورة شراء</button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <tr><th className="p-4 rounded-r-lg">البيان / الصنف</th><th className="p-4">التصنيف</th><th className="p-4">المبلغ</th><th className="p-4">ارتباط المشروع</th><th className="p-4 rounded-l-lg text-center">الفاتورة المرفقة</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-[#1a2a3a]">{p.item_name}<br/><span className="text-xs text-gray-400 font-num">{new Date(p.created_at).toLocaleDateString('ar-SA')}</span></td>
                      <td className="p-4 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{p.category}</span></td>
                      <td className="p-4 font-black font-num text-[#c5a059]">{p.amount} ر.س</td>
                      <td className="p-4 text-sm font-bold text-blue-600">{p.project_id ? `الطلب #${p.project_id.substring(0,6)}` : 'مصروف عام'}</td>
                      <td className="p-4 text-center">
                        {p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-[#c5a059] hover:text-yellow-600 flex flex-col items-center text-xs gap-1"><Receipt size={16} /> عرض الأصل</a> : <span className="text-gray-400 text-xs">لا يوجد</span>}
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">لم يتم تسجيل مشتريات بعد.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== تبويب العهدة المالية (مشترك) ==================== */}
      {activeTab === 'petty_cash' && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2"><Wallet /> سجل العهد المالية للمصنع</h3>
            {userRole === 'accountant' && (
              <button onClick={() => setIsPettyCashModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center gap-2"><Plus size={16} /> تحويل عهدة جديدة</button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-blue-50 text-blue-800 text-sm border-b border-blue-100">
                <tr><th className="p-4 rounded-r-lg">رقم المرجع</th><th className="p-4">تاريخ التحويل</th><th className="p-4">قيمة العهدة</th><th className="p-4 text-center">الإيصال البنكي</th><th className="p-4 rounded-l-lg text-center">الحالة / الاعتماد</th></tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {pettyCashList.map(cash => (
                  <tr key={cash.id} className="hover:bg-blue-50/50">
                    <td className="p-4 text-xs font-num text-gray-500">{cash.id.substring(0,8)}</td>
                    <td className="p-4 text-sm font-bold">{new Date(cash.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="p-4 font-black font-num text-blue-600 text-lg">{cash.amount} ر.س</td>
                    <td className="p-4 text-center">
                      <a href={cash.receipt_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1 text-sm"><Receipt size={16}/> عرض الإيصال</a>
                    </td>
                    <td className="p-4 text-center">
                      {cash.status === 'approved' ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={14}/> تم الاستلام والاعتماد</span>
                      ) : (
                        userRole === 'factory_manager' ? (
                          <button onClick={() => handleApproveCash(cash.id)} className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-600 shadow-sm transition-all">اعتماد استلام العهدة</button>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"><Clock size={14}/> بانتظار اعتماد المدير</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {pettyCashList.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">لا توجد عهد مالية مسجلة حالياً.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* النوافذ المنبثقة (Modals) */}
      {/* ========================================= */}

{/* 1. نافذة الجدولة (إضافة عمالة) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1a2a3a] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Users className="text-[#c5a059]" /> جدولة عمالة يومية</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400"><X /></button>
            </div>
            <form onSubmit={handleCreateTickets} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div><label className="block text-sm font-bold mb-1">اسم العامل *</label><input required type="text" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059]" value={newTicket.worker_name} onChange={e => setNewTicket({...newTicket, worker_name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">رقم الجوال (للواتساب) *</label><input required type="text" placeholder="مثال: 0540070093" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num text-right" value={newTicket.phone} onChange={e => setNewTicket({...newTicket, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">يومية العامل (ر.س) *</label><input required type="number" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.daily_wage} onChange={e => setNewTicket({...newTicket, daily_wage: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">من تاريخ *</label><input required type="date" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.start_date} onChange={e => setNewTicket({...newTicket, start_date: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">إلى تاريخ *</label><input required type="date" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.end_date} onChange={e => setNewTicket({...newTicket, end_date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">وقت البدء *</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.start_time} onChange={e => setNewTicket({...newTicket, start_time: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">وقت الانصراف *</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.end_time} onChange={e => setNewTicket({...newTicket, end_time: e.target.value})} /></div>
              </div>
              <button type="submit" disabled={addLoading} className="w-full bg-[#c5a059] hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex justify-center mt-6 transition-all">{addLoading ? <Loader2 className="animate-spin" /> : 'تسجيل الأيام وإرسال رابط الحضور'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. نافذة التعديل الإداري */}
      {isEditModalOpen && editingTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Edit size={18} /> تعديل إداري ليوم العمل</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="hover:text-red-200"><X /></button>
            </div>
            <form onSubmit={handleUpdateTicket} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">أنت تقوم بتعديل تاريخ/وقت <strong>{editingTicket.worker_name}</strong>. سيتم إرسال إشعار واتساب له.</p>
              <div><label className="block text-sm font-bold mb-1">تاريخ العمل</label><input required type="date" className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 font-num" value={editingTicket.work_date} onChange={e => setEditingTicket({...editingTicket, work_date: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">وقت البدء</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 font-num" value={editingTicket.start_time} onChange={e => setEditingTicket({...editingTicket, start_time: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">وقت الانصراف</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-blue-500 font-num" value={editingTicket.end_time} onChange={e => setEditingTicket({...editingTicket, end_time: e.target.value})} /></div>
              </div>
              <button type="submit" disabled={addLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex justify-center mt-6 transition-all">{addLoading ? <Loader2 className="animate-spin" /> : 'حفظ التعديل وإرسال الإشعار'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. نافذة الخصم والسلفة */}
      {isDeductionModalOpen && deductionTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-green-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={18} /> الخصومات والسُّلف</h3>
              <button onClick={() => setIsDeductionModalOpen(false)} className="hover:text-red-200"><X /></button>
            </div>
            <form onSubmit={handleSaveDeduction} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">تسجيل سلفة أو خصم للعامل:<br/><strong className="text-lg text-[#1a2a3a]">{deductionTicket.worker_name}</strong></p>
              <div>
                <label className="block text-sm font-bold mb-1 text-red-600">المبلغ المخصوم / السلفة (ر.س)</label>
                <input required type="number" placeholder="مثال: 50" className="w-full border-2 border-red-200 p-3 rounded-xl outline-none focus:border-red-500 font-num text-center text-lg" value={deductionTicket.deductions || ''} onChange={e => setDeductionTicket({...deductionTicket, deductions: e.target.value})} />
                <p className="text-[11px] text-gray-400 mt-2 text-center">سيتم خصم هذا المبلغ من مستحقات العامل عند التسوية النهائية.</p>
              </div>
              <button type="submit" disabled={addLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex justify-center mt-4 transition-all">{addLoading ? <Loader2 className="animate-spin" /> : 'حفظ الخصم'}</button>
            </form>
          </div>
        </div>
      )}
      
      {/* نافذة إضافة فاتورة شراء (للمدير) */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-[#c5a059] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={18} /> تسجيل فاتورة مشتريات</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="hover:text-red-200"><X /></button>
            </div>
            <form onSubmit={handleAddPurchase} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              <div>
                <label className="block text-sm font-bold mb-1">تصنيف المصروف *</label>
                <select className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-[#c5a059] font-bold" value={newPurchase.category} onChange={e => setNewPurchase({...newPurchase, category: e.target.value})}>
                  <option value="مواد خام">مواد خام (خشب، قماش، إسفنج...)</option>
                  <option value="صيانة وتشغيل">صيانة وتشغيل (قطع غيار، محروقات)</option>
                  <option value="نثريات وإدارية">نثريات وإدارية (وجبات، أدوات نظافة)</option>
                </select>
                {newPurchase.category === 'مواد خام' && <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1"><ShieldCheck size={12}/> تنبيه محاسبي: يجب ربط المواد الخام بمشروع إجبارياً.</p>}
              </div>

              <div><label className="block text-sm font-bold mb-1">البيان / اسم الصنف *</label><input required type="text" placeholder="مثال: خشب سويدي 5 متر" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059]" value={newPurchase.item_name} onChange={e => setNewPurchase({...newPurchase, item_name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">المبلغ (ر.س) *</label><input required type="number" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newPurchase.amount} onChange={e => setNewPurchase({...newPurchase, amount: e.target.value})} /></div>
              
              <div>
                <label className="block text-sm font-bold mb-1">ارتباط المشروع (من الطلبات المفتوحة)</label>
                <select 
                  required={newPurchase.category === 'مواد خام'} 
                  className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" 
                  value={newPurchase.project_id} 
                  onChange={e => setNewPurchase({...newPurchase, project_id: e.target.value})}
                >
                  <option value="">-- اختر المشروع (إجباري للخامات) --</option>
                  {projects.map(proj => {
                    const clientName = proj.customers?.full_name || 'عميل غير محدد';
                    const projectName = proj.project_name || 'طلب غير محدد';
                    return (
                      <option key={proj.id} value={proj.id}>
                        الطلب #{proj.id.toString().substring(0,6)} - {projectName} ({clientName})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">صورة الفاتورة / الإيصال (إلزامي) *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                  <input required type="file" accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  {selectedFile ? (
                    <div className="text-green-600 font-bold flex flex-col items-center gap-2"><CheckCircle size={24}/> تم إرفاق الملف: {selectedFile.name}</div>
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center gap-2"><UploadCloud size={24} className="text-[#c5a059]"/> اضغط هنا لرفع صورة الفاتورة أو ملف PDF</div>
                  )}
                </div>
              </div>
              
              <button type="submit" disabled={addLoading} className="w-full bg-[#1a2a3a] hover:bg-opacity-90 text-white font-bold py-3 rounded-xl flex justify-center mt-6 transition-all">{addLoading ? <Loader2 className="animate-spin" /> : 'رفع الفاتورة وحفظ المصروف'}</button>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تحويل عهدة جديدة (للمحاسب) */}
      {isPettyCashModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Wallet size={18} /> تسجيل عهدة مالية</h3>
              <button onClick={() => setIsPettyCashModalOpen(false)} className="hover:text-red-200"><X /></button>
            </div>
            <form onSubmit={handleAddPettyCash} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-blue-900">مبلغ العهدة المحول (ر.س) *</label>
                <input required type="number" placeholder="مثال: 5000" className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none focus:border-blue-500 font-num text-center text-lg font-black" value={newPettyCash.amount} onChange={e => setNewPettyCash({ amount: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">إيصال التحويل البنكي (إلزامي) *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                  <input required type="file" accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  {selectedFile ? (
                    <div className="text-green-600 font-bold flex flex-col items-center gap-2 text-sm"><CheckCircle size={20}/> تم إرفاق: {selectedFile.name}</div>
                  ) : (
                    <div className="text-gray-500 flex flex-col items-center gap-2 text-sm"><UploadCloud size={20} className="text-blue-500"/> ارفع صورة حوالة البنك</div>
                  )}
                </div>
              </div>
              
              <button type="submit" disabled={addLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex justify-center mt-6 transition-all">{addLoading ? <Loader2 className="animate-spin" /> : 'رفع وتسجيل العهدة'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};