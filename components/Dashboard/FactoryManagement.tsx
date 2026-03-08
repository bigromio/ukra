import React, { useState, useEffect } from 'react';
import { fetchWorkTickets, bulkCreateWorkTickets, deleteWorkTicket } from '../../services/apiService';
import { Factory, Users, Plus, Loader2, X, MapPin, CheckCircle, Clock, CalendarRange, Trash2 } from 'lucide-react';

export const FactoryManagement = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  
  const [newTicket, setNewTicket] = useState({
    worker_name: '', phone: '', daily_wage: '', start_date: '', end_date: '', start_time: '08:00', end_time: '17:00'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    const data = await fetchWorkTickets();
    setTickets(data);
    setLoading(false);
  };

  // --- دالة المعالجة الذكية لإنشاء التذاكر ---
  const handleCreateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    // 1. معالجة رقم الجوال (إذا كتبه 05 يحوله لـ 9665 تلقائياً)
    let formattedPhone = newTicket.phone.trim().replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) {
      formattedPhone = '966' + formattedPhone.substring(1);
    }

    const start = new Date(newTicket.start_date);
    const end = new Date(newTicket.end_date);
    const ticketsToInsert = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      ticketsToInsert.push({
        worker_name: newTicket.worker_name,
        phone: formattedPhone, // نحفظ الرقم المنسق
        daily_wage: parseFloat(newTicket.daily_wage) || 0,
        work_date: d.toLocaleDateString('en-CA'),
        start_time: newTicket.start_time,
        end_time: newTicket.end_time
      });
    }

    if (ticketsToInsert.length === 0) {
      alert('تاريخ النهاية يجب أن يكون مساوياً أو بعد تاريخ البداية.');
      setAddLoading(false);
      return;
    }

    const success = await bulkCreateWorkTickets(ticketsToInsert);

    if (success) {
      const attendanceLink = `https://ukra.sa/attendance/${formattedPhone}`;
      
      const message = `أهلاً بك يا ${newTicket.worker_name} 👋\n\n`
        + `تم تسجيل جدول عمل لك في مصنع UKRA للفترة من ${newTicket.start_date} إلى ${newTicket.end_date}\n`
        + `⏰ وقت الدوام: من ${newTicket.start_time} إلى ${newTicket.end_time}\n\n`
        + `📍 *رابط الحضور والانصراف الدائم الخاص بك:*\n`
        + `${attendanceLink}\n\n`
        + `(احتفظ بهذا الرابط، ستستخدمه كل يوم لتسجيل حضورك عند وصولك للمصنع وانصرافك منه)`;

      try {
        await fetch('http://167.86.73.97:8080/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formattedPhone, message: message })
        });
      } catch (err) {
        console.error('WhatsApp Error', err);
      }

      alert(`تم تسجيل ${ticketsToInsert.length} أيام عمل وإرسال الرابط الدائم بنجاح!`);
      setIsModalOpen(false);
      setNewTicket({ worker_name: '', phone: '', daily_wage: '', start_date: '', end_date: '', start_time: '08:00', end_time: '17:00' });
      loadTickets();
    } else {
      alert('حدث خطأ أثناء الإنشاء.');
    }
    setAddLoading(false);
  };

  // --- دالة الإلغاء المتقدمة ---
  const handleCancelTicket = async (ticket: any) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء يوم العمل (${ticket.work_date}) للعامل ${ticket.worker_name}؟\nسيتم إرسال إشعار اعتذار له عبر الواتساب ولن يتمكن من تسجيل الدخول.`)) {
      return;
    }

    setCancelLoading(ticket.id);

    // 1. إرسال رسالة الإلغاء عبر الواتساب
    const message = `مرحباً ${ticket.worker_name}،\n\n`
      + `نود إعلامك بأنه تم **إلغاء** يوم العمل المقرر لك بتاريخ ${ticket.work_date}.\n`
      + `نعتذر عن الإزعاج ونتمنى لك التوفيق، وفي حال وجود أيام عمل أخرى في جدولك ستبقى كما هي.`;

    try {
      await fetch('http://167.86.73.97:8080/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ticket.phone, message: message })
      });
    } catch (e) {
      console.error('WhatsApp Cancel Error', e);
    }

    // 2. مسح التذكرة من قاعدة البيانات (حتى لا تظهر في رابط الحضور)
    const success = await deleteWorkTicket(ticket.id);
    if (success) {
      alert('تم إلغاء يوم العمل بنجاح وتم إشعار العامل.');
      loadTickets();
    } else {
      alert('حدث خطأ أثناء إلغاء التذكرة في قاعدة البيانات.');
    }
    setCancelLoading(null);
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c5a059]" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-tajawal" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#1a2a3a] flex items-center gap-2">
          <Factory className="text-[#c5a059]" /> إدارة عمالة المصنع
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-[#1a2a3a] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-bold w-full md:w-auto">
          <CalendarRange size={18} /> جدولة أيام عمل
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
            <tr>
              <th className="p-4 rounded-r-lg">الاسم</th>
              <th className="p-4">تاريخ العمل</th>
              <th className="p-4">الأجرة</th>
              <th className="p-4">أوقات التسجيل</th>
              <th className="p-4 rounded-l-lg text-center">الإجراءات والحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-[#1a2a3a]">{ticket.worker_name}<br/><span className="text-xs text-gray-400 font-num" dir="ltr">{ticket.phone}</span></td>
                <td className="p-4 text-sm"><span className="font-num font-bold text-[#c5a059]">{ticket.work_date}</span><br/><span className="text-xs text-gray-500 font-num">{ticket.start_time} - {ticket.end_time}</span></td>
                <td className="p-4 font-black font-num text-[#1a2a3a]">{ticket.daily_wage} <span className="text-xs text-gray-400 font-normal">ر.س</span></td>
                <td className="p-4 text-xs font-num text-gray-500 space-y-1">
                  {ticket.check_in_time ? <div className="text-blue-600 font-bold">حضور: {new Date(ticket.check_in_time).toLocaleTimeString('ar-SA')}</div> : <div>حضور: -</div>}
                  {ticket.check_out_time ? <div className="text-green-600 font-bold">انصراف: {new Date(ticket.check_out_time).toLocaleTimeString('ar-SA')}</div> : <div>انصراف: -</div>}
                </td>
                <td className="p-4 flex items-center justify-center gap-2">
                  {/* إظهار حالة التذكرة أو زر الإلغاء إذا كانت لم تبدأ */}
                  {ticket.status === 'pending' && (
                    <>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={12}/> انتظار</span>
                      <button 
                        onClick={() => handleCancelTicket(ticket)} 
                        disabled={cancelLoading === ticket.id}
                        title="إلغاء يوم العمل وإشعار العامل" 
                        className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition-colors border border-red-100"
                      >
                        {cancelLoading === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </>
                  )}
                  {ticket.status === 'checked_in' && <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><MapPin size={12}/> متواجد الآن</span>}
                  {ticket.status === 'completed' && <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> اكتمل</span>}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">لا توجد عمالة مجدولة حالياً.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1a2a3a] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Users className="text-[#c5a059]" /> جدولة عمالة يومية</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400"><X /></button>
            </div>
            <form onSubmit={handleCreateTickets} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div><label className="block text-sm font-bold mb-1">اسم العامل *</label><input required type="text" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059]" value={newTicket.worker_name} onChange={e => setNewTicket({...newTicket, worker_name: e.target.value})} /></div>
              
              {/* الملاحظة التوضيحية لمدير المصنع */}
              <div>
                <label className="block text-sm font-bold mb-1">رقم الجوال (بدون رمز الدولة) *</label>
                <input required type="text" placeholder="مثال: 0540070093" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num text-right" value={newTicket.phone} onChange={e => setNewTicket({...newTicket, phone: e.target.value})} />
                <p className="text-[10px] text-gray-400 mt-1">اكتب الرقم بشكل طبيعي، النظام سيحوله تلقائياً للواتساب.</p>
              </div>
              
              <div><label className="block text-sm font-bold mb-1">يومية العامل (ر.س) *</label><input required type="number" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.daily_wage} onChange={e => setNewTicket({...newTicket, daily_wage: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">من تاريخ *</label><input required type="date" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.start_date} onChange={e => setNewTicket({...newTicket, start_date: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">إلى تاريخ *</label><input required type="date" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.end_date} onChange={e => setNewTicket({...newTicket, end_date: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">وقت البدء *</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.start_time} onChange={e => setNewTicket({...newTicket, start_time: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">وقت الانصراف *</label><input required type="time" className="w-full border p-3 rounded-lg outline-none focus:border-[#c5a059] font-num" value={newTicket.end_time} onChange={e => setNewTicket({...newTicket, end_time: e.target.value})} /></div>
              </div>
              
              <button type="submit" disabled={addLoading} className="w-full bg-[#c5a059] hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex justify-center mt-6 shadow-lg shadow-[#c5a059]/30 transition-all">
                {addLoading ? <Loader2 className="animate-spin" /> : 'تسجيل الأيام وإرسال رابط الحضور'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};